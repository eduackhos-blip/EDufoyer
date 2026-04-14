import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  BookOpen, 
  Award, 
  Edit3, 
  Save, 
  X,
  Camera,
  Settings,
  Heart,
  MessageCircle,
  Share2
} from 'lucide-react';
import authService from '../services/authService';
import socialService from '../services/socialService';

const UserProfilePage = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [userStats, setUserStats] = useState({
    posts: 0,
    friends: 0,
    stories: 0,
    likes: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      setIsLoading(true);
      // Load user statistics
      const [postsRes, friendsRes, storiesRes] = await Promise.all([
        socialService.getUserPosts().catch(() => ({ data: [] })),
        socialService.getFriends().catch(() => ({ data: [] })),
        socialService.getUserStories().catch(() => ({ data: [] }))
      ]);

      setUserStats({
        posts: postsRes.data?.length || 0,
        friends: friendsRes.data?.length || 0,
        stories: storiesRes.data?.length || 0,
        likes: 0 // This would need to be calculated from posts
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Update user profile
      await authService.updateProfile(editedUser);
      onUserUpdate(editedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setEditedUser({ ...user });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img 
                src={editedUser.avatar || 'https://via.placeholder.com/120'} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-purple-100"
              />
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-purple-500 text-white p-2 rounded-full hover:bg-purple-600">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.name || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 border border-gray-300 rounded px-3 py-1"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.email || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  className="text-gray-600 border border-gray-300 rounded px-3 py-1 mt-1"
                />
              ) : (
                <p className="text-gray-600">{user?.email}</p>
              )}
              <p className="text-sm text-purple-600 mt-1">{user?.membership || 'Student'}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{userStats.posts}</div>
          <div className="text-sm text-gray-600">Posts</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{userStats.friends}</div>
          <div className="text-sm text-gray-600">Friends</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{userStats.stories}</div>
          <div className="text-sm text-gray-600">Stories</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{userStats.likes}</div>
          <div className="text-sm text-gray-600">Likes</div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{user?.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Joined {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Student</span>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Academic Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Computer Science</span>
            </div>
            <div className="flex items-center space-x-3">
              <Award className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Bachelor's Degree</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">University</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="text-gray-700">Liked a post about React Hooks</span>
            <span className="text-sm text-gray-500 ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">Commented on a study group post</span>
            <span className="text-sm text-gray-500 ml-auto">4 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Share2 className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">Shared a helpful resource</span>
            <span className="text-sm text-gray-500 ml-auto">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
