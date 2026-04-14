import axios from 'axios';
import { performance } from 'perf_hooks';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 50;
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 10;
const TEST_DURATION_SECONDS = parseInt(process.env.TEST_DURATION) || 60;

// Test data
const testUsers = [];
const authTokens = [];

// Statistics
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: {},
  endpoints: {}
};

// Helper function to create axios instance
const createAxiosInstance = (token = null) => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });
  return instance;
};

// Helper function to measure request time
const measureRequest = async (requestFn, endpoint) => {
  const startTime = performance.now();
  try {
    const result = await requestFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.responseTimes.push(duration);
    
    if (!stats.endpoints[endpoint]) {
      stats.endpoints[endpoint] = {
        total: 0,
        success: 0,
        failed: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        times: []
      };
    }
    
    stats.endpoints[endpoint].total++;
    stats.endpoints[endpoint].success++;
    stats.endpoints[endpoint].times.push(duration);
    stats.endpoints[endpoint].minTime = Math.min(stats.endpoints[endpoint].minTime, duration);
    stats.endpoints[endpoint].maxTime = Math.max(stats.endpoints[endpoint].maxTime, duration);
    
    return { success: true, duration, status: result.response?.status || 200, data: result.data };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    stats.totalRequests++;
    stats.failedRequests++;
    stats.responseTimes.push(duration);
    
    const errorKey = error.response?.status || error.code || 'UNKNOWN';
    stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
    
    if (!stats.endpoints[endpoint]) {
      stats.endpoints[endpoint] = {
        total: 0,
        success: 0,
        failed: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        times: []
      };
    }
    
    stats.endpoints[endpoint].total++;
    stats.endpoints[endpoint].failed++;
    stats.endpoints[endpoint].times.push(duration);
    
    return { success: false, duration, error: error.message, status: error.response?.status };
  }
};

// Test endpoints
const testEndpoints = {
  // Public endpoints
  health: async () => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/health');
    return { response, data: response.data };
  },
  
  // Auth endpoints
  register: async (userData) => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/auth/register', userData);
    return { response, data: response.data };
  },
  
  login: async (credentials) => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/auth/login', credentials);
    return { response, data: response.data };
  },
  
  verifyEmail: async (data) => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/auth/verify-email', data);
    return { response, data: response.data };
  },
  
  forgotPassword: async (email) => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/auth/forgot-password', { email });
    return { response, data: response.data };
  },
  
  // Profile endpoints
  getProfile: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/profile');
    return { response, data: response.data };
  },
  
  createProfile: async (token, profileData) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.post('/api/profile/create', profileData);
    return { response, data: response.data };
  },
  
  // Doubt endpoints
  createDoubt: async (token, doubtData) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.post('/api/doubts/create', doubtData);
    return { response, data: response.data };
  },
  
  getMyDoubts: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/doubts/my-doubts');
    return { response, data: response.data };
  },
  
  getAllDoubts: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/doubts/all');
    return { response, data: response.data };
  },
  
  getDoubtById: async (token, doubtId) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get(`/api/doubts/${doubtId}`);
    return { response, data: response.data };
  },
  
  submitFeedback: async (token, feedbackData) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.post('/api/doubts/feedback', feedbackData);
    return { response, data: response.data };
  },
  
  // Solver endpoints
  getAvailableDoubts: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/solver/available-doubts');
    return { response, data: response.data };
  },
  
  getAssignedDoubts: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/solver/assigned-doubts');
    return { response, data: response.data };
  },
  
  acceptDoubt: async (token, doubtId) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.post('/api/solver/accept-doubt', { doubtId });
    return { response, data: response.data };
  },
  
  completeDoubt: async (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.post('/api/solver/complete-doubt', data);
    return { response, data: response.data };
  },
  
  getSolvedDoubts: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/solver/solved-doubts');
    return { response, data: response.data };
  },
  
  getSolverMetrics: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/solver/metrics');
    return { response, data: response.data };
  },
  
  // Notification endpoints
  getNotifications: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/notifications');
    return { response, data: response.data };
  },
  
  markAllRead: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.patch('/api/notifications/mark-read');
    return { response, data: response.data };
  },
  
  // Wallet endpoints
  getWallet: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/wallet');
    return { response, data: response.data };
  },
  
  getWalletBalance: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/wallet/balance');
    return { response, data: response.data };
  },
  
  // LiveKit endpoints
  generateToken: async (token, doubtId) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.post('/api/livekit/generate-token', { doubtId });
    return { response, data: response.data };
  },
  
  // Social endpoints
  getPosts: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/social/posts');
    return { response, data: response.data };
  },
  
  createPost: async (token, postData) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.post('/api/social/posts', postData);
    return { response, data: response.data };
  },
  
  getFriends: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/social/friends');
    return { response, data: response.data };
  },
  
  getStudyGroups: async (token) => {
    const axiosInstance = createAxiosInstance(token);
    const response = await axiosInstance.get('/api/social/study-groups');
    return { response, data: response.data };
  },
  
  // Rating endpoints
  getPublicRatings: async () => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/api/rating/public');
    return { response, data: response.data };
  },
  
  submitRating: async (ratingData) => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.post('/api/rating/submit', ratingData);
    return { response, data: response.data };
  },
  
  // Payment endpoints
  testPayment: async () => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/api/payment/test');
    return { response, data: response.data };
  },
  
  // University endpoints
  getDoubtBalance: async (email) => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get(`/api/university/doubt-balance?university_email=${email}`);
    return { response, data: response.data };
  },
  
  getKiitUsers: async () => {
    const axiosInstance = createAxiosInstance();
    const response = await axiosInstance.get('/api/university/kiit-users');
    return { response, data: response.data };
  }
};

// Generate test data
const generateTestUser = (index) => {
  const timestamp = Date.now();
  return {
    name: `Test User ${index} ${timestamp}`,
    email: `testuser${index}_${timestamp}@kiit.ac.in`,
    password: 'TestPassword123!'
  };
};

const generateDoubtData = () => {
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Biology'];
  const categories = ['small', 'medium', 'large'];
  
  return {
    subject: subjects[Math.floor(Math.random() * subjects.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
    description: `This is a test doubt description. ${Math.random().toString(36).substring(7)}`
  };
};

// Simulate user session
const simulateUserSession = async (userIndex) => {
  const user = generateTestUser(userIndex);
  let token = null;
  const sessionResults = [];
  
  try {
    // 1. Health check
    await measureRequest(() => testEndpoints.health(), 'GET /health');
    
    // 2. Register user (may fail if user exists, that's ok)
    const registerResult = await measureRequest(
      () => testEndpoints.register(user),
      'POST /api/auth/register'
    );
    
    // 3. Login (use existing credentials if register failed)
    const loginResult = await measureRequest(
      () => testEndpoints.login({
        email: user.email,
        password: user.password
      }),
      'POST /api/auth/login'
    );
    
    if (loginResult.success && loginResult.data?.data?.token) {
      token = loginResult.data.data.token;
      authTokens.push(token);
    } else if (loginResult.success && loginResult.data?.token) {
      token = loginResult.data.token;
      authTokens.push(token);
    }
    
    // If we have a token, test authenticated endpoints
    if (token) {
      // Profile endpoints
      await measureRequest(() => testEndpoints.getProfile(token), 'GET /api/profile');
      
      // Doubt endpoints
      await measureRequest(() => testEndpoints.getMyDoubts(token), 'GET /api/doubts/my-doubts');
      await measureRequest(() => testEndpoints.getAllDoubts(token), 'GET /api/doubts/all');
      
      // Solver endpoints
      await measureRequest(() => testEndpoints.getAvailableDoubts(token), 'GET /api/solver/available-doubts');
      await measureRequest(() => testEndpoints.getAssignedDoubts(token), 'GET /api/solver/assigned-doubts');
      
      // Notification endpoints
      await measureRequest(() => testEndpoints.getNotifications(token), 'GET /api/notifications');
      
      // Wallet endpoints
      await measureRequest(() => testEndpoints.getWallet(token), 'GET /api/wallet');
      await measureRequest(() => testEndpoints.getWalletBalance(token), 'GET /api/wallet/balance');
      
      // Social endpoints
      await measureRequest(() => testEndpoints.getPosts(token), 'GET /api/social/posts');
      await measureRequest(() => testEndpoints.getFriends(token), 'GET /api/social/friends');
      await measureRequest(() => testEndpoints.getStudyGroups(token), 'GET /api/social/study-groups');
    }
    
    // Public endpoints (no auth required)
    await measureRequest(() => testEndpoints.getPublicRatings(), 'GET /api/rating/public');
    await measureRequest(() => testEndpoints.testPayment(), 'GET /api/payment/test');
    
  } catch (error) {
    console.error(`Error in user session ${userIndex}:`, error.message);
  }
  
  return sessionResults;
};

// Run stress test
const runStressTest = async () => {
  console.log('🚀 Starting Stress Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`Test Duration: ${TEST_DURATION_SECONDS} seconds`);
  console.log('='.repeat(60));
  console.log('');
  
  const startTime = performance.now();
  const endTime = startTime + (TEST_DURATION_SECONDS * 1000);
  
  // Create concurrent user sessions
  const userPromises = [];
  
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(
      (async () => {
        while (performance.now() < endTime) {
          await simulateUserSession(i);
          // Small delay between sessions
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      })()
    );
  }
  
  // Wait for all users to complete or timeout
  await Promise.allSettled(userPromises);
  
  const totalDuration = (performance.now() - startTime) / 1000;
  
  // Calculate statistics
  const calculateStats = (times) => {
    if (times.length === 0) return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    
    const sorted = [...times].sort((a, b) => a - b);
    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  };
  
  const overallStats = calculateStats(stats.responseTimes);
  
  // Calculate endpoint statistics
  Object.keys(stats.endpoints).forEach(endpoint => {
    const ep = stats.endpoints[endpoint];
    ep.avgTime = ep.times.length > 0 
      ? ep.times.reduce((a, b) => a + b, 0) / ep.times.length 
      : 0;
    const sorted = [...ep.times].sort((a, b) => a - b);
    ep.p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    ep.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    ep.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  });
  
  // Print results
  console.log('\n📊 Stress Test Results');
  console.log('='.repeat(60));
  console.log(`Total Duration: ${totalDuration.toFixed(2)} seconds`);
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful Requests: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Failed Requests: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Requests per Second: ${(stats.totalRequests / totalDuration).toFixed(2)}`);
  console.log('');
  
  console.log('⏱️  Response Time Statistics (ms)');
  console.log('-'.repeat(60));
  console.log(`Average: ${overallStats.avg.toFixed(2)}ms`);
  console.log(`Min: ${overallStats.min.toFixed(2)}ms`);
  console.log(`Max: ${overallStats.max.toFixed(2)}ms`);
  console.log(`P50 (Median): ${overallStats.p50.toFixed(2)}ms`);
  console.log(`P95: ${overallStats.p95.toFixed(2)}ms`);
  console.log(`P99: ${overallStats.p99.toFixed(2)}ms`);
  console.log('');
  
  if (Object.keys(stats.errors).length > 0) {
    console.log('❌ Error Breakdown');
    console.log('-'.repeat(60));
    Object.entries(stats.errors)
      .sort((a, b) => b[1] - a[1])
      .forEach(([error, count]) => {
        console.log(`${error}: ${count} (${((count / stats.failedRequests) * 100).toFixed(2)}%)`);
      });
    console.log('');
  }
  
  console.log('📡 Endpoint Statistics');
  console.log('-'.repeat(60));
  Object.entries(stats.endpoints)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([endpoint, data]) => {
      const successRate = ((data.success / data.total) * 100).toFixed(2);
      console.log(`\n${endpoint}:`);
      console.log(`  Total: ${data.total}`);
      console.log(`  Success: ${data.success} (${successRate}%)`);
      console.log(`  Failed: ${data.failed}`);
      console.log(`  Avg Time: ${data.avgTime.toFixed(2)}ms`);
      console.log(`  Min Time: ${data.minTime === Infinity ? 0 : data.minTime.toFixed(2)}ms`);
      console.log(`  Max Time: ${data.maxTime.toFixed(2)}ms`);
      console.log(`  P50: ${data.p50.toFixed(2)}ms`);
      console.log(`  P95: ${data.p95.toFixed(2)}ms`);
      console.log(`  P99: ${data.p99.toFixed(2)}ms`);
    });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Stress Test Completed');
  
  // Save detailed report to file
  const report = {
    config: {
      baseUrl: BASE_URL,
      concurrentUsers: CONCURRENT_USERS,
      requestsPerUser: REQUESTS_PER_USER,
      testDuration: TEST_DURATION_SECONDS
    },
    summary: {
      totalDuration: totalDuration,
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      successRate: ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2) + '%',
      requestsPerSecond: (stats.totalRequests / totalDuration).toFixed(2),
      responseTimeStats: overallStats
    },
    errors: stats.errors,
    endpoints: stats.endpoints
  };
  
  const fs = await import('fs');
  const reportPath = `stress-test-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
};

// Run the stress test
runStressTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});








