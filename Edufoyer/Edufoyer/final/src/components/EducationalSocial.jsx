import React, { useState } from 'react';
import { Home, Users, BookOpen, MessageCircle, Settings, Search, LogOut, Bell, Video, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import SharedSidebar from './SharedSidebar';
import EducationalFeed from './EducationalFeed';
import FriendCircle from './FriendCircle';

const EducationalSocial = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/');
          return;
        }

        const userData = await authService.getProfile();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        authService.logout();
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { icon: Home, label: 'Feed', active: activeTab === 'feed', onClick: () => setActiveTab('feed') },
    { icon: Users, label: 'Friend Circle', active: activeTab === 'friends', onClick: () => setActiveTab('friends') },
    { icon: BookOpen, label: 'My Doubts', path: '/dashboard/doubts' },
    { icon: Video, label: 'Solve Doubts', path: '/dashboard/doubts' },
    { icon: Bell, label: 'Notifications', path: '/dashboard/notifications' },
    { icon: MessageCircle, label: 'Messages', badge: 4 },
    { icon: Settings, label: 'Settings' },
    { icon: LogOut, label: 'Logout', onClick: handleLogout }
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <SharedSidebar items={sidebarItems} showCloseButton={false} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-2xl">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search educational content, friends, and subjects..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 ml-6">
              <button className="px-6 py-2 border-2 border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-50">
                Create Study Group
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                Share Knowledge
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full">
          {activeTab === 'feed' && <EducationalFeed />}
          {activeTab === 'friends' && <FriendCircle />}
        </div>
      </div>
    </div>
  );
};

export default EducationalSocial;




