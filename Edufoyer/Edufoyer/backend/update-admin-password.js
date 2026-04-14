import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function updateAdminPassword() {
  try {
    console.log('🔧 Updating admin password...\n');
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@nls.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', admin.name, admin.email);
    
    // Update password
    const newPassword = 'admin123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('✅ Admin password updated successfully');
    
    // Test the new password
    const isPasswordValid = await admin.comparePassword(newPassword);
    console.log(`🔐 Password test: ${isPasswordValid ? 'Success' : 'Failed'}`);
    
    if (isPasswordValid) {
      console.log('\n🎉 Admin login credentials:');
      console.log('   Email: admin@nls.com');
      console.log('   Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateAdminPassword();
