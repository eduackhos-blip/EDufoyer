import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function testAdminAPI() {
  try {
    console.log('🧪 Testing Admin API...\n');
    
    // Get admin user
    const admin = await User.findOne({ email: 'admin@nls.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', admin.name, admin.email, admin.role);
    
    // Generate token
    const token = jwt.sign({ userId: admin._id }, config.JWT_SECRET, { 
      expiresIn: '24h' 
    });
    
    console.log('\n🔑 Generated token:', token.substring(0, 50) + '...');
    
    // Test admin endpoint
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      subjects: ['JavaScript', 'React'],
      experience: 'intermediate',
      bio: 'Test bio'
    };
    
    console.log('\n📡 Testing admin register-solver endpoint...');
    
    const response = await fetch('http://localhost:5000/api/admin/register-solver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Admin API test successful!');
    } else {
      console.log('❌ Admin API test failed!');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin API:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Wait a moment for server to start, then test
setTimeout(() => {
  testAdminAPI();
}, 3000);
