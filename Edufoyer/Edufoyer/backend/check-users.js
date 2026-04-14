import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function checkUsers() {
  try {
    console.log('🔍 Checking all users and their roles...\n');
    
    const users = await User.find({}, 'name email role isActive createdAt');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    const adminUsers = users.filter(user => user.role === 'admin');
    console.log(`\n🛡️ Admin users: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUsers();

















