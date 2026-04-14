// Use relative URLs for same-origin requests
const API_BASE_URL = '/api/social';

class SocialService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    console.log('Making authenticated request to:', url);
    console.log('Token available:', !!token);
    
    // Always require authentication for social routes
    if (!token) {
      console.error('No authentication token found for social request');
      throw new Error('Authentication required');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        console.error('Authentication failed - 401 status');
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  // ==================== POST METHODS ====================

  // Create a new post
  async createPost(postData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/posts`, {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      return data;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  // Get posts feed
  async getPosts(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/posts?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }

      return data.data;
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  }

  // Like/unlike a post
  async toggleLike(postId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}/like`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle like');
      }

      return data;
    } catch (error) {
      console.error('Toggle like error:', error);
      throw error;
    }
  }

  // Add comment to post
  async addComment(postId, content) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add comment');
      }

      return data;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  }

  // Share a post
  async sharePost(postId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}/share`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to share post');
      }

      return data;
    } catch (error) {
      console.error('Share post error:', error);
      throw error;
    }
  }

  // Save/unsave a post
  async toggleSave(postId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/posts/${postId}/save`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle save');
      }

      return data;
    } catch (error) {
      console.error('Toggle save error:', error);
      throw error;
    }
  }

  // ==================== FRIEND METHODS ====================

  // Send friend request
  async sendFriendRequest(recipientEmail, message = '') {
    try {
      // First, try to find user by email
      const findUserResponse = await this.makeAuthenticatedRequest(`${API_BASE_URL}/users/find-by-email`, {
        method: 'POST',
        body: JSON.stringify({ email: recipientEmail }),
      });

      if (!findUserResponse.ok) {
        throw new Error('User not found with this email address');
      }

      const userData = await findUserResponse.json();
      const recipientId = userData.data.id;

      // Now send the friend request
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        body: JSON.stringify({ recipientId, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send friend request');
      }

      return data;
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    }
  }

  // Send friend request by user ID
  async sendFriendRequestById(recipientId, message = '') {
    try {
      console.log('sendFriendRequestById called with recipientId:', recipientId);
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/friends/request`, {
        method: 'POST',
        body: JSON.stringify({ recipientId, message }),
      });

      console.log('Friend request response status:', response.status);
      const data = await response.json();
      console.log('Friend request response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send friend request');
      }

      return data;
    } catch (error) {
      console.error('Send friend request by ID error:', error);
      throw error;
    }
  }

  // Get user's own posts
  async getUserPosts() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/posts/user`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user posts');
      }

      return data;
    } catch (error) {
      console.error('Get user posts error:', error);
      throw error;
    }
  }

  // Get user's own stories
  async getUserStories() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/stories/user`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user stories');
      }

      return data;
    } catch (error) {
      console.error('Get user stories error:', error);
      throw error;
    }
  }

  // Get friends list
  async getFriends() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/friends`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch friends');
      }

      return data.data;
    } catch (error) {
      console.error('Get friends error:', error);
      throw error;
    }
  }

  // Get pending friend requests
  async getFriendRequests() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/friends/requests`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch friend requests');
      }

      return data.data;
    } catch (error) {
      console.error('Get friend requests error:', error);
      throw error;
    }
  }

  // Accept friend request
  async acceptFriendRequest(requestId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/friends/${requestId}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept friend request');
      }

      return data;
    } catch (error) {
      console.error('Accept friend request error:', error);
      throw error;
    }
  }

  // Decline friend request
  async declineFriendRequest(requestId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/friends/${requestId}/decline`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to decline friend request');
      }

      return data;
    } catch (error) {
      console.error('Decline friend request error:', error);
      throw error;
    }
  }

  // Get friend suggestions
  async getFriendSuggestions() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/friends/suggestions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch friend suggestions');
      }

      return data.data;
    } catch (error) {
      console.error('Get friend suggestions error:', error);
      throw error;
    }
  }

  // Search users by name
  async searchUsers(name) {
    try {
      console.log('socialService.searchUsers called with:', name);
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/users/search`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });

      console.log('Search users response status:', response.status);
      const data = await response.json();
      console.log('Search users response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search users');
      }

      return data.data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // ==================== STUDY GROUP METHODS ====================

  // Create study group
  async createStudyGroup(groupData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/study-groups`, {
        method: 'POST',
        body: JSON.stringify(groupData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create study group');
      }

      return data;
    } catch (error) {
      console.error('Create study group error:', error);
      throw error;
    }
  }

  // Get study groups
  async getStudyGroups(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/study-groups?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch study groups');
      }

      return data.data;
    } catch (error) {
      console.error('Get study groups error:', error);
      throw error;
    }
  }

  // Join study group
  async joinStudyGroup(groupId, inviteCode = null) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/study-groups/${groupId}/join`, {
        method: 'POST',
        body: JSON.stringify({ inviteCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to join study group');
      }

      return data;
    } catch (error) {
      console.error('Join study group error:', error);
      throw error;
    }
  }

  // ==================== STORY METHODS ====================

  // Create a story
  async createStory(storyData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/stories`, {
        method: 'POST',
        body: JSON.stringify(storyData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create story');
      }

      return data;
    } catch (error) {
      console.error('Create story error:', error);
      throw error;
    }
  }

  // Get active stories
  async getStories() {
    try {
      // Try authenticated route first
      try {
        const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/stories`);
        const data = await response.json();

        console.log('getStories - Authenticated response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch stories');
        }

        return data;
      } catch (authError) {
        console.log('Authentication failed, trying test route:', authError.message);
        // Fallback to test route for debugging
        const response = await fetch(`${API_BASE_URL}/test/stories`);
        const data = await response.json();

        console.log('getStories - Test route response:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch stories');
        }

        return data;
      }
    } catch (error) {
      console.error('Get stories error:', error);
      throw error;
    }
  }

  // View a story
  async viewStory(storyId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/stories/${storyId}/view`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to view story');
      }

      return data;
    } catch (error) {
      console.error('View story error:', error);
      throw error;
    }
  }

  // ==================== SEARCH METHODS ====================

  // Search users
  async searchUsers(query, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/search/users?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search users');
      }

      return data.data;
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // Search posts
  async searchPosts(query, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/search/posts?${queryParams}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to search posts');
      }

      return data.data;
    } catch (error) {
      console.error('Search posts error:', error);
      throw error;
    }
  }
}

const socialService = new SocialService();
export default socialService;
