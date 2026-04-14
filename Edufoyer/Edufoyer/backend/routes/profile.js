import express from 'express';
import { protect } from '../middleware/auth.js';
import { createProfile } from '../actions/profile/createProfile.js';
import { getProfile } from '../actions/profile/getProfile.js';
import cache from '../utils/cache.js';

const router = express.Router();

// @route   POST /api/profile/create
// @desc    Create user profile
// @access  Private
router.post('/create', protect, async (req, res) => {
  try {
    const result = await createProfile(req.body, req.user.id);
    
    if (result.success) {
      // Invalidate cache for this user's profile
      cache.delete(`profile:${req.user.id}`);
      res.status(201).json({ success: true, message: 'Profile created successfully' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const result = await getProfile(req.user.id);
    
    if (result.error) {
      res.status(404).json({ success: false, message: result.error });
    } else {
      res.status(200).json({ success: true, data: result });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
