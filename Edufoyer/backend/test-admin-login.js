import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function testAdminLogin() {
  try {
    console.log('🧪 Testing Admin Login Credentials...\n');
    
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
    
    // Test password
    const testPassword = 'admin123';
    console.log(`\n🔐 Testing password: ${testPassword}`);
    
    const isPasswordValid = await admin.comparePassword(testPassword);
    console.log(`   Password valid: ${isPasswordValid ? 'Yes' : 'No'}`);
    
    if (!isPasswordValid) {
      console.log('\n🔧 Creating new admin with correct password...');
      
      // Create a new admin user with the correct password
      const newAdmin = new User({
        name: 'Admin User',
        email: 'admin@nls.com',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        emailVerified: true
      });
      
      await newAdmin.save();
      console.log('✅ New admin user created with correct password');
      
      // Test the new password
      const newPasswordValid = await newAdmin.comparePassword('admin123');
      console.log(`   New password valid: ${newPasswordValid ? 'Yes' : 'No'}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAdminLogin();
