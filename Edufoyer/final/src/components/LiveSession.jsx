import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, MicOff, VideoOff, Phone, Users, MessageCircle } from 'lucide-react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';
import livekitService from '../services/livekitService';
import { useParams, useNavigate } from 'react-router-dom';

const LiveSession = () => {
  const { doubtId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [localParticipant, setLocalParticipant] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    // Check if this is an email-based session join (no auth required)
    const urlParams = new URLSearchParams(window.location.search);
    const isEmailJoin = urlParams.get('email') === 'true';
    
    if (!isEmailJoin) {
      // Require auth: if no JWT in localStorage, send to login with return path
      const jwt = localStorage.getItem('token');
      if (!jwt) {
        console.log('No authentication token found, redirecting to login');
        window.location.href = `/?next=${encodeURIComponent(`/dashboard/session/${doubtId || ''}`)}`;
        return;
      }
    }

    // Validate token format (only if not email join)
    if (!isEmailJoin) {
      const jwt = localStorage.getItem('token');
      try {
        const tokenParts = jwt.split('.');
        if (tokenParts.length !== 3) {
          console.log('Invalid token format, redirecting to login');
          localStorage.removeItem('token');
          window.location.href = `/?next=${encodeURIComponent(`/dashboard/session/${doubtId || ''}`)}`;
          return;
        }
      } catch (error) {
        console.log('Token validation failed, redirecting to login');
        localStorage.removeItem('token');
        window.location.href = `/?next=${encodeURIComponent(`/dashboard/session/${doubtId || ''}`)}`;
        return;
      }
    }

    if (doubtId) {
      initializeSession();
    }

    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [doubtId]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check server health first
      try {
        const healthResponse = await fetch('/health');
        if (!healthResponse.ok) {
          throw new Error('Server is not responding properly');
        }
      } catch (healthError) {
        console.warn('Server health check failed:', healthError);
        // Continue anyway, might be a temporary issue
      }

      // Check if this is an email-based session join
      const urlParams = new URLSearchParams(window.location.search);
      const isEmailJoin = urlParams.get('email') === 'true';
      
      let tokenData;
      
      if (isEmailJoin) {
        // For email-based joins, use a special endpoint that doesn't require auth
        const tokenPromise = livekitService.generateTokenForEmailJoin(doubtId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token generation timeout')), 15000)
        );
        tokenData = await Promise.race([tokenPromise, timeoutPromise]);
      } else {
        // For authenticated joins, use the regular endpoint
        const tokenPromise = livekitService.generateToken(doubtId);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Token generation timeout')), 15000)
        );
        tokenData = await Promise.race([tokenPromise, timeoutPromise]);
      }
      
      // Add better error handling for undefined response
      if (!tokenData) {
        throw new Error('No response received from server');
      }
      
      // Check if tokenData is undefined or null
      if (tokenData === undefined) {
        console.error('TokenData is undefined');
        throw new Error('Server returned undefined response');
      }
      
      if (tokenData === null) {
        console.error('TokenData is null');
        throw new Error('Server returned null response');
      }
      
      // Check if tokenData is an object
      if (typeof tokenData !== 'object') {
        console.error('TokenData is not an object:', typeof tokenData);
        throw new Error('Server returned invalid response format');
      }
      
      // Final safety check before accessing tokenData.success
      if (tokenData === undefined || tokenData === null) {
        console.error('TokenData is undefined/null at final check');
        throw new Error('Server returned invalid response');
      }

      if (!tokenData.success) {
        throw new Error(tokenData.message || 'Failed to generate session token');
      }

      // Create room instance
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [
            { width: 640, height: 360, encoding: { maxBitrate: 200_000 } },
            { width: 1280, height: 720, encoding: { maxBitrate: 500_000 } },
          ],
        },
      });

      // Set up event listeners
      newRoom.on(RoomEvent.Connected, () => {
        console.log('Connected to room');
        setIsConnected(true);
        setLocalParticipant(newRoom.localParticipant);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        setIsConnected(false);
        navigate('/dashboard/doubts');
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
        setParticipants(prev => [...prev, participant]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
        setParticipants(prev => prev.filter(p => p.identity !== participant.identity));
      });

      newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log('Track subscribed:', track.kind, participant.identity);
        if (track.kind === 'video') {
          const videoElement = participant.isLocal ? videoRef.current : remoteVideoRef.current;
          if (videoElement) {
            track.attach(videoElement);
          }
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        console.log('Track unsubscribed:', track.kind, participant.identity);
        track.detach();
      });

      // Connect to room (use Vite env var)
      const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-project.livekit.cloud';
      await newRoom.connect(LIVEKIT_URL, tokenData.token);
      
      setRoom(newRoom);
      
      // Enable camera and microphone
      await newRoom.localParticipant.enableCameraAndMicrophone();
      
    } catch (error) {
      console.error('Error initializing session:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to start live session';
      
      if (error.message.includes('timeout')) {
        errorMessage = 'Session connection timed out. Please try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('No response received')) {
        errorMessage = 'Server is not responding. Please try again later.';
      } else if (error.message.includes('Invalid response format')) {
        errorMessage = 'Server returned invalid response. Please try again.';
      } else if (error.message.includes('Authentication failed') || error.message.includes('Access token required')) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Redirect to login after a short delay
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = `/?next=${encodeURIComponent(`/dashboard/session/${doubtId || ''}`)}`;
        }, 2000);
      } else {
        errorMessage = error.message || 'Failed to start live session';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = async () => {
    if (!room) return;
    
    try {
      if (isMuted) {
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  const toggleVideo = async () => {
    if (!room) return;
    
    try {
      if (isVideoOff) {
        await room.localParticipant.setCameraEnabled(true);
        setIsVideoOff(false);
      } else {
        await room.localParticipant.setCameraEnabled(false);
        setIsVideoOff(true);
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  const endSession = async () => {
    if (room) {
      await room.disconnect();
    }
    navigate('/dashboard/doubts');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to live session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-white">
          <div className="bg-red-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Session Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard/doubts')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Live Session</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{participants.length + 1} participants</span>
            </div>
          </div>
          <button
            onClick={endSession}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Phone className="w-4 h-4" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
          {/* Local Video */}
          <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
              <span className="text-sm">You</span>
            </div>
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Remote Video */}
          <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {participants.length === 0 && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Waiting for participant...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full transition-colors ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-500'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
          
          <button
            onClick={endSession}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;

