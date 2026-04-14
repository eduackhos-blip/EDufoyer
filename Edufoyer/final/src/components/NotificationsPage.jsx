import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Share2, 
  Bookmark, 
  Users, 
  BookOpen, 
  Settings, 
  Check, 
  X, 
  MoreVertical,
  Clock,
  Star,
  AlertCircle,
  Info,
  Loader2,
  Filter,
  Search,
  CheckCircle
} from 'lucide-react';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationTypes = [
    { value: 'all', label: 'All', icon: Bell },
    { value: 'likes', label: 'Likes', icon: Heart },
    { value: 'comments', label: 'Comments', icon: MessageCircle },
    { value: 'friends', label: 'Friends', icon: UserPlus },
    { value: 'groups', label: 'Groups', icon: Users },
    { value: 'shares', label: 'Shares', icon: Share2 },
    { value: 'saves', label: 'Saves', icon: Bookmark }
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, searchTerm, selectedFilter]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      // This would be an API call to get notifications
      // const response = await notificationService.getNotifications();
      
      // Sample data for demonstration
      const sampleNotifications = [
        {
          _id: 1,
          type: 'like',
          title: 'Someone liked your post',
          message: 'Rahul Sharma liked your post about "Calculus Integration Techniques"',
          user: { name: 'Rahul Sharma', avatar: 'https://via.placeholder.com/40' },
          post: { id: 1, title: 'Calculus Integration Techniques' },
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          actionUrl: '/dashboard/social'
        },
        {
          _id: 2,
          type: 'comment',
          title: 'New comment on your post',
          message: 'Priya Singh commented: "This is really helpful! Thanks for sharing."',
          user: { name: 'Priya Singh', avatar: 'https://via.placeholder.com/40' },
          post: { id: 1, title: 'Calculus Integration Techniques' },
          isRead: false,
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          actionUrl: '/dashboard/social'
        },
        {
          _id: 3,
          type: 'friend_request',
          title: 'Friend request received',
          message: 'Amit Kumar wants to connect with you',
          user: { name: 'Amit Kumar', avatar: 'https://via.placeholder.com/40' },
          isRead: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          actionUrl: '/dashboard/social'
        },
        {
          _id: 4,
          type: 'group_invite',
          title: 'Study group invitation',
          message: 'You\'ve been invited to join "Advanced Mathematics Study Group"',
          user: { name: 'Dr. Sarah Wilson', avatar: 'https://via.placeholder.com/40' },
          group: { name: 'Advanced Mathematics Study Group' },
          isRead: true,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          actionUrl: '/dashboard/social'
        },
        {
          _id: 5,
          type: 'share',
          title: 'Your post was shared',
          message: 'Sneha Patel shared your post about "Physics Problem Solving"',
          user: { name: 'Sneha Patel', avatar: 'https://via.placeholder.com/40' },
          post: { id: 2, title: 'Physics Problem Solving' },
          isRead: true,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          actionUrl: '/dashboard/social'
        },
        {
          _id: 6,
          type: 'save',
          title: 'Your post was saved',
          message: 'Alex Johnson saved your post about "Data Structures"',
          user: { name: 'Alex Johnson', avatar: 'https://via.placeholder.com/40' },
          post: { id: 3, title: 'Data Structures' },
          isRead: true,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          actionUrl: '/dashboard/social'
        }
      ];
      
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Filter by type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(notification => notification.type === selectedFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId) => {
    try {
      // This would be an API call
      // await notificationService.markAsRead(notificationId);
      
      setNotifications(notifications.map(notification =>
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      ));
      
      setUnreadCount(unreadCount - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // This would be an API call
      // await notificationService.markAllAsRead();
      
      setNotifications(notifications.map(notification => ({
        ...notification,
        isRead: true
      })));
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // This would be an API call
      // await notificationService.deleteNotification(notificationId);
      
      setNotifications(notifications.filter(notification => notification._id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'group_invite':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-orange-500" />;
      case 'save':
        return <Bookmark className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-600">Stay updated with your learning community</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">{unreadCount} unread</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {notificationTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification Types Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {notificationTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedFilter(type.value)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                selectedFilter === type.value
                  ? 'bg-blue-100 text-blue-600 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map(notification => (
          <div
            key={notification._id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
              !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Notification Icon */}
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>

              {/* Notification Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={notification.user.avatar || 'https://via.placeholder.com/40'}
                        alt={notification.user.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                        <p className="text-sm text-gray-500">{formatTimeAgo(notification.createdAt)}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{notification.message}</p>
                    
                    {/* Additional Info */}
                    {notification.post && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{notification.post.title}</span>
                        </div>
                      </div>
                    )}
                    
                    {notification.group && (
                      <div className="bg-purple-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-purple-700">{notification.group.name}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  {notification.type === 'friend_request' && (
                    <>
                      <button className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center gap-1 text-sm">
                        <Check className="w-3 h-3" />
                        Accept
                      </button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center gap-1 text-sm">
                        <X className="w-3 h-3" />
                        Decline
                      </button>
                    </>
                  )}
                  {notification.type === 'group_invite' && (
                    <>
                      <button className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 flex items-center gap-1 text-sm">
                        <Users className="w-3 h-3" />
                        Join Group
                      </button>
                      <button className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 flex items-center gap-1 text-sm">
                        <X className="w-3 h-3" />
                        Decline
                      </button>
                    </>
                  )}
                  {(notification.type === 'like' || notification.type === 'comment' || notification.type === 'share' || notification.type === 'save') && (
                    <button className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center gap-1 text-sm">
                      <MessageCircle className="w-3 h-3" />
                      View Post
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {searchTerm || selectedFilter !== 'all' ? 'No notifications found' : 'No notifications yet'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedFilter !== 'all' 
              ? 'Try adjusting your search or filter' 
              : 'You\'ll see notifications when people interact with your content'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
