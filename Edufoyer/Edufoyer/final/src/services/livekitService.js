// Use relative URLs for same-origin requests
const API_BASE_URL = '/api/livekit';

class LiveKitService {
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

  // Generate LiveKit token for doubt session (optimized)
  async generateToken(doubtId) {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/generate-token`, {
        method: 'POST',
        body: JSON.stringify({ doubtId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = 'Failed to generate token';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
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
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Double check that data exists and is an object
      if (!data) {
        console.error('Data is still undefined after validation');
        throw new Error('No response data received from server');
      }

      // Ensure success property exists
      if (data.success === undefined) {
        console.warn('Response missing success property:', data);
        data.success = true; // Assume success if not specified
      }

      return data;
    } catch (error) {
      console.error('Generate token error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Token generation timeout. Please try again.');
      }
      if (error.message.includes('Network error')) {
        throw new Error('Unable to connect to server. Please check your connection and try again.');
      }
      throw error;
    }
  }

  // Schedule a LiveKit room with a scheduled time and maximum participants
  async scheduleRoom({ roomBase = 'pyq', scheduledAt, maxParticipants = 2 }) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/schedule-room`, {
        method: 'POST',
        body: JSON.stringify({ roomBase, scheduledAt, maxParticipants }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule room');
      }
      return data;
    } catch (error) {
      console.error('Schedule room error:', error);
      throw error;
    }
  }

  // Generate token by explicit room name (for PYQ or custom rooms)
  async tokenByRoom(roomName) {
    try {
      const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/token-by-room`, {
        method: 'POST',
        body: JSON.stringify({ roomName }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate token');
      }
      return data;
    } catch (error) {
      console.error('Token by room error:', error);
      throw error;
    }
  }

  // New method for email-based session joins (no auth required)
  async generateTokenForEmailJoin(doubtId) {
    try {
      console.log('Generating LiveKit token for email join, doubt:', doubtId);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/generate-token-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doubtId }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMessage = response.statusText || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
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
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Double check that data exists and is an object
      if (!data) {
        console.error('Data is still undefined after validation');
        throw new Error('No response data received from server');
      }

      // Ensure success property exists
      if (data.success === undefined) {
        console.warn('Response missing success property:', data);
        data.success = true; // Assume success if not specified
      }

      return data;
    } catch (error) {
      console.error('Generate token for email join error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Token generation timeout. Please try again.');
      }
      if (error.message.includes('Network error')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }
}

const livekitService = new LiveKitService();
export default livekitService;
