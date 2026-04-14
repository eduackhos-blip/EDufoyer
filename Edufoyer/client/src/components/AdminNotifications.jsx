import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { 
  Bell, 
  CheckCircle, 
  Clock,
  UserPlus,
  Loader2,
  AlertCircle
} from 'lucide-react';

const AdminNotifications = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await adminService.getAdminNotifications();
      // Filter only SOLVER_REQUEST notifications
      const solverRequestNotifications = (data || []).filter(
        n => n.message_type === 'SOLVER_REQUEST'
      );
      setNotifications(solverRequestNotifications);
      setUnreadCount(solverRequestNotifications.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await adminService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (messageType) => {
    if (messageType === 'DOUBT_SUBMITTED' || messageType.includes('SOLVER') || messageType === 'SOLVER_REQUEST') {
      return <UserPlus className="w-5 h-5 text-indigo-600" />;
    }
    return <Bell className="w-5 h-5 text-blue-600" />;
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-white/50 backdrop-blur-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bell className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
              <p className="text-gray-600 text-sm mt-1">Solver request notifications</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentNotifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification._id);
                  }
                  if (onNotificationClick) {
                    onNotificationClick(notification);
                  }
                }}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-indigo-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getNotificationIcon(notification.message_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notification.content}
                      </p>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 5 && (
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-sm text-gray-600">
            Showing 5 of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;

