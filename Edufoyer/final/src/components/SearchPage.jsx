import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { debounce } from '../utils/debounce';
import { 
  Search, 
  Filter, 
  Users, 
  BookOpen, 
  MessageCircle, 
  Heart, 
  Share2, 
  Bookmark, 
  Clock, 
  Star, 
  TrendingUp, 
  Hash, 
  UserPlus, 
  MoreVertical,
  Loader2,
  X,
  Check
} from 'lucide-react';
import socialService from '../services/socialService';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({
    users: [],
    posts: [],
    groups: [],
    hashtags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    subject: 'all',
    dateRange: 'all',
    type: 'all'
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);

  const searchTabs = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'users', label: 'People', icon: Users },
    { id: 'posts', label: 'Posts', icon: BookOpen },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'hashtags', label: 'Hashtags', icon: Hash }
  ];

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'Computer Science', 'Engineering', 'Literature', 'History',
    'Data Science', 'Artificial Intelligence', 'Business', 
    'Economics', 'Psychology', 'Sociology'
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  useEffect(() => {
    loadTrendingTopics();
    loadRecentSearches();
  }, []);

  // Memoize performSearch to prevent unnecessary recreations
  const performSearchMemo = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults({ users: [], posts: [], groups: [], hashtags: [] });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const [usersResults, postsResults] = await Promise.all([
        socialService.searchUsers(searchTerm, 1, 10),
        socialService.searchPosts(searchTerm, 1, 10)
      ]);

      setSearchResults({
        users: usersResults.users || [],
        posts: postsResults.posts || [],
        groups: [],
        hashtags: []
      });

      // Save to recent searches
      if (searchTerm.trim()) {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const newRecent = [searchTerm, ...recent.filter(s => s !== searchTerm)].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(newRecent));
        setRecentSearches(newRecent);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error performing search:', error);
      }
      setSearchResults({ users: [], posts: [], groups: [], hashtags: [] });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useMemo(
    () => debounce(performSearchMemo, 500),
    [performSearchMemo]
  );

  useEffect(() => {
    debouncedSearch();
    return () => {
      // Cleanup on unmount
    };
  }, [debouncedSearch]);

  const loadTrendingTopics = async () => {
    try {
      // This would be an API call to get trending topics
      const sampleTrending = [
        { tag: 'machinelearning', count: 1250, trend: 'up' },
        { tag: 'calculus', count: 980, trend: 'up' },
        { tag: 'datastructures', count: 850, trend: 'down' },
        { tag: 'physics', count: 720, trend: 'up' },
        { tag: 'webdevelopment', count: 650, trend: 'up' }
      ];
      setTrendingTopics(sampleTrending);
    } catch (error) {
      console.error('Error loading trending topics:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      // This would load from localStorage or API
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      setRecentSearches(recent);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };


  const handleAddFriend = async (userId) => {
    try {
      await socialService.sendFriendRequest(userId, 'Hi! I\'d like to connect with you.');
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await socialService.joinStudyGroup(groupId);
      alert('Successfully joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group. Please try again.');
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

  const filteredResults = useMemo(() => {
    if (activeTab !== 'all') {
      return { [activeTab]: searchResults[activeTab] || [] };
    }
    return searchResults;
  }, [activeTab, searchResults]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for people, posts, groups, and hashtags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Search Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {searchTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Filters:</span>
          <select
            value={filters.subject}
            onChange={(e) => setFilters({...filters, subject: e.target.value})}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Searching...</span>
        </div>
      ) : searchTerm ? (
        <div className="space-y-6">
          {/* Users Results */}
          {activeTab === 'all' || activeTab === 'users' ? (
            filteredResults.users && filteredResults.users.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  People ({filteredResults.users.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.users.map(user => (
                    <div key={user._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h4 className="font-medium text-gray-800">{user.name}</h4>
                            <p className="text-sm text-gray-500">{user.subjects.join(', ')}</p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Mutual Friends:</span>
                          <span className="font-medium">{user.mutualFriends}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {user.isFriend ? (
                          <button className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center gap-1 text-sm">
                            <Check className="w-4 h-4" />
                            Friends
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddFriend(user._id)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center gap-1 text-sm"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add Friend
                          </button>
                        )}
                        <button className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : null}

          {/* Posts Results */}
          {activeTab === 'all' || activeTab === 'posts' ? (
            filteredResults.posts && filteredResults.posts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Posts ({filteredResults.posts.length})
                </h3>
                <div className="space-y-4">
                  {filteredResults.posts.map(post => (
                    <div key={post._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h4 className="font-medium text-gray-800">{post.author.name}</h4>
                            <p className="text-sm text-gray-500">{post.subject} • {formatTimeAgo(post.createdAt)}</p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.hashtags.map((tag, index) => (
                            <span key={index} className="text-blue-600 text-sm">#{tag}</span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-4 h-4" />
                          <span>{post.shares}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : null}

          {/* Groups Results */}
          {activeTab === 'all' || activeTab === 'groups' ? (
            filteredResults.groups && filteredResults.groups.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Study Groups ({filteredResults.groups.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.groups.map(group => (
                    <div key={group._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{group.name}</h4>
                            <p className="text-sm text-gray-500">{group.subject}</p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{group.memberCount}/{group.maxMembers} members</span>
                        <span className={group.isPrivate ? 'text-red-500' : 'text-green-500'}>
                          {group.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleJoinGroup(group._id)}
                        className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-1 text-sm"
                      >
                        <Users className="w-4 h-4" />
                        Join Group
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : null}

          {/* Hashtags Results */}
          {activeTab === 'all' || activeTab === 'hashtags' ? (
            filteredResults.hashtags && filteredResults.hashtags.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Hashtags ({filteredResults.hashtags.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.hashtags.map(hashtag => (
                    <div key={hashtag.tag} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">#{hashtag.tag}</h4>
                        <span className="text-sm text-gray-500">{hashtag.count} posts</span>
                      </div>
                      <button className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm">
                        View Posts
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : null}
        </div>
      ) : (
        /* Empty State - Show Recent Searches and Trending Topics */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Searches */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Searches
            </h3>
            {recentSearches.length > 0 ? (
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(search)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-md flex items-center gap-2"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent searches</p>
            )}
          </div>

          {/* Trending Topics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trending Topics
            </h3>
            <div className="space-y-3">
              {trendingTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">#{topic.tag}</span>
                    <span className="text-sm text-gray-500">({topic.count} posts)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-4 h-4 ${topic.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {searchTerm && !isLoading && Object.values(filteredResults).every(arr => !arr || arr.length === 0) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;




