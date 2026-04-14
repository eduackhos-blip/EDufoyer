import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Plus, 
  Search, 
  Filter,
  Users,
  Camera,
  Image as ImageIcon,
  Send,
  MoreHorizontal,
  ThumbsUp,
  Loader2
} from 'lucide-react';
import socialService from '../services/socialService';

const EducationalFeed = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ content: '', images: [], subject: '', hashtags: [] });
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'Computer Science', 'Engineering', 'Literature', 'History',
    'Data Science', 'Artificial Intelligence', 'Business', 
    'Economics', 'Psychology', 'Sociology'
  ];

  // Load posts from API
  useEffect(() => {
    loadPosts();
  }, [currentPage, selectedSubject]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const filters = {};
      if (selectedSubject !== 'all') {
        filters.subject = selectedSubject;
      }
      
      const response = await socialService.getPosts(currentPage, 10, filters);
      setPosts(response.posts);
      setHasMore(response.pagination.hasNextPage);
    } catch (error) {
      console.error('Error loading posts:', error);
      // Fallback to sample data if API fails
      const samplePosts = [
        {
          _id: 1,
          author: { name: 'Rahul Sharma', avatar: 'https://via.placeholder.com/40' },
          content: 'Just solved this complex algorithm problem! The key was understanding the time complexity. Anyone else working on data structures?',
          images: ['https://via.placeholder.com/400x200'],
          subject: 'Computer Science',
          likes: [{ user: 'user1' }],
          comments: [],
          shares: [],
          saves: [],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          hashtags: ['#algorithms', '#datastructures']
        },
        {
          _id: 2,
          author: { name: 'Priya Singh', avatar: 'https://via.placeholder.com/40' },
          content: 'Calculus integration techniques that helped me ace my exam! Sharing my study notes 📚',
          images: ['https://via.placeholder.com/400x200'],
          subject: 'Mathematics',
          likes: [{ user: 'user2' }, { user: 'user3' }],
          comments: [],
          shares: [],
          saves: [],
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          hashtags: ['#calculus', '#mathematics']
        }
      ];
      setPosts(samplePosts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim() || !newPost.subject) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const postData = {
        content: newPost.content,
        subject: newPost.subject,
        images: newPost.images,
        hashtags: newPost.hashtags,
        visibility: 'public'
      };

      const response = await socialService.createPost(postData);
      setPosts([response.data, ...posts]);
      setNewPost({ content: '', images: [], subject: '', hashtags: [] });
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await socialService.toggleLike(postId);
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              likes: response.liked ? [...post.likes, { user: 'current-user' }] : post.likes.filter(like => like.user !== 'current-user'),
              likeCount: response.likeCount
            }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (postId, content) => {
    try {
      const response = await socialService.addComment(postId, content);
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              comments: [...post.comments, response.data]
            }
          : post
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async (postId) => {
    try {
      await socialService.sharePost(postId);
      // Update UI to reflect share
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleSave = async (postId) => {
    try {
      const response = await socialService.toggleSave(postId);
      setPosts(posts.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              saves: response.saved ? [...post.saves, { user: 'current-user' }] : post.saves.filter(save => save.user !== 'current-user'),
              saveCount: response.saveCount
            }
          : post
      ));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || post.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

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
        <span className="ml-3 text-gray-600">Loading feed...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Educational Feed</h1>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts, people, subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Educational Post</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <select
                  value={newPost.subject}
                  onChange={(e) => setNewPost({...newPost, subject: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share your knowledge
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Share study tips, explain concepts, ask questions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., #mathematics #calculus #study"
                  value={newPost.hashtags.join(' ')}
                  onChange={(e) => setNewPost({...newPost, hashtags: e.target.value.split(' ').filter(tag => tag.trim())})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Images (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click to upload images</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      const imageUrls = files.map(file => URL.createObjectURL(file));
                      setNewPost({...newPost, images: [...newPost.images, ...imageUrls]});
                    }}
                  />
                </div>
                {newPost.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPost.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img src={image} alt={`Preview ${index}`} className="w-16 h-16 object-cover rounded" />
                        <button
                          onClick={() => setNewPost({...newPost, images: newPost.images.filter((_, i) => i !== index)})}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreatePost(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.map(post => (
          <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Post Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={post.author.avatar || 'https://via.placeholder.com/40'}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">{post.author.name}</h3>
                    <p className="text-sm text-gray-500">{post.subject} • {formatTimeAgo(post.createdAt)}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Post Content */}
            <div className="px-6 pb-4">
              <p className="text-gray-800 mb-4">{post.content}</p>
              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.hashtags.map((tag, index) => (
                    <span key={index} className="text-blue-600 text-sm">#{tag}</span>
                  ))}
                </div>
              )}
              {post.images && post.images.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {post.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt="Post content"
                      className="w-full rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-2 ${
                      post.likes.some(like => like.user === 'current-user') ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.likes.some(like => like.user === 'current-user') ? 'fill-current' : ''}`} />
                    <span>{post.likes.length}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments.length}</span>
                  </button>
                  <button 
                    onClick={() => handleShare(post._id)}
                    className="flex items-center space-x-2 text-gray-500 hover:text-green-500"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{post.shares.length}</span>
                  </button>
                </div>
                <button 
                  onClick={() => handleSave(post._id)}
                  className={`text-gray-500 hover:text-yellow-500 ${
                    post.saves.some(save => save.user === 'current-user') ? 'text-yellow-500' : ''
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${post.saves.some(save => save.user === 'current-user') ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No posts found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default EducationalFeed;
