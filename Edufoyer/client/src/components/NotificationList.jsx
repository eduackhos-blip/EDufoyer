import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, MessageSquare, AlertTriangle, Clock, User, Video, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../services/notificationService';
import DarkModeToggle from './DarkModeToggle';

// Simple date formatting function
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

const NotificationList = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const linkifyText = (text) => {
    if (!text) return text;
    const urlRegex = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/g;
    const parts = String(text).split(urlRegex);
    return parts.map((part, idx) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`url-${idx}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline break-all transition-colors"
          >
            {part}
          </a>
        );
      }
      return <span key={`text-${idx}`}>{part}</span>;
    });
  };

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (isMarkingRead) return;
    
    setIsMarkingRead(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to mark notifications as read.');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const getNotificationIcon = (messageType) => {
    switch (messageType) {
      case 'ASSIGNED_TO_SOLVER':
        return <User className="h-5 w-5 text-blue-400" />;
      case 'SOLUTION_SUBMITTED':
        return <MessageSquare className="h-5 w-5 text-yellow-400" />;
      case 'SOLUTION_ACCEPTED':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'DOUBT_SUBMITTED':
        return <Bell className="h-5 w-5 text-blue-400" />;
      case 'DOUBT_ASSIGNED':
        return <User className="h-5 w-5 text-green-400" />;
      case 'DOUBT_AVAILABLE':
        return <Bell className="h-5 w-5 text-yellow-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center transition-colors duration-300">
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400 mx-auto mb-2" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchNotifications} 
          className="mt-3 text-blue-500 dark:text-blue-400 hover:underline text-sm transition-colors">
          Try again
        </button>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="px-6 pt-2 md:pt-4 pb-10 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden w-full max-w-7xl mx-auto mt-0 transition-colors duration-300">
      {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center transition-colors duration-300">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs px-2 py-0.5 rounded-full transition-colors duration-300">
                  {unreadCount} new
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isMarkingRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
              >
                {isMarkingRead ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
            <DarkModeToggle />
          </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No notifications yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Updates about your doubts will appear here.
          </p>
        </div>
      ) : (
        <div className="max-h-[80vh] overflow-y-auto pb-6">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-300 ${
                !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}>
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.message_type)}
              </div>
              <div className="flex-1">
                <p className={`text-sm transition-colors duration-300 ${
                  !notification.is_read ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {linkifyText(notification.content)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.is_read && (
                    <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default NotificationList;
