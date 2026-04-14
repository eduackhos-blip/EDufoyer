import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MessageCircle, 
  Settings,
  Check,
  X,
  Crown,
  Shield,
  Star,
  Loader2,
  Plus
} from 'lucide-react';
import socialService from '../services/socialService';

const FriendCircle = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Load data from API
  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      setIsLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        socialService.getFriends(),
        socialService.getFriendRequests()
      ]);
      
      setFriends(friendsData);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error loading friends data:', error);
      // Fallback to sample data
      const sampleFriends = [
        {
          _id: 1,
          requester: { name: 'Rahul Sharma', email: 'rahul@example.com', avatar: 'https://via.placeholder.com/40' },
          recipient: { name: 'You', email: 'you@example.com', avatar: 'https://via.placeholder.com/40' },
          status: 'accepted',
          requestedAt: '2024-01-15'
        },
        {
          _id: 2,
          requester: { name: 'Priya Singh', email: 'priya@example.com', avatar: 'https://via.placeholder.com/40' },
          recipient: { name: 'You', email: 'you@example.com', avatar: 'https://via.placeholder.com/40' },
          status: 'accepted',
          requestedAt: '2024-01-20'
        }
      ];

      const sampleRequests = [
        {
          _id: 1,
          requester: { name: 'Sneha Patel', email: 'sneha@example.com', avatar: 'https://via.placeholder.com/40' },
          message: 'Hi! I\'d love to study together!',
          requestedAt: '2024-01-25'
        }
      ];

      setFriends(sampleFriends);
      setPendingRequests(sampleRequests);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!newFriendEmail.trim()) {
      alert('Please enter a valid email address');
      return;
    }

    try {
      setIsSending(true);
      await socialService.sendFriendRequest(newFriendEmail, 'Hi! I\'d like to connect with you for studying together.');
      alert('Friend request sent successfully!');
      setNewFriendEmail('');
      setShowAddFriend(false);
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await socialService.acceptFriendRequest(requestId);
      setPendingRequests(pendingRequests.filter(r => r._id !== requestId));
      // Reload friends list
      loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await socialService.declineFriendRequest(requestId);
      setPendingRequests(pendingRequests.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('Failed to decline friend request. Please try again.');
    }
  };

  const filteredFriends = friends.filter(friend => {
    const requesterName = friend.requester?.name || '';
    const recipientName = friend.recipient?.name || '';
    const requesterEmail = friend.requester?.email || '';
    const recipientEmail = friend.recipient?.email || '';
    
    return requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           requesterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
           recipientEmail.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading friends...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Friend Circle</h1>
              <p className="text-gray-600">Connect with study partners and share knowledge</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddFriend(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add Friend
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search friends by name, email, or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Friend to Circle</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Friend's Email
                </label>
                <input
                  type="email"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter friend's email address"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddFriend(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriend}
                disabled={isSending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invite'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Requests</h2>
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div key={request._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={request.requester.avatar || 'https://via.placeholder.com/40'}
                    alt={request.requester.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium text-gray-800">{request.requester.name}</h3>
                    <p className="text-sm text-gray-500">{request.requester.email}</p>
                    {request.message && (
                      <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                    )}
                    <p className="text-xs text-gray-400">Requested on {new Date(request.requestedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Study Circle ({friends.length} members)
          </h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {friends.filter(f => f.isOnline).length} Online
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFriends.map(friend => {
            // Determine which user is the friend (not the current user)
            const friendUser = friend.requester?.name === 'You' ? friend.recipient : friend.requester;
            const friendEmail = friend.requester?.email === 'you@example.com' ? friend.recipient?.email : friend.requester?.email;
            const friendAvatar = friend.requester?.name === 'You' ? friend.recipient?.avatar : friend.requester?.avatar;
            
            return (
              <div key={friend._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={friendAvatar || 'https://via.placeholder.com/40'}
                        alt={friendUser?.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{friendUser?.name}</h3>
                      <p className="text-sm text-gray-500">{friendEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Friend</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium text-green-600">Connected</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Since:</span>
                    <span className="font-medium">{new Date(friend.requestedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFriends.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No friends found</h3>
            <p className="text-gray-500">Try adjusting your search or add new friends</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendCircle;
