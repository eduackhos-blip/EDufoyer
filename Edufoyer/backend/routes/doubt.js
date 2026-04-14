import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { submitFeedback } from '../actions/doubt/submitFeedback.js';
import { submitSolverRating } from '../actions/doubt/submitSolverRating.js';
import Doubt from '../models/Doubt.js';
import { createDoubt } from '../actions/doubt/createDoubt.js';
import { getDoubtById } from '../actions/doubt/getDoubtById.js';
import { getUserDoubts } from '../actions/doubt/getUserDoubts.js';

const router = express.Router();

// @route   POST /api/doubts/create
// @desc    Create a new doubt
// @access  Private
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const result = await createDoubt(req.body, req.user.id);
    
    if (result.success) {
      res.status(201).json({ success: true, data: result });
    } else {
      // Return error with validation details for subject mismatch
      const response = {
        success: false,
        error: result.error,
        message: result.message || result.error,
      };
      
      if (result.fieldErrors) {
        response.fieldErrors = result.fieldErrors;
      }
      
      if (result.validationDetails) {
        response.validationDetails = result.validationDetails;
      }
      
      if (result.quotaDetails) {
        response.quotaDetails = result.quotaDetails;
      }
      
      res.status(400).json(response);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doubts/by-id/:id
// @desc    Get a specific doubt by ID (details for session & roles)
// @access  Private
router.get('/by-id/:id', authenticateToken, async (req, res) => {
  try {
    const result = await getDoubtById(req.params.id);
    if (result.success) {
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/doubts/feedback
// @desc    Student submits feedback/rating after session
// @access  Private
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const result = await submitFeedback(req.body, req.user.id);
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.error, fieldErrors: result.fieldErrors });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/doubts/solver-rating
// @desc    Solver submits rating/feedback for asker after session
// @access  Private
router.post('/solver-rating', authenticateToken, async (req, res) => {
  try {
    const result = await submitSolverRating(req.body, req.user.id);
    if (result.success) {
      res.status(200).json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, message: result.error, fieldErrors: result.fieldErrors });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doubts/my-doubts
// @desc    Get all doubts asked by the logged-in user
// @access  Private
router.get('/my-doubts', authenticateToken, async (req, res) => {
  try {
    const result = await getUserDoubts(req.user.id);
    
    if (result.success) {
      res.status(200).json({ success: true, data: { doubts: result.doubts, pagination: { currentPage: 1, totalPages: 0, totalDoubts: result.doubts.length, hasNext: false, hasPrev: false } } });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doubts/all
// @desc    Get all doubts (for browsing/solving)
// @access  Private
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const doubts = await Doubt.find().populate('doubter_id', 'name email').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: doubts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/doubts/:id
// @desc    Get a single doubt by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await getDoubtById(req.params.id);
    
    if (result.success) {
      res.status(200).json({ success: true, data: result.doubt });
    } else {
      res.status(404).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;