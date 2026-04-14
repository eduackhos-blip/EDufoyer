import React, { useState } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, Clock, Bell } from 'lucide-react';
import AwaitingSolverPage from './AwaitingSolverPage';
import SolverAcceptanceNotification from './SolverAcceptanceNotification';

const AwaitingSolverDemo = () => {
  const [demoStep, setDemoStep] = useState('form');
  const [showNotification, setShowNotification] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const mockDoubtId = 'demo-doubt-123';
  const mockDoubt = {
    _id: mockDoubtId,
    subject: 'JavaScript Closures',
    category: 'medium',
    description: 'I am having trouble understanding how closures work in JavaScript. Can someone explain with examples?',
    status: 'open',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    doubter_id: 'user123'
  };

  const mockNotifications = [
    {
      _id: 'notif1',
      doubt_id: mockDoubtId,
      message_type: 'DOUBT_SUBMITTED',
      content: 'Your doubt "JavaScript Closures" has been submitted successfully and is awaiting a solver.',
      is_read: true,
      createdAt: new Date(Date.now() - 5 * 60 * 1000)
    },
    {
      _id: 'notif2',
      doubt_id: mockDoubtId,
      message_type: 'DOUBT_ASSIGNED',
      content: 'Solver assigned for "JavaScript Closures". Join the session: /dashboard/session/demo-doubt-123',
      is_read: false,
      createdAt: new Date()
    }
  ];

  const startDemo = () => {
    setIsPlaying(true);
    setDemoStep('awaiting');
    
    // Simulate solver acceptance after 3 seconds
    setTimeout(() => {
      setShowNotification(true);
    }, 3000);
  };

  const resetDemo = () => {
    setDemoStep('form');
    setShowNotification(false);
    setIsPlaying(false);
  };

  const handleNotificationClose = () => {
    setShowNotification(false);
    setDemoStep('session');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Awaiting Solver Flow Demo</h1>
              <p className="text-gray-600 text-sm">Interactive demonstration of the awaiting solver experience</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={startDemo}
                disabled={isPlaying}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <Play className="w-4 h-4" />
                <span>Start Demo</span>
              </button>
              <button
                onClick={resetDemo}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Steps */}
      {demoStep === 'form' && (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Step 1: Submit Doubt</h2>
              <p className="text-gray-600 mb-6">
                User fills out the doubt form and submits it. After submission, they are redirected to the awaiting page.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-800 mb-3">Mock Doubt Details:</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Subject:</span> JavaScript Closures</div>
                  <div><span className="font-medium">Category:</span> Medium</div>
                  <div><span className="font-medium">Description:</span> I am having trouble understanding how closures work in JavaScript...</div>
                </div>
              </div>

              <button
                onClick={startDemo}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Simulate Doubt Submission
              </button>
            </div>
          </div>
        </div>
      )}

      {demoStep === 'awaiting' && (
        <div className="relative">
          {/* Overlay to show this is a demo */}
          <div className="absolute top-4 right-4 z-50">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-800 font-medium">Demo Mode</span>
              </div>
            </div>
          </div>
          
          {/* Mock the awaiting page with demo data */}
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Awaiting Solver</h1>
                    <p className="text-gray-600 mt-1">Your doubt is waiting for a solver to accept it</p>
                  </div>
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Polling for updates...</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Status Card */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-10 h-10 text-blue-500" />
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Solver</h2>
                      <p className="text-gray-600 mb-6">
                        Your doubt has been submitted and is being matched with available solvers.
                      </p>

                      {/* Doubt Details */}
                      <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                        <h3 className="font-semibold text-gray-800 mb-2">Doubt Details</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm text-gray-600">Subject:</span>
                            <span className="ml-2 font-medium">{mockDoubt.subject}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Category:</span>
                            <span className="ml-2 font-medium capitalize">{mockDoubt.category}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Description:</span>
                            <p className="mt-1 text-sm text-gray-700">{mockDoubt.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Time Elapsed */}
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-center space-x-2 text-blue-700">
                          <Clock className="w-5 h-5" />
                          <span className="font-semibold">Time Elapsed: 5m 23s</span>
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-yellow-700">
                          <Clock className="w-5 h-5" />
                          <span className="font-medium">Please wait while we find a suitable solver for your doubt.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications Sidebar */}
                <div className="space-y-6">
                  {/* Live Notifications */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Bell className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-800">Live Updates</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {mockNotifications.map((notification) => (
                        <div
                          key={notification._id}
                          className={`p-3 rounded-lg border ${
                            notification.message_type === 'DOUBT_ASSIGNED'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {notification.message_type === 'DOUBT_ASSIGNED' ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                            ) : (
                              <Bell className="w-4 h-4 text-blue-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">What happens next?</h3>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-blue-600">1</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Solver Notification</p>
                          <p className="text-xs text-gray-600">Available solvers are notified about your doubt</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-green-600">2</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Solver Accepts</p>
                          <p className="text-xs text-gray-600">A solver reviews and accepts your doubt</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-blue-600">3</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">Session Starts</p>
                          <p className="text-xs text-gray-600">You'll be redirected to the solving session</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {demoStep === 'session' && (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Step 3: Session Started</h2>
              <p className="text-gray-600 mb-6">
                The solver has accepted your doubt and you've been redirected to the session page.
              </p>
              
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Session Details:</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <div><span className="font-medium">Solver:</span> John Doe (JavaScript Expert)</div>
                  <div><span className="font-medium">Session ID:</span> session-123</div>
                  <div><span className="font-medium">Status:</span> Active</div>
                </div>
              </div>

              <button
                onClick={resetDemo}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Solver Acceptance Notification */}
      <SolverAcceptanceNotification
        isVisible={showNotification}
        onClose={handleNotificationClose}
        doubtId={mockDoubtId}
        solverName="John Doe"
        doubtTitle={mockDoubt.subject}
      />
    </div>
  );
};

export default AwaitingSolverDemo;



