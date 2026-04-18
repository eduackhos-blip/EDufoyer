// @ts-nocheck
// Use relative URLs for same-origin requests
const API_BASE_URL = "/api/auth";

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Set token in localStorage and memory
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Remove token from localStorage and memory
  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Get current token
  getToken() {
    return this.token || localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Make authenticated requests
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
      this.removeToken();
      throw new Error('Authentication failed');
    }

    return response;
  }

  getApiErrorMessage(data, fallbackMessage) {
    return data?.error || data?.message || fallbackMessage;
  }

  /** Avoids `response.json()` on empty/non-JSON bodies (e.g. truncated large payloads). */
  async parseJsonResponse(response, emptyMessage) {
    const text = await response.text();
    if (text == null || String(text).trim() === '') {
      throw new Error(emptyMessage || `Empty response (HTTP ${response.status})`);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Invalid JSON from server (HTTP ${response.status})`);
    }
  }

  // Login user
  async login(email, password) {
    try {
      console.log('Attempting login to:', `${API_BASE_URL}/login`);
      console.log('Login data:', { email, password: '***' });
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Invalid server response (${response.status}).`);
      }
      console.log('Response data:', data);

      // Immediate check for undefined data
      if (data === undefined) {
        console.error('Data is undefined immediately after parsing');
        throw new Error('Server returned undefined response');
      }
      
      if (data === null) {
        console.error('Data is null immediately after parsing');
        throw new Error('Server returned null response');
      }

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Login failed'));
      }

      // Final safety check before accessing data.success
      if (data === undefined || data === null) {
        console.error('Data is undefined/null at final check');
        throw new Error('Server returned invalid response');
      }

      if (data.success && data.data.token) {
        this.setToken(data.data.token);
        return {
          success: true,
          user: data.data.user,
          token: data.data.token
        };
      }

      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Register user
  async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Invalid server response (${response.status}).`);
      }

      // Immediate check for undefined data
      if (data === undefined) {
        console.error('Data is undefined immediately after parsing');
        throw new Error('Server returned undefined response');
      }
      
      if (data === null) {
        console.error('Data is null immediately after parsing');
        throw new Error('Server returned null response');
      }

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Registration failed'));
      }

      // Final safety check before accessing data.success
      if (data === undefined || data === null) {
        console.error('Data is undefined/null at final check');
        throw new Error('Server returned invalid response');
      }

      if (data.success) {
        // Check if email verification is required
        if (data.data.verificationRequired) {
          return {
            success: true,
            message: data.message,
            verificationRequired: true,
            user: data.data.user
          };
        } else if (data.data.token) {
          // Store token and user data for immediate login
          this.setToken(data.data.token);
          return {
            success: true,
            user: data.data.user,
            token: data.data.token
          };
        }
      }

      throw new Error(this.getApiErrorMessage(data, 'Invalid response from server'));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/profile`);
      const data = await this.parseJsonResponse(
        response,
        `No profile data (HTTP ${response.status}).`
      );

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Failed to fetch profile'));
      }

      return data.data.user;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      const data = await this.parseJsonResponse(
        response,
        'Profile update returned an empty response. Very large images can exceed server limits—try smaller files, or save without huge photos first.'
      );

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Profile update failed'));
      }

      return data.data.user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async changePassword({ currentPassword, newPassword }) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Failed to change password'));
      }
      return data.data?.user ?? null;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.getToken()) {
        await this.makeAuthenticatedRequest(`${API_BASE_URL}/logout`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeToken();
    }
  }

  // Forgot password - request password reset
  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      // Check if response has content and is JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid server response. Please try again.');
        }
      } else {
        // If not JSON, try to get text response
        const text = await response.text();
        throw new Error(text || `Server error (${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Failed to send password reset email'));
      }

      return {
        success: true,
        message: data.message || 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      // If it's already an Error object with message, throw it as is
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise wrap it
      throw new Error(error.message || 'Failed to send password reset email. Please try again.');
    }
  }

  // Verify OTP for password reset
  async verifyResetOTP(email, otp) {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      // Check if response has content and is JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid server response. Please try again.');
        }
      } else {
        // If not JSON, try to get text response
        const text = await response.text();
        throw new Error(text || `Server error (${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Failed to verify OTP'));
      }

      return {
        success: true,
        message: data.message || 'OTP verified successfully'
      };
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.message || 'Failed to verify OTP. Please try again.');
    }
  }

  // Reset password with OTP
  async resetPassword(email, otp, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp, password }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      // Check if response has content and is JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : {};
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid server response. Please try again.');
        }
      } else {
        // If not JSON, try to get text response
        const text = await response.text();
        throw new Error(text || `Server error (${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Failed to reset password'));
      }

      return {
        success: true,
        message: data.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      // If it's already an Error object with message, throw it as is
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise wrap it
      throw new Error(error.message || 'Failed to reset password. Please try again.');
    }
  }

  // Admin onboard solver
  async onboardSolver(solverData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/admin/onboard-solver`, {
        method: 'POST',
        body: JSON.stringify(solverData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(this.getApiErrorMessage(data, 'Failed to onboard solver'));
      }

      return data;
    } catch (error) {
      console.error('Solver onboarding error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
