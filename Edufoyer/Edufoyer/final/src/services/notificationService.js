// Use relative URLs for same-origin requests
const API_BASE_URL = '/api/notifications';

class NotificationService {
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

  // Get user notifications
  async getNotifications(page = 1, limit = 20) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}?page=${page}&limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      return data.data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/mark-read`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notifications as read');
      }

      return data;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  // Mark specific notification as read
  async markAsRead(notificationId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/${notificationId}/read`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }

      return data.data;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
