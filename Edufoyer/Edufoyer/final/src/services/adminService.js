// Admin service for managing users and solvers
const API_BASE_URL = '/api/admin';

class AdminService {
  constructor() {
    // Don't store token in constructor, always get fresh from localStorage
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = this.getToken();
    console.log('🔐 AdminService - Token check:', token ? 'Token found' : 'No token');
    console.log('🔐 AdminService - Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
    
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

    console.log('📡 AdminService - Making request to:', url);
    console.log('📡 AdminService - Headers:', defaultOptions.headers);

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      console.log('📡 AdminService - Response status:', response.status);
      console.log('📡 AdminService - Response ok:', response.ok);
      
      if (response.status === 401) {
        console.error('❌ AdminService - Authentication failed (401)');
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      console.error('❌ AdminService - Network request failed:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Register any user as solver (admin function)
  async registerUserAsSolver(userData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/register-solver`, {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register user as solver');
      }

      return data;
    } catch (error) {
      console.error('Register user as solver error:', error);
      throw error;
    }
  }

  // Get all users
  async getAllUsers() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/users`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch users');
      }

      return data.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Get all solvers
  async getAllSolvers() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/solvers`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch solvers');
      }

      return data.data;
    } catch (error) {
      console.error('Get all solvers error:', error);
      throw error;
    }
  }

  // Create a new doubt pack
  async createDoubtPack(packData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/doubt-packs`, {
        method: 'POST',
        body: JSON.stringify(packData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create doubt pack');
      }

      return data.data;
    } catch (error) {
      console.error('Create doubt pack error:', error);
      throw error;
    }
  }

  // Get all doubt packs (public endpoint, no auth required)
  async getDoubtPacks(isActive = true) {
    try {
      const queryParam = isActive !== undefined ? `?isActive=${isActive}` : '';
      // Use regular fetch instead of authenticated request for public endpoint
      const response = await fetch(`${API_BASE_URL}/doubt-packs${queryParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch doubt packs');
      }

      return data.data || [];
    } catch (error) {
      console.error('Get doubt packs error:', error);
      throw error;
    }
  }

  // Delete a doubt pack
  async deleteDoubtPack(packId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/doubt-packs/${packId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete doubt pack');
      }

      return true;
    } catch (error) {
      console.error('Delete doubt pack error:', error);
      throw error;
    }
  }

  // Get all solver requests
  async getSolverRequests(status = null) {
    try {
      const queryParam = status ? `?status=${status}` : '';
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/solver-requests${queryParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch solver requests');
      }

      return data.data;
    } catch (error) {
      console.error('Get solver requests error:', error);
      throw error;
    }
  }

  // Approve solver request
  async approveSolverRequest(requestId, adminNotes = '') {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/solver-requests/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve solver request');
      }

      return data;
    } catch (error) {
      console.error('Approve solver request error:', error);
      throw error;
    }
  }

  // Reject solver request
  async rejectSolverRequest(requestId, adminNotes = '') {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/solver-requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject solver request');
      }

      return data;
    } catch (error) {
      console.error('Reject solver request error:', error);
      throw error;
    }
  }

  // Get admin notifications
  async getAdminNotifications() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/notifications`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch notifications');
      }

      return data.data || [];
    } catch (error) {
      console.error('Get admin notifications error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark notification as read');
      }

      return data;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw error;
    }
  }

  // Record doubt pack purchase
  async recordDoubtPackPurchase(purchaseData) {
    try {
      const response = await fetch(`${API_BASE_URL}/doubt-pack-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record purchase');
      }

      return data;
    } catch (error) {
      console.error('Record purchase error:', error);
      throw error;
    }
  }

  // Get all doubt pack purchases
  async getDoubtPackPurchases(limit = 50, skip = 0) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/doubt-pack-purchases?limit=${limit}&skip=${skip}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch purchases');
      }

      return data.data || [];
    } catch (error) {
      console.error('Get purchases error:', error);
      throw error;
    }
  }

  // Get ratings and feedback
  async getRatingsFeedback(filter = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filter.approved !== undefined) queryParams.append('approved', filter.approved);
      if (filter.featured !== undefined) queryParams.append('featured', filter.featured);
      if (filter.limit) queryParams.append('limit', filter.limit);
      if (filter.skip) queryParams.append('skip', filter.skip);

      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/ratings-feedback?${queryParams.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch ratings');
      }

      return data;
    } catch (error) {
      console.error('Get ratings error:', error);
      throw error;
    }
  }

  // Approve rating
  async approveRating(ratingId, featured = false) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/ratings-feedback/${ratingId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ featured }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve rating');
      }

      return data;
    } catch (error) {
      console.error('Approve rating error:', error);
      throw error;
    }
  }

  // Delete rating
  async deleteRating(ratingId) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/ratings-feedback/${ratingId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete rating');
      }

      return data;
    } catch (error) {
      console.error('Delete rating error:', error);
      throw error;
    }
  }

  // Get all withdrawal requests
  async getWithdrawals(status = null) {
    try {
      const url = status 
        ? `${API_BASE_URL}/withdrawals?status=${status}`
        : `${API_BASE_URL}/withdrawals`;
      const response = await this.makeAuthenticatedRequest(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch withdrawals');
      }

      return data.data;
    } catch (error) {
      console.error('Get withdrawals error:', error);
      throw error;
    }
  }

  // Approve withdrawal request
  async approveWithdrawal(withdrawalId, adminNotes = '') {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/withdrawals/${withdrawalId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve withdrawal');
      }

      return data;
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      throw error;
    }
  }

  // Disburse withdrawal payment
  async disburseWithdrawal(withdrawalId, adminNotes = '') {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/withdrawals/${withdrawalId}/disburse`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to disburse withdrawal');
      }

      return data;
    } catch (error) {
      console.error('Disburse withdrawal error:', error);
      throw error;
    }
  }

  // Reject withdrawal request
  async rejectWithdrawal(withdrawalId, adminNotes = '') {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/withdrawals/${withdrawalId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject withdrawal');
      }

      return data;
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      throw error;
    }
  }
}

const adminService = new AdminService();
export default adminService;
