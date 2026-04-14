import React, { useState } from 'react';
import { Play, CheckCircle, Clock, Bell, User } from 'lucide-react';

const TestAwaitingFlow = () => {
  const [currentStep, setCurrentStep] = useState('start');
  const [showNotification, setShowNotification] = useState(false);

  const startTest = () => {
    setCurrentStep('awaiting');
    
    // Simulate solver acceptance after 5 seconds
    setTimeout(() => {
      setShowNotification(true);
    }, 5000);
  };

  const handleAcceptSession = () => {
    setShowNotification(false);
    setCurrentStep('session');
  };

  const resetTest = () => {
    setCurrentStep('start');
    setShowNotification(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800">Test Awaiting Solver Flow</h1>
          <p className="text-gray-600 mt-1">Interactive test of the awaiting solver experience</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {currentStep === 'start' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to Test?</h2>
              <p className="text-gray-600 mb-6">
                This will simulate the complete awaiting solver flow:
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-800 mb-3">Test Flow:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">1</span>
                    </div>
                    <span>Show awaiting solver page with mock doubt</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">2</span>
                    </div>
                    <span>Display real-time polling and notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">3</span>
                    </div>
                    <span>Simulate solver acceptance notification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">4</span>
                    </div>
                    <span>Show session redirect option</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startTest}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Start Test Flow
              </button>
            </div>
          </div>
        )}

        {currentStep === 'awaiting' && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Test Mode: Awaiting Solver (Solver will accept in 5 seconds)</span>
              </div>
            </div>

            {/* Mock Awaiting Page */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 text-blue-500" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Waiting for Solver</h2>
                <p className="text-gray-600 mb-6">
                  Your doubt has been submitted and is being matched with available solvers.
                </p>

                {/* Mock Doubt Details */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                  <h3 className="font-semibold text-gray-800 mb-2">Doubt Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Subject:</span>
                      <span className="ml-2 font-medium">JavaScript Closures</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="ml-2 font-medium capitalize">Medium</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Description:</span>
                      <p className="mt-1 text-sm text-gray-700">I am having trouble understanding how closures work in JavaScript. Can someone explain with examples?</p>
                    </div>
                  </div>
                </div>

                {/* Time Elapsed */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Time Elapsed: 2m 15s</span>
                  </div>
                </div>

                {/* Live Updates */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Bell className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-800">Live Updates</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Bell className="w-4 h-4 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            Your doubt "JavaScript Closures" has been submitted successfully and is awaiting a solver.
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            2 minutes ago
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <div className="flex items-center space-x-2 text-yellow-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Please wait while we find a suitable solver for your doubt.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'session' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Started!</h2>
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
                onClick={resetTest}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Test Again
              </button>
            </div>
          </div>
        )}

        {/* Solver Acceptance Notification */}
        {showNotification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-t-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Solver Found!</h3>
                      <p className="text-green-100 text-sm">Your doubt has been accepted</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">
                    John Doe has accepted your doubt
                  </h4>
                  <p className="text-gray-600">
                    "JavaScript Closures" is ready to be solved
                  </p>
                </div>

                {/* Session Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Session Details</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>Session is ready to start</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span>Solver: John Doe</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleAcceptSession}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Join Session Now</span>
                  </button>
                  
                  <button
                    onClick={() => setShowNotification(false)}
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Join Later
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    💡 You can also join the session from your dashboard anytime
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAwaitingFlow;







