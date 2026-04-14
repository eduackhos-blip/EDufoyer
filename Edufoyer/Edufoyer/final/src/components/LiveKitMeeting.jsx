import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { CheckCircle, Star, Clock, AlertCircle, Shield } from 'lucide-react';
import livekitService from '../services/livekitService';
import doubtService from '../services/doubtService';
import authService from '../services/authService';
import { containsProfanity, getProfanityErrorMessage } from '../utils/profanityFilter';
import { detectRecordingAttempts, detectVisibilityChanges, getRecordingWarningMessage, addAntiRecordingIndicators } from '../utils/screenRecordingDetector';

// A compact LiveKit meeting page built for React (Vite) + Node backend
// - Requires: VITE_LIVEKIT_URL in final/.env
// - Backend route: POST /api/livekit/generate-token (protected)

const LiveKitMeeting = () => {
  const { doubtId } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSolverRatingModal, setShowSolverRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [solverRating, setSolverRating] = useState(5);
  const [solverComment, setSolverComment] = useState('');
  const [completing, setCompleting] = useState(false);
  const [submittingSolverRating, setSubmittingSolverRating] = useState(false);
  const [isDoubter, setIsDoubter] = useState(false);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  const [hasSubmittedSolverRating, setHasSubmittedSolverRating] = useState(false);
  const [remainingSecs, setRemainingSecs] = useState(null);
  const [profanityWarning, setProfanityWarning] = useState(null);
  const [recordingWarning, setRecordingWarning] = useState(null);
  const [isScheduledDoubt, setIsScheduledDoubt] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [isScheduledTime, setIsScheduledTime] = useState(true);
  const chatInputRef = useRef(null);
  const recordingDetectionRef = useRef(null);

  const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

  // Simple auth guard: ensure a JWT exists in localStorage (skip for email links)
  useEffect(() => {
    const isEmailJoin = new URLSearchParams(window.location.search).get('email') === 'true';
    if (isEmailJoin) return;
    const jwt = localStorage.getItem('token');
    if (!jwt) {
      window.location.href = `/?next=${encodeURIComponent(`/dashboard/session/${doubtId || ''}`)}`;
    }
  }, [doubtId]);

  // Fetch a LiveKit token for this doubt
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        setError(null);
        const isEmailJoin = new URLSearchParams(window.location.search).get('email') === 'true';
        const res = isEmailJoin
          ? await livekitService.generateTokenForEmailJoin(doubtId)
          : await livekitService.generateToken(doubtId);
        if (!res?.success || !res?.token) {
          throw new Error(res?.message || 'Failed to generate LiveKit token');
        }
        setToken(res.token);
        setRoomName(res.roomName || `doubt-session-${doubtId}`);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (doubtId) fetchToken();
  }, [doubtId]);

  // Determine if current user is the doubter (asker) to allow rating
  useEffect(() => {
    const determineRole = async () => {
      try {
        const [user, doubt] = await Promise.all([
          authService.getProfile(),
          doubtService.getDoubtById(doubtId)
        ]);
        const currentUserId = user?.id || user?._id;
        const doubterId = doubt?.doubter_id || doubt?.doubter?._id;
        setIsDoubter(String(currentUserId) === String(doubterId));

        // Check if doubt is scheduled
        if (doubt?.is_scheduled && doubt?.scheduled_date) {
          setIsScheduledDoubt(true);
          const scheduledDate = new Date(doubt.scheduled_date);
          setScheduledDateTime(scheduledDate);
          
          // Check if current time is before scheduled time
          const now = new Date();
          setIsScheduledTime(now >= scheduledDate);
        }

        // Setup session timer based on category
        const category = doubt?.category || 'medium';
        const minutes = category === 'small' ? 20 : category === 'medium' ? 30 : 60;
        setRemainingSecs(minutes * 60);
      } catch {
        setIsDoubter(false);
      }
    };
    if (doubtId) determineRole();
  }, [doubtId]);

  // Countdown timer
  useEffect(() => {
    if (remainingSecs == null) return;
    if (remainingSecs <= 0) return;
    const t = setInterval(() => setRemainingSecs((s) => (s != null ? s - 1 : s)), 1000);
    return () => clearInterval(t);
  }, [remainingSecs]);

  // Auto prompt rating when timer reaches zero
  useEffect(() => {
    if (remainingSecs === 0 && isDoubter && !hasSubmittedRating) {
      setShowCompletionModal(true);
    }
  }, [remainingSecs, isDoubter, hasSubmittedRating]);

  // Intercept chat messages to filter abusive language
  useEffect(() => {
    const interceptChatMessages = () => {
      // Find chat input field
      const findChatInput = () => {
        // LiveKit chat input can be in various places
        const selectors = [
          'input[type="text"][placeholder*="message" i]',
          'textarea[placeholder*="message" i]',
          '[data-lk-chat-input]',
          'input[aria-label*="message" i]',
          '.lk-chat-form input',
          '.lk-chat-form textarea',
          'form input[type="text"]',
          'form textarea'
        ];

        for (const selector of selectors) {
          const inputs = document.querySelectorAll(selector);
          for (const input of inputs) {
            // Check if it's inside a chat panel
            if (input.closest('[data-lk-chat], .lk-chat, [class*="chat"]')) {
              return input;
            }
          }
        }
        return null;
      };

      const bindChatInput = () => {
        const chatInput = findChatInput();
        if (!chatInput || chatInput.hasAttribute('data-profanity-bound')) {
          return;
        }

        chatInput.setAttribute('data-profanity-bound', 'true');
        chatInputRef.current = chatInput;

        // Intercept form submission
        const chatForm = chatInput.closest('form');
        if (chatForm) {
          // Store original handler
          const originalSubmitHandler = chatForm.onsubmit;
          
          chatForm.addEventListener('submit', (e) => {
            const message = chatInput.value || chatInput.textContent || '';
            
            if (containsProfanity(message)) {
              // Block the message
              e.preventDefault();
              e.stopPropagation();
              
              const errorMsg = getProfanityErrorMessage();
              setProfanityWarning(errorMsg);
              
              // Clear the input
              chatInput.value = '';
              if (chatInput.textContent) chatInput.textContent = '';
              
              // Hide warning after 5 seconds
              setTimeout(() => setProfanityWarning(null), 5000);
              
              return false;
            }

            // If no profanity, allow submission
            // Don't prevent default, let the form submit normally
          }, true);
        }

        // Also intercept Enter key
        chatInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            const message = chatInput.value || chatInput.textContent || '';
            
            if (containsProfanity(message)) {
              e.preventDefault();
              e.stopPropagation();
              
              const errorMsg = getProfanityErrorMessage();
              setProfanityWarning(errorMsg);
              
              // Clear the input
              chatInput.value = '';
              if (chatInput.textContent) chatInput.textContent = '';
              
              // Hide warning after 5 seconds
              setTimeout(() => setProfanityWarning(null), 5000);
              
              return false;
            }
          }
        }, true);

        // Intercept send button clicks
        const sendButton = chatForm?.querySelector('button[type="submit"], button[aria-label*="send" i], [data-lk-send]');
        if (sendButton) {
          sendButton.addEventListener('click', (e) => {
            const message = chatInput.value || chatInput.textContent || '';
            
            if (containsProfanity(message)) {
              e.preventDefault();
              e.stopPropagation();
              
              const errorMsg = getProfanityErrorMessage();
              setProfanityWarning(errorMsg);
              
              // Clear the input
              chatInput.value = '';
              if (chatInput.textContent) chatInput.textContent = '';
              
              // Hide warning after 5 seconds
              setTimeout(() => setProfanityWarning(null), 5000);
              
              return false;
            }
          }, true);
        }
      };

      // Try to bind immediately
      bindChatInput();

      // Also observe for dynamically added chat elements
      const observer = new MutationObserver(() => {
        bindChatInput();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      return () => {
        observer.disconnect();
      };
    };

    // Wait a bit for LiveKit to render
    const timeout = setTimeout(() => {
      interceptChatMessages();
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [token]);

  // Screen recording detection and prevention (only for external recording, not screen share/tab switch)
  useEffect(() => {
    if (!token) return;

    // Add anti-recording indicators (visual watermarks only)
    addAntiRecordingIndicators();

    // Detect recording attempts (but allow screen share and tab switching)
    const detection = detectRecordingAttempts();
    recordingDetectionRef.current = detection;

    // Don't monitor visibility changes - tab switching is allowed
    // const handleVisibilityChange = (info) => {
    //   // Tab switching is allowed, no warning needed
    // };
    // detectVisibilityChanges(handleVisibilityChange); // Commented out

    // Periodic check for external recording (but exclude screen share and tab switch)
    const checkInterval = setInterval(() => {
      if (detection.isRecording && detection.methods.length > 0) {
        // Only warn for external recording methods, not screen share or tab switch
        // getDisplayMedia is allowed for legitimate screen sharing
        const allowedMethods = ['Screen Sharing', 'Tab Switch', 'getDisplayMedia'];
        const filteredMethods = detection.methods.filter(m => !allowedMethods.includes(m));
        
        if (filteredMethods.length > 0) {
          const warning = getRecordingWarningMessage(filteredMethods);
          setRecordingWarning(warning);
        }
      }
    }, 3000); // Check every 3 seconds

    // Don't intercept getDisplayMedia API - screen sharing is allowed
    // if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    //   // Screen sharing is allowed, no interception needed
    // }

    // Detect DevTools (external recording indicator)
    let devtools = {
      open: false,
      orientation: null
    };

    const devtoolsCheck = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        if (!devtools.open) {
          devtools.open = true;
          // Only warn if DevTools is used for recording, not for debugging
          const warning = getRecordingWarningMessage(['Developer Tools']);
          setRecordingWarning(warning);
          // Auto-hide after 5 seconds
          setTimeout(() => setRecordingWarning(null), 5000);
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    return () => {
      clearInterval(checkInterval);
      clearInterval(devtoolsCheck);
    };
  }, [token]);

  // Ensure built-in LiveKit Leave button redirects (solver) or opens rating (asker without rating)
  useEffect(() => {
    const onLeaveClick = (e) => {
      try {
        if (isDoubter && !hasSubmittedRating) {
          // Block asker from leaving until rating
          e.stopPropagation();
          e.preventDefault();
          setShowCompletionModal(true);
          return false;
        }
        if (!isDoubter && !hasSubmittedSolverRating) {
          // Block solver from leaving until rating asker
          e.stopPropagation();
          e.preventDefault();
          setShowSolverRatingModal(true);
          return false;
        }
        // Both have rated → redirect
        setTimeout(() => navigate('/dashboard'), 0);
      } catch {}
    };

    const bindIfPresent = () => {
      const btn = document.querySelector('[data-lk-leave], button[title="Leave"], [aria-label="Leave"]');
      if (btn) {
        // Remove any previous handler to avoid duplicates
        btn.removeEventListener('click', onLeaveClick, true);
        btn.addEventListener('click', onLeaveClick, true);
        return true;
      }
      return false;
    };

    // Try now and also observe for future mounts
    bindIfPresent();
    const observer = new MutationObserver(() => bindIfPresent());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const btn = document.querySelector('[data-lk-leave], button[title="Leave"], [aria-label="Leave"]');
      if (btn) btn.removeEventListener('click', onLeaveClick, true);
    };
  }, [isDoubter, hasSubmittedRating, hasSubmittedSolverRating, navigate]);

  // Listen for custom events from script
  useEffect(() => {
    const handleRatePrompt = () => {
      if (isDoubter && !hasSubmittedRating) {
        setShowCompletionModal(true);
      }
    };
    
    const handleSolverRatePrompt = () => {
      if (!isDoubter && !hasSubmittedSolverRating) {
        setShowSolverRatingModal(true);
      }
    };

    window.addEventListener('EF_RATE_PROMPT', handleRatePrompt);
    window.addEventListener('EF_SOLVER_RATE_PROMPT', handleSolverRatePrompt);

    return () => {
      window.removeEventListener('EF_RATE_PROMPT', handleRatePrompt);
      window.removeEventListener('EF_SOLVER_RATE_PROMPT', handleSolverRatePrompt);
    };
  }, [isDoubter, hasSubmittedRating, hasSubmittedSolverRating]);

  const handleCompleteDoubt = async () => {
    try {
      setCompleting(true);
      // Student submits feedback instead of solver completing
      await doubtService.submitFeedback(doubtId, { rating, comment });
      setHasSubmittedRating(true);
      
      // Show success message and redirect to main dashboard
      alert('Doubt completed successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const handleSolverRating = async () => {
    try {
      setSubmittingSolverRating(true);
      // Solver submits rating for asker
      await doubtService.submitSolverRating(doubtId, { rating: solverRating, comment: solverComment });
      setHasSubmittedSolverRating(true);
      
      // Show success message and redirect to main dashboard
      alert('Rating submitted successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting solver rating:', error);
      alert('Failed to submit rating. Please try again.');
    } finally {
      setSubmittingSolverRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div>Initializing session…</div>
      </div>
    );
  }

  if (error || !LIVEKIT_URL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-center p-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Session Error</h2>
          <p className="text-gray-300 mb-4">{error || 'LiveKit URL not configured'}</p>
          <button
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            onClick={() => navigate('/dashboard/doubts')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div>Waiting for token…</div>
      </div>
    );
  }

  // Show scheduled time message if it's not time yet
  if (isScheduledDoubt && !isScheduledTime && scheduledDateTime) {
    const formattedDate = scheduledDateTime.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = scheduledDateTime.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Session Scheduled</h2>
          <p className="text-gray-300 mb-6">
            This session is scheduled for:
          </p>
          <div className="bg-purple-800 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold">{formattedDate}</p>
            <p className="text-xl font-bold mt-2">{formattedTime}</p>
          </div>
          <p className="text-gray-400 text-sm">
            The meeting link will be active at the scheduled time. You'll receive an email notification when it's time to join.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      data-lk-theme="default" 
      className="h-screen bg-black relative"
      onContextMenu={(e) => {
        // Prevent right-click on the entire meeting area
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          return false;
        }
      }}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      <LiveKitRoom
        token={token}
        serverUrl={LIVEKIT_URL}
        connectOptions={{ autoSubscribe: true }}
        audio
        video
        onError={(e) => setError(e?.message || 'LiveKit error')}
        onDisconnected={() => {
          // If asker leaves without rating, prompt rating. Otherwise redirect to dashboard
          if (isDoubter && !hasSubmittedRating) {
            setShowCompletionModal(true);
          } else {
            navigate('/dashboard');
          }
        }}
        className="h-full"
      >
        <VideoConference />
      </LiveKitRoom>

      {/* Profanity Warning Toast */}
      {profanityWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] bg-red-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{profanityWarning}</span>
        </div>
      )}

      {/* Screen Recording Warning Toast */}
      {recordingWarning && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-[60] bg-orange-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in">
          <Shield className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{recordingWarning}</span>
        </div>
      )}

      {/* Visual Watermark Overlay - Anti-Recording */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        <div 
          className={`absolute left-4 text-white/30 text-xs font-mono select-none ${
            remainingSecs != null && remainingSecs > 0 ? 'top-16' : 'top-4'
          }`}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          EduFoyer Session - {new Date().toISOString().split('T')[0]}
        </div>
        <div 
          className="absolute bottom-4 right-4 text-white/30 text-xs font-mono select-none"
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          Private Session - Do Not Record
        </div>
        {/* Diagonal watermark pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.1) 100px, rgba(255,255,255,0.1) 200px)',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        />
      </div>

      {/* Session timer top-left */}
      {remainingSecs != null && remainingSecs > 0 && (
        <div className="absolute top-4 left-4 z-50 bg-black/70 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="font-mono font-semibold">{Math.floor(remainingSecs/60)}:{String(remainingSecs%60).padStart(2,'0')}</span>
        </div>
      )}
      
      {/* Rating button visible only to solver */}
      {!isDoubter && !hasSubmittedSolverRating && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setShowSolverRatingModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <CheckCircle className="w-4 h-4" />
            Rate Asker & Leave
          </button>
        </div>
      )}

      {/* Intercept built-in Leave: block askers until rating, redirect solvers */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          const tryBind = () => {
            const btn = document.querySelector('[data-lk-leave], button[title="Leave"], [aria-label="Leave"]');
            if (!btn || btn.getAttribute('data-nav-bound')) return;
            btn.setAttribute('data-nav-bound','1');
            btn.addEventListener('click', function(e){
              try {
                const isDoubter = ${JSON.stringify(true)} && ${isDoubter ? 'true' : 'false'};
                const hasRated = ${hasSubmittedRating ? 'true' : 'false'};
                const hasSolverRated = ${hasSubmittedSolverRating ? 'true' : 'false'};
                if (isDoubter && !hasRated) {
                  e.stopPropagation();
                  e.preventDefault();
                  const evt = new CustomEvent('EF_RATE_PROMPT');
                  window.dispatchEvent(evt);
                  return false;
                } else if (!isDoubter && !hasSolverRated) {
                  e.stopPropagation();
                  e.preventDefault();
                  const evt = new CustomEvent('EF_SOLVER_RATE_PROMPT');
                  window.dispatchEvent(evt);
                  return false;
                } else {
                  setTimeout(function(){ window.history.pushState({}, '', '/dashboard'); window.location.assign('/dashboard'); }, 0);
                }
              } catch(_) {}
            }, true);
          };
          const obs = new MutationObserver(tryBind);
          obs.observe(document.body, { childList: true, subtree: true });
          tryBind();
        })();
      ` }} />

      {/* Completion Modal for Asker */}
      {isDoubter && showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Complete Doubt Session</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate the session (1-5)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any feedback about the session..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                disabled={completing}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteDoubt}
                disabled={completing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {completing ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solver Rating Modal */}
      {!isDoubter && showSolverRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Rate the Asker</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate the asker (1-5)
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSolverRating(star)}
                    className={`p-1 ${solverRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (optional)
              </label>
              <textarea
                value={solverComment}
                onChange={(e) => setSolverComment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Any feedback about the asker..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSolverRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                disabled={submittingSolverRating}
              >
                Cancel
              </button>
              <button
                onClick={handleSolverRating}
                disabled={submittingSolverRating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingSolverRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveKitMeeting;




