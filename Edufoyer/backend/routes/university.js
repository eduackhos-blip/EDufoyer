import express from 'express';
import UniversityDoubtBalance from '../models/UniversityDoubtBalance.js';
import User from '../models/User.js';
import Doubt from '../models/Doubt.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/university/doubt-balance
// @desc    Get university available doubts balance
// @access  Public (for university admin)
router.get('/doubt-balance', async (req, res) => {
  try {
    console.log('📊 GET /api/university/doubt-balance - Request received');
    const { university_email } = req.query;
    console.log('📊 University email:', university_email);

    if (!university_email) {
      return res.status(400).json({
        success: false,
        message: 'University email is required'
      });
    }

    // Find balance in database - use lean() for better performance
    let balance = await UniversityDoubtBalance.findOne({ 
      university_email: university_email.toLowerCase() 
    }).lean(); // Use lean() to get plain JavaScript object

    console.log('📊 Found balance:', balance ? 'Yes' : 'No');
    console.log('📊 Balance from DB:', balance ? JSON.stringify(balance, null, 2) : 'Not found');

    // If no balance exists, create one with zero balance
    if (!balance) {
      console.log('📊 Creating new balance record...');
      const newBalance = new UniversityDoubtBalance({
        university_email: university_email.toLowerCase(),
        university_name: 'University',
        doubtBuckets: {
          small: 0,
          medium: 0,
          large: 0
        }
      });
      await newBalance.save();
      balance = newBalance.toObject(); // Convert to plain object
      console.log('✅ New balance record created:', JSON.stringify(balance, null, 2));
    }

    // Calculate total - use totalAvailable from model (it's auto-calculated by pre-save hook)
    // But also calculate manually as fallback
    const small = Number(balance.doubtBuckets?.small) || 0;
    const medium = Number(balance.doubtBuckets?.medium) || 0;
    const large = Number(balance.doubtBuckets?.large) || 0;
    const totalAvailable = Number(balance.totalAvailable) || (small + medium + large);

    console.log('📊 Calculating balance:', {
      small,
      medium,
      large,
      totalAvailableFromDB: balance.totalAvailable,
      calculatedTotal: totalAvailable,
      'balance object': balance
    });

    const responseData = {
      success: true,
      data: {
        doubtBuckets: {
          small: small,
          medium: medium,
          large: large
        },
        totalAvailableDoubts: totalAvailable,
        totalAvailable: totalAvailable, // Keep both for compatibility
        university_email: balance.university_email,
        university_name: balance.university_name
      }
    };
    
    console.log('📊 Sending response to frontend:', JSON.stringify(responseData, null, 2));
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('❌ Get university doubt balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doubt balance',
      error: error.message
    });
  }
});

// @route   GET /api/university/kiit-users
// @desc    Get all KIIT users with their doubt counts and activity
// @access  Public (for university admin)
router.get('/kiit-users', async (req, res) => {
  try {
    console.log('👥 GET /api/university/kiit-users - Request received');
    
    // Find all users with @kiit.ac.in email
    const kiitUsers = await User.find({
      email: { $regex: /@kiit\.ac\.in$/i },
      emailVerified: true, // Only verified users
      isActive: true // Only active users
    })
    .select('_id email name createdAt lastLogin')
    .lean()
    .sort({ createdAt: -1 }); // Newest first
    
    console.log(`✅ Found ${kiitUsers.length} KIIT users`);
    
    // Get doubt counts and last active time for each user
    const usersWithStats = await Promise.all(
      kiitUsers.map(async (user) => {
        // Count doubts asked by this user (total)
        const doubtCount = await Doubt.countDocuments({
          doubter_id: user._id
        });

        // Count total doubts by category
        const allDoubts = await Doubt.find({
          doubter_id: user._id
        }).select('category').lean();

        const totalCategoryCounts = {
          small: allDoubts.filter(d => d.category === 'small').length,
          medium: allDoubts.filter(d => d.category === 'medium').length,
          large: allDoubts.filter(d => d.category === 'large').length
        };

        // Count today's doubts by category
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayDoubts = await Doubt.find({
          doubter_id: user._id,
          createdAt: {
            $gte: todayStart,
            $lte: todayEnd
          }
        }).select('category').lean();

        const todayCategoryCounts = {
          small: todayDoubts.filter(d => d.category === 'small').length,
          medium: todayDoubts.filter(d => d.category === 'medium').length,
          large: todayDoubts.filter(d => d.category === 'large').length
        };
        
        // Get last doubt created time (last active)
        const lastDoubt = await Doubt.findOne({
          doubter_id: user._id
        })
        .select('createdAt')
        .sort({ createdAt: -1 })
        .lean();
        
        // Calculate last active time
        let lastActive = 'Never';
        const now = new Date();
        
        if (lastDoubt?.createdAt) {
          const lastActiveDate = new Date(lastDoubt.createdAt);
          const diffInMs = now - lastActiveDate;
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
          const diffInDays = Math.floor(diffInHours / 24);
          
          if (diffInMinutes < 1) {
            lastActive = 'Just now';
          } else if (diffInMinutes < 60) {
            lastActive = `${diffInMinutes}m ago`;
          } else if (diffInHours < 24) {
            lastActive = `${diffInHours}h ago`;
          } else if (diffInDays === 1) {
            lastActive = '1d ago';
          } else {
            lastActive = `${diffInDays}d ago`;
          }
        } else if (user.lastLogin) {
          const lastLoginDate = new Date(user.lastLogin);
          const diffInMs = now - lastLoginDate;
          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
          const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
          const diffInDays = Math.floor(diffInHours / 24);
          
          if (diffInMinutes < 1) {
            lastActive = 'Just now';
          } else if (diffInMinutes < 60) {
            lastActive = `${diffInMinutes}m ago`;
          } else if (diffInHours < 24) {
            lastActive = `${diffInHours}h ago`;
          } else if (diffInDays === 1) {
            lastActive = '1d ago';
          } else {
            lastActive = `${diffInDays}d ago`;
          }
        } else if (user.createdAt) {
          // If no doubt or login, use registration date
          const createdDate = new Date(user.createdAt);
          const diffInMs = now - createdDate;
          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
          
          if (diffInDays === 0) {
            lastActive = 'Today';
          } else if (diffInDays === 1) {
            lastActive = '1d ago';
          } else if (diffInDays < 7) {
            lastActive = `${diffInDays}d ago`;
          } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            lastActive = `${weeks}w ago`;
          } else {
            const months = Math.floor(diffInDays / 30);
            lastActive = `${months}mo ago`;
          }
        }
        
        return {
          id: user._id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          doubts: doubtCount,
          totalCategoryCounts: totalCategoryCounts,
          lastActive: lastActive,
          registeredAt: user.createdAt,
          todayDoubtCounts: todayCategoryCounts,
          todayTotal: todayCategoryCounts.small + todayCategoryCounts.medium + todayCategoryCounts.large
        };
      })
    );
    
    // Sort by doubts asked (descending)
    usersWithStats.sort((a, b) => b.doubts - a.doubts);
    
    console.log(`✅ Returning ${usersWithStats.length} KIIT users with stats`);
    
    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        totalUsers: usersWithStats.length
      }
    });
  } catch (error) {
    console.error('❌ Get KIIT users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KIIT users',
      error: error.message
    });
  }
});

export default router;

