// Use relative URLs for same-origin requests
const API_BASE_URL = '/api/solver';

class SolverService {
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

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (response.status === 401) {
        throw new Error('Authentication failed');
      }

      return response;
    } catch (error) {
      console.error('Network request failed:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  // Accept a doubt assignment
  async acceptDoubt(doubtId, retryCount = 0) {
    try {
      console.log('Accepting doubt:', doubtId, 'retry:', retryCount);
      
      // Check authentication token first
      const token = this.getToken();
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Authentication token found, length:', token.length);
      
      // Validate token format
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.error('Invalid token format:', tokenParts.length, 'parts');
          localStorage.removeItem('token');
          throw new Error('Invalid token format. Please log in again.');
        }
        console.log('Token format is valid');
        
        // Check if token is expired (basic check)
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < currentTime) {
            console.error('Token is expired');
            localStorage.removeItem('token');
            throw new Error('Your session has expired. Please log in again.');
          }
        } catch (expError) {
          console.error('Token expiration check failed:', expError);
          // Continue anyway, let server validate
        }
      } catch (tokenError) {
        console.error('Token validation error:', tokenError);
        localStorage.removeItem('token');
        throw new Error('Invalid authentication token. Please log in again.');
      }
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/accept-doubt`, {
        method: 'POST',
        body: JSON.stringify({ doubtId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Accept doubt response status:', response.status);
      console.log('Accept doubt response headers:', response.headers);

      // Check if response has content
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      let data;
      try {
        data = await response.json();
        console.log('=== ACCEPT DOUBT DEBUG ===');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Response headers:', response.headers);
        console.log('Accept doubt response data:', data);
        console.log('Data type:', typeof data);
        console.log('Data is null:', data === null);
        console.log('Data is undefined:', data === undefined);
        console.log('Data keys:', data ? Object.keys(data) : 'No keys');
        console.log('=== END DEBUG ===');
        
        // Immediate check for undefined data
        if (data === undefined) {
          console.error('Data is undefined immediately after parsing');
          throw new Error('Server returned undefined response');
        }
        
        if (data === null) {
          console.error('Data is null immediately after parsing');
          throw new Error('Server returned null response');
        }
        
        // Check for empty object
        if (typeof data === 'object' && Object.keys(data).length === 0) {
          console.error('Data is empty object');
          throw new Error('Server returned empty response');
        }
        
        // Additional safety check - ensure data is an object
        if (typeof data !== 'object') {
          console.error('Data is not an object:', typeof data);
          throw new Error('Server returned invalid response format');
        }
        
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        const text = await response.text();
        console.log('Raw response text:', text);
        throw new Error('Server returned invalid JSON response');
      }

      if (!response.ok) {
        // Handle undefined data response - check if data exists first
        let errorMessage;
        console.log('=== ERROR RESPONSE DEBUG ===');
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        console.log('Data type:', typeof data);
        console.log('Data is undefined:', data === undefined);
        console.log('Data is null:', data === null);
        console.log('Data value:', data);
        console.log('=== END ERROR DEBUG ===');
        
        if (data === undefined) {
          errorMessage = `Server error (${response.status}): ${response.statusText} - No response data`;
        } else if (data === null) {
          errorMessage = `Server error (${response.status}): ${response.statusText} - Null response data`;
        } else {
          errorMessage = (data && data.message) || `Server error (${response.status}): ${response.statusText}`;
        }
        
        // Additional safety check for data before accessing properties
        if (data === undefined || data === null) {
          console.error('Data is undefined/null in error handling');
          throw new Error('Server returned invalid response');
        }
        
        // Check for rate limiting errors
        if (response.status === 429 || (data && data.message && data.message.includes('Too many requests'))) {
          console.error('Rate limiting error:', errorMessage);
          if (retryCount < 2) {
            console.log('Retrying after rate limit...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return this.acceptDoubt(doubtId, retryCount + 1);
          }
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        
        // Check for authentication errors
        if (response.status === 401 || (data && data.message && data.message.includes('token'))) {
          console.error('Authentication error:', errorMessage);
          // Clear invalid token
          localStorage.removeItem('token');
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(errorMessage);
      }

      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('Invalid response structure:', data);
        console.error('Data is null:', data === null);
        console.error('Data is undefined:', data === undefined);
        console.error('Data type:', typeof data);
        throw new Error('Invalid response format from server');
      }

      // Double check that data exists and is an object
      if (!data) {
        console.error('Data is still undefined after validation');
        throw new Error('No response data received from server');
      }

      // Final safety check before accessing data.success
      if (data === undefined || data === null) {
        console.error('Data is undefined/null at final check');
        throw new Error('Server returned invalid response');
      }

      console.log('=== SUCCESS PATH DEBUG ===');
      console.log('Data type:', typeof data);
      console.log('Data is undefined:', data === undefined);
      console.log('Data is null:', data === null);
      console.log('Data value:', data);
      console.log('Data keys:', data ? Object.keys(data) : 'No keys');
      console.log('=== END SUCCESS DEBUG ===');

      // Ensure success property exists
      if (data.success === undefined) {
        console.warn('Response missing success property:', data);
        data.success = true; // Assume success if not specified
      }

      // Final validation
      if (!data.success) {
        const errorMessage = data.message || 'Request failed';
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('Accept doubt error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      if (error.message.includes('Network error')) {
        throw new Error('Unable to connect to server. Please check your connection and try again.');
      }
      throw error;
    }
  }

  // Get assigned doubts
  async getAssignedDoubts(status = 'all') {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/assigned-doubts?status=${status}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch assigned doubts');
      }

      return data.data;
    } catch (error) {
      console.error('Get assigned doubts error:', error);
      throw error;
    }
  }

  // Get available doubts
  async getAvailableDoubts() {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/available-doubts`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available doubts');
      }

      return data.data;
    } catch (error) {
      console.error('Get available doubts error:', error);
      throw error;
    }
  }

  // Register as solver
  async registerSolver(solverData) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/register`, {
        method: 'POST',
        body: JSON.stringify(solverData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to register as solver');
      }

      return data;
    } catch (error) {
      console.error('Register solver error:', error);
      throw error;
    }
  }

  // Complete a doubt
  async completeDoubt(doubtId, feedbackData = {}) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/complete-doubt`, {
        method: 'POST',
        body: JSON.stringify({
          doubtId,
          ...feedbackData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete doubt');
      }

      return data;
    } catch (error) {
      console.error('Complete doubt error:', error);
      throw error;
    }
  }

  // Get solved doubts
  async getSolvedDoubts(page = 1, limit = 10) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/solved-doubts?page=${page}&limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch solved doubts');
      }

      return data.data;
    } catch (error) {
      console.error('Get solved doubts error:', error);
      throw error;
    }
  }
}

const solverService = new SolverService();
export default solverService;
