import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';
import jwt from 'jsonwebtoken';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function testAdminAuth() {
  try {
    console.log('🔐 Testing admin authentication...\n');
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@nls.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log(`   Name: ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive}`);
    
    // Generate token
    const token = jwt.sign({ userId: admin._id }, config.JWT_SECRET, { 
      expiresIn: '24h' 
    });
    
    console.log('\n🔑 Generated token:');
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    console.log('\n✅ Token verification:');
    console.log(`   Decoded userId: ${decoded.userId}`);
    console.log(`   Expires: ${new Date(decoded.exp * 1000)}`);
    
    // Test admin check
    const user = await User.findById(decoded.userId).select('-password');
    console.log('\n👤 User lookup:');
    console.log(`   Found user: ${user ? 'Yes' : 'No'}`);
    if (user) {
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Is admin: ${user.role === 'admin'}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing admin auth:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminAuth();
