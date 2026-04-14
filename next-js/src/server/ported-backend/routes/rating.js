import express from 'express';
import mongoose from 'mongoose';
import RatingFeedback from '../models/RatingFeedback.js';

const router = express.Router();

// Helper function to check MongoDB connection
const checkMongoConnection = () => {
  try {
    const state = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    return state === 1;
  } catch (error) {
    console.error('Error checking MongoDB connection:', error);
    return false;
  }
};

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rating routes are working',
    mongoConnected: checkMongoConnection(),
    mongoState: mongoose.connection.readyState
  });
});

// @route   POST /api/rating/submit
// @desc    Submit a rating and feedback
// @access  Public
router.post('/submit', async (req, res) => {
  try {
    // Check if model is loaded
    if (!RatingFeedback) {
      console.error('❌ RatingFeedback model not loaded');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error. Please contact administrator.',
        error: 'Model not loaded'
      });
    }

    // Check MongoDB connection
    if (!checkMongoConnection()) {
      console.error('❌ MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.',
        error: 'MongoDB not connected'
      });
    }

    console.log('📝 Rating submission received:', {
      body: req.body,
      headers: req.headers['content-type']
    });

    const { user_name, user_email, rating, feedback } = req.body;

    // Validate required fields
    if (!user_name || !rating || !feedback) {
      console.log('❌ Validation failed - missing required fields:', {
        hasName: !!user_name,
        hasRating: !!rating,
        hasFeedback: !!feedback
      });
      return res.status(400).json({
        success: false,
        message: 'Name, rating, and feedback are required'
      });
    }

    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      console.log('❌ Invalid rating value:', rating);
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Create rating feedback
    const ratingFeedback = new RatingFeedback({
      user_name: user_name.trim(),
      user_email: user_email ? user_email.trim().toLowerCase() : undefined,
      rating: ratingNum,
      feedback: feedback.trim()
    });

    console.log('💾 Saving rating feedback to database...');
    await ratingFeedback.save();
    console.log('✅ Rating feedback saved successfully:', ratingFeedback._id);

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback! Your rating has been submitted.',
      data: ratingFeedback
    });
  } catch (error) {
    console.error('❌ Submit rating error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Ensure response is sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
});

// @route   GET /api/rating/public
// @desc    Get approved ratings and feedback for public display
// @access  Public
router.get('/public', async (req, res) => {
  try {
    console.log('📖 GET /api/rating/public - Request received');
    
    // Check if model is loaded
    if (!RatingFeedback) {
      console.error('❌ RatingFeedback model not loaded');
      return res.status(200).json({
        success: true,
        message: 'No ratings available',
        data: [],
        stats: {
          averageRating: 0,
          totalRatings: 0
        }
      });
    }

    // Check MongoDB connection
    const mongoConnected = checkMongoConnection();
    console.log('📊 MongoDB connection state:', mongoose.connection.readyState, 'Connected:', mongoConnected);
    
    if (!mongoConnected) {
      console.warn('⚠️ MongoDB not connected. Returning empty data.');
      return res.status(200).json({
        success: true,
        message: 'No ratings available',
        data: [],
        stats: {
          averageRating: 0,
          totalRatings: 0
        }
      });
    }

    const { limit = 10 } = req.query;
    console.log('📖 Fetching public ratings with limit:', limit);

    let ratings = [];
    let averageRating = [];

    try {
      ratings = await RatingFeedback.find({ is_approved: true })
        .sort({ is_featured: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .lean(); // Use lean() for better performance

      console.log('✅ Found ratings:', ratings.length);

      averageRating = await RatingFeedback.aggregate([
        { $match: { is_approved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);

      console.log('✅ Average rating calculated:', averageRating[0]);
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      // Return empty data instead of failing
      ratings = [];
      averageRating = [];
    }

    const response = {
      success: true,
      data: ratings || [],
      stats: {
        averageRating: averageRating[0]?.avgRating || 0,
        totalRatings: averageRating[0]?.count || 0
      }
    };

    console.log('✅ Sending response:', JSON.stringify(response).substring(0, 100));
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Get public ratings error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Always send a valid JSON response
    try {
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          message: 'No ratings available',
          data: [],
          stats: {
            averageRating: 0,
            totalRatings: 0
          },
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    } catch (sendError) {
      console.error('❌ Failed to send error response:', sendError);
    }
  }
});

export default router;

