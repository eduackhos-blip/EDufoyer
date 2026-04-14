// Use relative URLs for same-origin requests
const API_BASE_URL = '/api/profile';

class ProfileService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
      throw new Error('Authentication failed');
    }

    return response;
  }

  // Create user profile
  async createProfile(profileData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/create`, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create profile');
      }

      return data;
    } catch (error) {
      console.error('Create profile error:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      return data.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }
}

const profileService = new ProfileService();
export default profileService;
