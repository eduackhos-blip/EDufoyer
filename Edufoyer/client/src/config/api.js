// API Configuration - Use relative URLs for same-origin requests
export const API_ENDPOINTS = {
  BASE_URL: '', // Use relative URLs
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    PROFILE: '/api/profile'
  },
  SOCKET_URL: window.location.origin
};

export default API_ENDPOINTS;


