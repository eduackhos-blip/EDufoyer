import mongoose from 'mongoose';
import User from './models/User.js';
import { config } from './config.js';

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI || 'mongodb://localhost:27017/finalnls');

async function makeUserAdmin(email) {
  try {
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    // Update role to admin
    user.role = 'admin';
    await user.save();

    console.log('✅ User promoted to admin successfully!');
    console.log('User details:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- ID:', user._id);

  } catch (error) {
    console.error('❌ Error making user admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node make-admin.js <email>');
  console.log('Example: node make-admin.js john@example.com');
  process.exit(1);
}

makeUserAdmin(email);
























