import React, { useState } from 'react';
import { CheckCircle, Video, User, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SolverAcceptanceNotification = ({ 
  isVisible, 
  onClose, 
  doubtId, 
  solverName, 
  doubtTitle,
  sessionUrl 
}) => {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinSession = async () => {
    setIsJoining(true);
    try {
      // Navigate to session page
      navigate(`/dashboard/session/${doubtId}`);
    } catch (error) {
      console.error('Error joining session:', error);
    } finally {
      setIsJoining(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-t-xl p-4 text-white transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white/20 dark:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Solver Found!</h3>
                <p className="text-green-100 dark:text-green-200 text-xs">Your doubt has been accepted</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 dark:text-white/90 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors">
              <User className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1 transition-colors">
              {solverName || 'A Solver'} has accepted your doubt
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
              "{doubtTitle}" is ready to be solved
            </p>
          </div>

          {/* Session Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4 transition-colors">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 mb-2 transition-colors">
              <Video className="w-3.5 h-3.5" />
              <span className="font-medium text-sm">Session Details</span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 transition-colors">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3" />
                <span className="text-xs">Session is ready to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3" />
                <span className="text-xs">Solver: {solverName || 'Available'}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleJoinSession}
            disabled={isJoining}
            className="w-full bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
          >
            {isJoining ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Joining Session...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>Join Session Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolverAcceptanceNotification;



