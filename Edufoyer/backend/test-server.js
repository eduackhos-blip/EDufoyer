import mongoose from 'mongoose';
import { config } from './config.js';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function testServer() {
  try {
    console.log('🧪 Testing if server is running...\n');
    
    // Test if we can connect to the server
    const response = await fetch('http://localhost:5000/health');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is running!');
      console.log('📊 Health check response:', data);
    } else {
      console.log('❌ Server is not responding properly');
      console.log('📊 Status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    console.log('💡 Make sure the backend server is running on port 5000');
    console.log('💡 Run: node server.js');
  } finally {
    mongoose.connection.close();
  }
}

testServer();
