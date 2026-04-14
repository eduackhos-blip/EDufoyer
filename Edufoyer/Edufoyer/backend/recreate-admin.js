import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function recreateAdmin() {
  try {
    console.log('🔧 Recreating admin user...\n');
    
    // Delete existing admin
    const deleteResult = await User.deleteOne({ email: 'admin@nls.com' });
    console.log('🗑️ Deleted existing admin:', deleteResult.deletedCount > 0 ? 'Success' : 'Not found');
    
    // Create new admin with correct password
    const newAdmin = new User({
      name: 'Admin User',
      email: 'admin@nls.com',
      password: 'admin123', // This will be hashed by the pre-save middleware
      role: 'admin',
      isActive: true,
      emailVerified: true
    });
    
    await newAdmin.save();
    console.log('✅ New admin user created');
    
    // Test the password
    const isPasswordValid = await newAdmin.comparePassword('admin123');
    console.log(`🔐 Password test: ${isPasswordValid ? 'Success' : 'Failed'}`);
    
    if (isPasswordValid) {
      console.log('\n🎉 Admin login credentials:');
      console.log('   Email: admin@nls.com');
      console.log('   Password: admin123');
      console.log('\n✅ You can now login with these credentials!');
    } else {
      console.log('❌ Password test failed - there may be an issue with password hashing');
    }
    
  } catch (error) {
    console.error('❌ Error recreating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

recreateAdmin();
