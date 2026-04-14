import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function createAdmin() {
  try {
    const email = 'admin@nls.com';
    const password = 'admin123';
    const name = 'Admin User';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role:', existingAdmin.role);
      return;
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create admin user
    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true
    });
    
    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: admin');
    console.log('\n🎉 You can now login with these credentials!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();
























