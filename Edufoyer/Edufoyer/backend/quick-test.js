import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

console.log('🔍 Quick API Test');
console.log('='.repeat(50));
console.log(`Testing: ${BASE_URL}`);
console.log('');

// Test health endpoint
try {
  const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
  console.log('✅ Health Check: PASSED');
  console.log('   Status:', response.status);
  console.log('   Response:', JSON.stringify(response.data).substring(0, 100));
} catch (error) {
  console.log('❌ Health Check: FAILED');
  console.log('   Error:', error.message);
  console.log('   Make sure the server is running on', BASE_URL);
  process.exit(1);
}

console.log('');
console.log('✅ Server is running and accessible!');
console.log('You can now run the full stress test with:');
console.log('  node stress-test.js');
console.log('  or');
console.log('  npm run stress-test');








