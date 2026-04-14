import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env (same pattern as server.js)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TARGET_USER = {
  name: 'rishibakshi',
  email: 'developer200419@gmail.com',
  // Plain text password that will be bcrypt-hashed by this script
  passwordPlain: 'helloWorld@123'
};

async function main() {
  const mongodbUri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/test';

  console.log('=== User Seed Script ===');
  console.log('MONGODB_URI:', mongodbUri);
  console.log('Target email:', TARGET_USER.email);

  await mongoose.connect(mongodbUri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000
  });

  try {
    const existing = await User.findOne({ email: TARGET_USER.email })
      .select('_id')
      .lean();

    if (existing) {
      console.log('User already exists. Skipping seed.');
      return;
    }

    // Hash password using bcryptjs (as requested)
    const salt = await bcrypt.genSalt(12);
    const passwordHashed = await bcrypt.hash(TARGET_USER.passwordPlain, salt);

    // IMPORTANT:
    // User model has a `pre('save')` hook that hashes `password`.
    // We insert directly into the collection to avoid double-hashing.
    const now = new Date();
    await User.collection.insertOne({
      name: TARGET_USER.name,
      email: TARGET_USER.email,
      password: passwordHashed,
      role: 'user',
      isSolver: false,
      isActive: true,
      emailVerified: false,
      username: null,
      avatarUrl: null,
      coverImageUrl: null,
      bio: null,
      createdAt: now,
      updatedAt: now
    });

    console.log('✅ Seeded 1 user document.');
  } finally {
    await mongoose.disconnect();
  }
}

main()
  .then(() => {
    console.log('Done.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });

