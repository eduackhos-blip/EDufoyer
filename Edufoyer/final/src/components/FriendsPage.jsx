import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Check, 
  X, 
  MessageCircle, 
  Heart,
  Star,
  Clock,
  Loader2,
  Plus,
  Settings
} from 'lucide-react';
import socialService from '../services/socialService';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadFriendsData();
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadFriendsData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading friends data...');
      
      // Load friends, requests, and suggestions
      const [friendsRes, requestsRes, suggestionsRes] = await Promise.all([
        socialService.getFriends().catch(() => ({ data: [] })),
        socialService.getFriendRequests().catch(() => ({ data: [] })),
        socialService.getFriendSuggestions().catch(() => ({ data: [] }))
      ]);

      console.log('Friends response:', friendsRes);
      console.log('Requests response:', requestsRes);
      console.log('Suggestions response:', suggestionsRes);

      setFriends(friendsRes.data || []);
      setPendingRequests(requestsRes.data || []);
      setFriendSuggestions(suggestionsRes.data || []);
      
    } catch (error) {
      console.error('Error loading friends data:', error);
      // Mock data for testing
      setFriends([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          avatar: 'https://via.placeholder.com/40',
          status: 'online',
          lastActive: '2 minutes ago',
          mutualFriends: 5,
          isOnline: true
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          avatar: 'https://via.placeholder.com/40',
          status: 'offline',
          lastActive: '1 hour ago',
          mutualFriends: 3,
          isOnline: false
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          avatar: 'https://via.placeholder.com/40',
          status: 'online',
          lastActive: '5 minutes ago',
          mutualFriends: 8,
          isOnline: true
        }
      ]);

      setPendingRequests([
        {
          id: 1,
          name: 'Alice Brown',
          email: 'alice@example.com',
          avatar: 'https://via.placeholder.com/40',
          sentAt: '2 hours ago'
        }
      ]);

      setFriendSuggestions([
        {
          id: 1,
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          avatar: 'https://via.placeholder.com/40',
          mutualFriends: 2,
          reason: 'You have 2 mutual friends'
        },
        {
          id: 2,
          name: 'Tom Davis',
          email: 'tom@example.com',
          avatar: 'https://via.placeholder.com/40',
          mutualFriends: 1,
          reason: 'You have 1 mutual friend'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!newFriendEmail.trim()) return;
    
    setIsSending(true);
    try {
      await socialService.sendFriendRequest(newFriendEmail);
      
      // Show success modal
      setSuccessMessage('Friend request sent successfully!');
      setShowSuccessModal(true);
      
      setNewFriendEmail('');
      setShowAddFriend(false);
      await loadFriendsData();
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await socialService.acceptFriendRequest(requestId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await socialService.declineFriendRequest(requestId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleAddSuggestion = async (userId) => {
    try {
      await socialService.sendFriendRequestById(userId);
      await loadFriendsData();
    } catch (error) {
      console.error('Error adding friend from suggestion:', error);
    }
  };

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for users with query:', query);
      const results = await socialService.searchUsers(query);
      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequestToUser = async (userId) => {
    try {
      console.log('Sending friend request to user ID:', userId);
      await socialService.sendFriendRequestById(userId);
      console.log('Friend request sent successfully');
      
      // Show success modal
      setSuccessMessage('Friend request sent successfully!');
      setShowSuccessModal(true);
      
      setSearchResults([]);
      setSearchQuery('');
      await loadFriendsData();
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
            <p className="text-gray-600">Manage your connections and discover new friends</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddFriend(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Friend</span>
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-800">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <button className="p-2 text-gray-600 hover:text-gray-800">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-1 p-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'all'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'requests'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'suggestions'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Suggestions ({friendSuggestions.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'all' && (
          <div className="space-y-4">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <div key={friend.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-12 h-12 rounded-full"
                        />
                        {friend.isOnline && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                        <p className="text-sm text-gray-600">{friend.email}</p>
                        <p className="text-xs text-gray-500">{friend.lastActive}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-blue-600">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-red-600">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-gray-800">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Friends Yet</h3>
                <p className="text-gray-600 mb-6">Start building your network by adding friends!</p>
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Add Your First Friend
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={request.avatar}
                        alt={request.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.name}</h3>
                        <p className="text-sm text-gray-600">{request.email}</p>
                        <p className="text-xs text-gray-500">Sent {request.sentAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {friendSuggestions.length > 0 ? (
              friendSuggestions.map((suggestion) => (
                <div key={suggestion.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img
                        src={suggestion.avatar}
                        alt={suggestion.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{suggestion.name}</h3>
                        <p className="text-sm text-gray-600">{suggestion.email}</p>
                        <p className="text-xs text-gray-500">{suggestion.reason}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddSuggestion(suggestion.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suggestions</h3>
                <p className="text-gray-600">We couldn't find any friend suggestions at the moment.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Friend</h3>
            <div className="space-y-4">
              {/* Search by Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user.avatar || 'https://via.placeholder.com/32'}
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSendRequestToUser(user.id)}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 flex items-center space-x-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Add Friend</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results Message */}
                {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                  <div className="mt-2 p-3 text-center text-gray-500 bg-gray-50 rounded-lg">
                    <p>No users found with name "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Add by Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add by Email Address
                </label>
                <input
                  type="email"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  placeholder="Enter friend's email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddFriend(false);
                  setSearchQuery('');
                  setSearchResults([]);
                  setNewFriendEmail('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFriend}
                disabled={isSending || !newFriendEmail.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Send Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
