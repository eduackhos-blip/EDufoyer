import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  Video, 
  Image, 
  X, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import socialService from '../services/socialService';

const StoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [newStory, setNewStory] = useState({ content: '', type: 'text', image: null, subject: '', hashtags: [] });
  const [isCreating, setIsCreating] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const response = await socialService.getStories();
      console.log('StoriesPage - Stories API response:', response);
      console.log('StoriesPage - Response data:', response.data);
      console.log('StoriesPage - Response data length:', response.data?.length);
      console.log('StoriesPage - Response data type:', typeof response.data);
      console.log('StoriesPage - Response data is array:', Array.isArray(response.data));
      
      // Transform API data to match our expected format
      const transformedStories = (response.data || []).map((story, index) => {
        console.log(`StoriesPage - Processing story ${index}:`, story);
        console.log(`StoriesPage - Story author:`, story.author);
        return {
        id: story._id,
        author: {
          name: story.author?.name || 'Unknown',
          avatar: story.author?.avatar || 'https://via.placeholder.com/40',
          username: `@${story.author?.name?.toLowerCase().replace(/\s+/g, '') || 'unknown'}`
        },
        content: story.content || '',
        type: story.mediaType || 'text',
        image: story.media && story.media.length > 0 ? story.media[0] : null,
        createdAt: new Date(story.createdAt),
        views: story.views?.length || 0,
        likes: story.reactions?.length || 0,
        subject: story.subject,
        hashtags: story.hashtags || []
        };
      });
      
      console.log('StoriesPage - Transformed stories:', transformedStories);
      setStories(transformedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      // Mock data for testing
      setStories([
        {
          id: 1,
          author: {
            name: 'x_ae-23b',
            avatar: 'https://via.placeholder.com/40',
            username: '@x_ae-23b'
          },
          content: 'Just finished an amazing coding session! 🚀',
          type: 'text',
          image: null,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          views: 45,
          likes: 12
        },
        {
          id: 2,
          author: {
            name: 'maisenpai',
            avatar: 'https://via.placeholder.com/40',
            username: '@maisenpai'
          },
          content: 'Learning React hooks today!',
          type: 'text',
          image: null,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          views: 32,
          likes: 8
        },
        {
          id: 3,
          author: {
            name: 'saylortwift',
            avatar: 'https://via.placeholder.com/40',
            username: '@saylortwift'
          },
          content: 'Beautiful sunset from my study room',
          type: 'image',
          image: 'https://via.placeholder.com/400x600',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          views: 78,
          likes: 23
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!newStory.content.trim() && !newStory.image) return;
    if (!newStory.subject) {
      alert('Please select a subject for your story');
      return;
    }
    
    setIsCreating(true);
    try {
      console.log('Creating story with data:', newStory);
      await socialService.createStory(newStory);
      console.log('Story created successfully, reloading stories...');
      setNewStory({ content: '', type: 'text', image: null, subject: '', hashtags: [] });
      setShowCreateStory(false);
      await loadStories(); // Reload stories after creation
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewStory({ ...newStory, image: e.target.result, type: 'image' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleViewStory = (index) => {
    setCurrentStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleLikeStory = async (storyId) => {
    try {
      await socialService.likeStory(storyId);
      await loadStories();
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
            <p className="text-gray-600">Share your learning moments</p>
          </div>
          <button
            onClick={() => setShowCreateStory(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Story</span>
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map((story, index) => (
            <div
              key={story.id}
              onClick={() => handleViewStory(index)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* Story Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <img
                    src={story.author.avatar}
                    alt={story.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{story.author.name}</h3>
                    <p className="text-sm text-gray-600">{story.author.username}</p>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimeAgo(story.createdAt)}</span>
                </div>
              </div>

              {/* Story Content */}
              <div className="relative">
                {story.type === 'image' && story.image ? (
                  <img
                    src={story.image}
                    alt="Story"
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-gray-700 font-medium">{story.content}</p>
                    </div>
                  </div>
                )}
                
                {/* Story Type Indicator */}
                <div className="absolute top-3 right-3">
                  {story.type === 'image' ? (
                    <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <Image className="w-3 h-3" />
                      <span>Photo</span>
                    </div>
                  ) : (
                    <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>Text</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Story Stats */}
              <div className="p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeStory(story.id);
                      }}
                      className="flex items-center space-x-1 hover:text-red-600"
                    >
                      <Heart className="w-4 h-4" />
                      <span>{story.likes}</span>
                    </button>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{story.views}</span>
                    </div>
                  </div>
                  <button className="hover:text-gray-800">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stories Yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share your learning journey!</p>
            <button
              onClick={() => setShowCreateStory(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Create Your First Story
            </button>
          </div>
        )}
      </div>

      {/* Create Story Modal */}
      {showCreateStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Story</h3>
              <button
                onClick={() => setShowCreateStory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={newStory.subject}
                  onChange={(e) => setNewStory({ ...newStory, subject: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Literature">Literature</option>
                  <option value="History">History</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Business">Business</option>
                  <option value="Economics">Economics</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Sociology">Sociology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Story Type
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setNewStory({ ...newStory, type: 'text' })}
                    className={`px-4 py-2 rounded-lg border ${
                      newStory.type === 'text'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setNewStory({ ...newStory, type: 'image' })}
                    className={`px-4 py-2 rounded-lg border ${
                      newStory.type === 'image'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Image
                  </button>
                </div>
              </div>

              {newStory.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  {newStory.image && (
                    <img
                      src={newStory.image}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg mt-2"
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={newStory.content}
                  onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                  placeholder="What's happening in your learning journey?"
                  className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashtags (optional)
                </label>
                <input
                  type="text"
                  value={newStory.hashtags.join(', ')}
                  onChange={(e) => setNewStory({ 
                    ...newStory, 
                    hashtags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                  })}
                  placeholder="Enter hashtags separated by commas (e.g., #learning, #coding, #math)"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple hashtags with commas</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateStory(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStory}
                disabled={isCreating || (!newStory.content.trim() && !newStory.image) || !newStory.subject}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal */}
      {showStoryViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-md h-96 bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setShowStoryViewer(false)}
              className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={stories[currentStoryIndex]?.author.avatar}
                  alt={stories[currentStoryIndex]?.author.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {stories[currentStoryIndex]?.author.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatTimeAgo(stories[currentStoryIndex]?.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center">
                {stories[currentStoryIndex]?.type === 'image' && stories[currentStoryIndex]?.image ? (
                  <img
                    src={stories[currentStoryIndex].image}
                    alt="Story"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-gray-700 text-lg">{stories[currentStoryIndex]?.content}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLikeStory(stories[currentStoryIndex]?.id)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600"
                  >
                    <Heart className="w-5 h-5" />
                    <span>{stories[currentStoryIndex]?.likes}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <MessageCircle className="w-5 h-5" />
                    <span>Reply</span>
                  </button>
                </div>
                <button className="text-gray-600 hover:text-gray-800">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoriesPage;