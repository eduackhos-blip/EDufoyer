import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  MessageCircle,
  Settings,
  Search,
  Bell,
  Share2,
  TrendingUp,
  Heart,
  Camera,
  Star,
  Globe,
  Plus,
  ChevronDown,
  MoreHorizontal,
  ThumbsUp,
  Send,
  Paperclip,
  Smile,
  Bookmark,
  MoreVertical,
  Gift,
  ArrowUp,
  ArrowRight,
  User,
  ChevronRight,
  ArrowRight as ArrowRightIcon,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation';
import authService from '../services/authService';
import socialService from '../services/socialService';
import StoriesPage from './StoriesPage';
import FriendsPage from './FriendsPage';
import UserProfilePage from './UserProfilePage';
import DashboardPageLayout from './dashboard/DashboardPageLayout';

const SocialDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname, search: searchParams.toString() ? `?${searchParams.toString()}` : '', hash: typeof window !== 'undefined' ? window.location.hash : '' };
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [friendSuggestions, setFriendSuggestions] = useState([]);
  const [newPost, setNewPost] = useState({ content: '', images: [] });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [userDashboard, setUserDashboard] = useState(null);
  const [personalizedContent, setPersonalizedContent] = useState([]);
  const [studyRecommendations, setStudyRecommendations] = useState([]);
  const [userStudyGroups, setUserStudyGroups] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push('/');
          return;
        }

        // Get user data from auth service
        const userData = await authService.getProfile();
        if (!userData) {
          router.push('/');
          return;
        }
        
        setUser(userData);
        

        // Use userId from URL parameter or authenticated user ID
        const currentUserId = userId || userData.id || userData._id;
        console.log('Using user ID from URL:', currentUserId);
        
        // If no userId in URL, redirect to user-specific URL
        if (!userId && currentUserId) {
          console.log('No userId in URL, redirecting to user-specific URL');
          router.replace(`/dashboard/social/${currentUserId}`);
          return;
        }
        
        // Keep feed data API-driven; avoid injecting synthetic dashboard content.
        setUserDashboard(null);
        setPersonalizedContent([]);
        setStudyRecommendations([]);
        setFriendSuggestions([]);
        setUserStudyGroups([]);
        setUserNotifications([]);
        
        // Load posts, stories, and friend suggestions
        await loadPosts();
        await loadStories();
        await loadFriendSuggestions();
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Debug stories state changes
  useEffect(() => {
    console.log('Stories state updated:', stories);
  }, [stories]);

  // Reload stories when switching to feed page
  useEffect(() => {
    if (currentPage === 'feed') {
      console.log('Switched to feed page, reloading stories...');
      loadStories();
    }
  }, [currentPage]);

  // Reload stories when user ID changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('User ID changed, reloading stories...');
      loadStories();
    };

    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Also reload when component mounts
    loadStories();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadPosts = async () => {
    try {
      const feed = await socialService.getPosts(1, 20);
      const rawPosts = Array.isArray(feed?.posts) ? feed.posts : [];
      const mappedPosts = rawPosts.map((post) => ({
        id: post._id,
        author: {
          name: post?.author?.name || 'Unknown',
          title: post?.subject || 'Student',
          avatar: post?.author?.avatar || post?.author?.avatarUrl || 'https://via.placeholder.com/48',
        },
        content: post?.content || '',
        hashtags: Array.isArray(post?.hashtags) ? post.hashtags : [],
        subject: post?.subject || '',
        image: Array.isArray(post?.images) && post.images.length > 0 ? post.images[0] : null,
        likes: Array.isArray(post?.likes) ? post.likes.length : Number(post?.likes || 0),
        comments: Array.isArray(post?.comments) ? post.comments.length : Number(post?.comments || 0),
        shares: Array.isArray(post?.shares) ? post.shares.length : Number(post?.shares || 0),
        saved: Array.isArray(post?.saves) ? post.saves.length : Number(post?.saves || 0),
        liked: false,
        isSaved: false,
      }));
      setPosts(mappedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  };

  const loadStories = async () => {
    try {
      const response = await socialService.getStories();
      const rawStories = Array.isArray(response?.data) ? response.data : [];
      const borderColors = ['border-blue-500', 'border-green-500', 'border-purple-500', 'border-pink-500', 'border-orange-500'];
      const mappedStories = rawStories.map((story, index) => ({
        id: story?._id,
        name: story?.author?.name || 'Unknown',
        avatar: story?.author?.avatar || story?.author?.avatarUrl || 'https://via.placeholder.com/64',
        color: borderColors[index % borderColors.length],
        content: story?.content || '',
        subject: story?.subject || '',
        createdAt: story?.createdAt ? new Date(story.createdAt) : new Date(),
      }));
      setStories(mappedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      setStories([]);
    }
  };

  const loadFriendSuggestions = async () => {
    try {
      const response = await socialService.getFriendSuggestions();
      setFriendSuggestions(response || []);
    } catch (error) {
      console.error('Error loading friend suggestions:', error);
      setFriendSuggestions([]);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;
    
    setIsCreating(true);
    try {
      await socialService.createPost(newPost);
      setNewPost({ content: '', images: [] });
      setShowCreatePost(false);
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await socialService.toggleLike(postId);
      await loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async (postId) => {
    try {
      await socialService.toggleSave(postId);
      await loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleShare = async (postId) => {
    try {
      await socialService.sharePost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      await socialService.sendFriendRequest(userId);
      await loadFriendSuggestions();
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const demoPages = [
    { id: 'feed', label: 'Feed', badge: 10 },
    { id: 'stories', label: 'Stories' },
    { id: 'friends', label: 'Friends', badge: 2 },
    { id: 'apis', label: 'APIs' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
    { id: 'help', label: 'Help & Support' },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Educational Social Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardPageLayout loadingMessage="Loading social…">
      <div className="flex min-h-full flex-col overflow-hidden bg-gray-50">
      <div className="shrink-0 bg-gradient-to-r from-purple-100 to-pink-100 border-b-4 border-purple-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-600 animate-pulse" />
            <span className="text-3xl font-bold text-purple-800">Coming Soon</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-gray-200 bg-white px-3 py-2 flex gap-2 overflow-x-auto">
            {demoPages.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentPage(tab.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  currentPage === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                {tab.badge != null ? (
                  <span className="ml-1.5 text-xs opacity-90">({tab.badge})</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <div className="flex-1 max-w-2xl min-w-0 overflow-y-auto">
        {currentPage === 'feed' && (
            <>
              {/* Top Search and Post */}
              <div className="bg-white p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4 flex-wrap gap-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Dashboard</span>
                </button>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search for friends, groups, pages"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add New Post</span>
                  </button>
                </div>
              </div>

              {/* Stories */}
              <div className="bg-white p-6 border-b border-gray-200">
                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Stories</h3>
                  <p className="text-xs text-gray-500">Stories count: {stories.length}</p>
                </div>
                <div className="flex space-x-4 overflow-x-auto">
                  {stories.length > 0 ? (
                    stories.map((story, index) => (
                      <div key={index} className="flex-shrink-0 text-center">
                        <div className={`w-16 h-16 rounded-full border-4 ${story.color} p-1`}>
                          <img src={story.avatar} alt={story.name} className="w-full h-full rounded-full object-cover" />
                        </div>
                        <p className="text-xs mt-2 text-gray-600">{story.name}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex-shrink-0 text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-gray-300 p-1 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No stories</span>
                      </div>
                      <p className="text-xs mt-2 text-gray-600">No stories</p>
                    </div>
                  )}
                  <div className="flex-shrink-0 text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-300 p-1 flex items-center justify-center">
                      <ArrowRightIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-xs mt-2 text-gray-600">More</p>
                  </div>
                </div>
              </div>

              {/* Personalized Content */}
              <div className="bg-white mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recommended for {userDashboard?.user?.specialization || 'Your'} Students
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personalizedContent.slice(0, 4).map((content, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-600">{content.subject}</span>
                          <span className="text-xs text-gray-500">{content.type}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{content.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">by {content.author}</span>
                          <div className="flex items-center space-x-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600">{content.likes || content.views}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Posts */}
              <div className="bg-white">
                {posts.map((post) => (
                  <div key={post.id} className="p-6 border-b border-gray-200">
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                          <p className="text-sm text-gray-600">{post.author.title}</p>
                        </div>
                      </div>
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </div>

                    {/* Post Content */}
                    <div className="mb-4">
                      <p className="text-gray-800 mb-3">{post.content}</p>
                      <div className="flex flex-wrap gap-2">
                        {post.hashtags.map((tag, index) => (
                          <span key={index} className="text-blue-600 text-sm">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Post Image */}
                    {post.image && (
                      <div className="mb-4">
                        <img src={post.image} alt="Post" className="w-full rounded-lg" />
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-4">
                        <span>{post.likes} Likes</span>
                        <span>{post.comments} Comments</span>
                        <span>{post.shares} Share</span>
                        <span>{post.saved} Saved</span>
                      </div>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 ${post.liked ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                          <ThumbsUp className="w-5 h-5" />
                          <span>Like</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                          <MessageCircle className="w-5 h-5" />
                          <span>Comment</span>
                        </button>
                        <button
                          onClick={() => handleShare(post.id)}
                          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                        >
                          <Share2 className="w-5 h-5" />
                          <span>Share</span>
                        </button>
                        <button
                          onClick={() => handleSave(post.id)}
                          className={`flex items-center space-x-2 ${post.saved ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}
                        >
                          <Bookmark className="w-5 h-5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>

                    {/* Comment Input */}
                    <div className="mt-4 flex items-center space-x-3">
                      <img src={user?.avatar} alt="You" className="w-8 h-8 rounded-full" />
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Write your comment.."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Smile className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-blue-600 hover:text-blue-700">
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {currentPage === 'stories' && <StoriesPage />}

          {currentPage === 'friends' && <FriendsPage />}

          {currentPage === 'profile' && (
            <UserProfilePage 
              user={user} 
              onUserUpdate={setUser}
            />
          )}

          {currentPage === 'apis' && (
            <div className="bg-white p-6">
              <h2 className="text-xl font-semibold mb-4">APIs</h2>
              <p className="text-gray-600">API documentation and tools will be loaded here...</p>
            </div>
          )}

          {currentPage === 'subscription' && (
            <div className="bg-white p-6">
              <h2 className="text-xl font-semibold mb-4">Subscription</h2>
              <p className="text-gray-600">Subscription plans and billing will be loaded here...</p>
            </div>
          )}

          {currentPage === 'settings' && (
            <div className="bg-white p-6">
              <h2 className="text-xl font-semibold mb-4">Settings</h2>
              <p className="text-gray-600">Account settings and preferences will be loaded here...</p>
            </div>
          )}

          {currentPage === 'help' && (
            <div className="bg-white p-6">
              <h2 className="text-xl font-semibold mb-4">Help & Support</h2>
              <p className="text-gray-600">Help articles and support will be loaded here...</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          {/* Top Icons */}
          <div className="flex items-center justify-end space-x-4 mb-6">
            <User className="w-6 h-6 text-gray-600" />
            <Bell className="w-6 h-6 text-gray-600" />
            <Settings className="w-6 h-6 text-gray-600" />
          </div>

          {/* Friend Suggestions */}
          {/* Study Groups */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Your Study Groups</h3>
              <a href="#" className="text-blue-600 text-sm flex items-center">
                See All
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </a>
            </div>
            <div className="space-y-3">
              {userStudyGroups.map((group, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <p className="text-sm text-gray-600">{group.members} members • {group.subject}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${group.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Recommendations */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Recommended for You</h3>
              <a href="#" className="text-blue-600 text-sm flex items-center">
                See All
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </a>
            </div>
            <div className="space-y-3">
              {studyRecommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{rec.difficulty}</span>
                    <span>{rec.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Friend Suggestions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Friend Suggestions</h3>
              <a href="#" className="text-blue-600 text-sm flex items-center">
                See All
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </a>
            </div>
            <div className="space-y-4">
              {friendSuggestions.map((friend, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{friend.name}</p>
                    <p className="text-sm text-gray-600">{friend.mutual} mutual friends</p>
                  </div>
                  <button
                    onClick={() => handleAddFriend(friend.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Profile Activity</h3>
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex -space-x-2">
                <img src="https://via.placeholder.com/32" alt="Follower" className="w-8 h-8 rounded-full border-2 border-white" />
                <img src="https://via.placeholder.com/32" alt="Follower" className="w-8 h-8 rounded-full border-2 border-white" />
                <img src="https://via.placeholder.com/32" alt="Follower" className="w-8 h-8 rounded-full border-2 border-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">+1,158 Followers</p>
                <div className="flex items-center space-x-2">
                  <ArrowUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">23% vs last month</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">You gained a substantial amount of followers this month!</p>
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-xs font-semibold">25</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Friend's Birthday</p>
                <p className="text-sm text-gray-600">Jun 25, 2028</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Post</h3>
            <textarea
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 resize-none"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={isCreating || !newPost.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardPageLayout>
  );
};

export default SocialDashboard;