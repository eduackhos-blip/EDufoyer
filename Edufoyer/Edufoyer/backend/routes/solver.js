import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { acceptDoubtAssignment } from '../actions/solver/acceptDoubtAssignment.js';
import { completeDoubt } from '../actions/solver/completeDoubt.js';
import { getSolvedDoubts } from '../actions/solver/getSolvedDoubts.js';
import SolverDoubts from '../models/SolverDoubts.js';
import SolverRequest from '../models/SolverRequest.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import Doubt from '../models/Doubt.js';
import Solver from '../models/Solver.js';
import cache from '../utils/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/solver-requests');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  }
});

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Solver routes are working' });
});

// @route   POST /api/solver/accept-doubt
// @desc    Accept a doubt assignment
// @access  Private
router.post('/accept-doubt', protect, async (req, res) => {
  try {
    const result = await acceptDoubtAssignment(req.body, req.user.id);

    // Defensive: handle unexpected undefined/null results
    if (!result || typeof result !== 'object') {
      console.error('acceptDoubtAssignment returned invalid result:', result);
      return res.status(500).json({ success: false, message: 'Unexpected server response while accepting doubt' });
    }

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

// @route   GET /api/solver/assigned-doubts
// @desc    Get all doubts assigned to the current solver
// @access  Private
router.get('/assigned-doubts', protect, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    const baseCondition = { solver_id: req.user.id };
    const statusCondition = status !== 'all' ? { resolution_status: status } : null;
    const combinedCondition = statusCondition ? { ...baseCondition, ...statusCondition } : baseCondition;

    // Add pagination for scalability
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const solverObjectId = new mongoose.Types.ObjectId(req.user.id);
    
    const results = await Doubt.aggregate([
      {
        $lookup: {
          from: 'solverdoubts',
          localField: '_id',
          foreignField: 'doubt_id',
          as: 'solverDoubt'
        }
      },
      {
        $match: {
          'solverDoubt.solver_id': solverObjectId,
          ...(status !== 'all' ? { 'solverDoubt.resolution_status': status } : {})
        }
      },
      {
        $sort: { 'solverDoubt.assigned_at': -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    // Get total count for pagination
    const totalResults = await Doubt.aggregate([
      {
        $lookup: {
          from: 'solverdoubts',
          localField: '_id',
          foreignField: 'doubt_id',
          as: 'solverDoubt'
        }
      },
      {
        $match: {
          'solverDoubt.solver_id': solverObjectId,
          ...(status !== 'all' ? { 'solverDoubt.resolution_status': status } : {})
        }
      },
      {
        $count: 'total'
      }
    ]);
    
    const total = totalResults[0]?.total || 0;

    res.status(200).json({ 
      success: true, 
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDoubts: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/solver/available-doubts
// @desc    Get available doubts for the current solver
// @access  Private
router.get('/available-doubts', protect, async (req, res) => {
  try {
    // Check cache first for solver info
    const cacheKey = `solver:${req.user.id}`;
    let solverInfo = cache.get(cacheKey);
    
    if (!solverInfo) {
      // Get solver's specialities
      solverInfo = await Solver.findOne({ user_id: req.user.id })
        .select('specialities')
        .lean(); // Use lean() for better performance
      
      // Cache for 15 minutes
      if (solverInfo) {
        cache.set(cacheKey, solverInfo, 15 * 60 * 1000);
      }
    }

    if (!solverInfo || !solverInfo.specialities || solverInfo.specialities.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const specialities = solverInfo.specialities.map(s => s.toLowerCase());

    // Add pagination and limit for scalability
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const availableDoubts = await Doubt.find({
      status: 'open',
      subject: { $in: specialities }
    })
      .select('_id subject description image createdAt is_scheduled scheduled_date scheduled_time')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance
    
    const total = await Doubt.countDocuments({
      status: 'open',
      subject: { $in: specialities }
    });

    res.status(200).json({ 
      success: true, 
      data: availableDoubts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDoubts: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/solver/register
// @desc    Register as a solver
// @access  Private
router.post('/register', protect, async (req, res) => {
  try {
    const { name, email, subjects, experience, bio } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !email || !subjects || subjects.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and at least one subject are required' 
      });
    }

    // Check if solver already exists
    const existingSolver = await Solver.findOne({ user_id: userId });
    if (existingSolver) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already registered as a solver' 
      });
    }

    // Create new solver
    const newSolver = new Solver({
      user_id: userId,
      specialities: subjects.map(s => s.toLowerCase()),
      experience: experience || 'beginner',
      bio: bio || '',
      isActive: true
    });

    await newSolver.save();

    // Update user profile with solver info
    const User = (await import('../models/User.js')).default;
    await User.findByIdAndUpdate(userId, {
      name: name,
      email: email,
      isSolver: true
    });

    // Invalidate solver cache
    cache.delete(`solver:${userId}`);

    res.status(201).json({
      success: true,
      message: 'Successfully registered as solver',
      data: {
        solverId: newSolver._id,
        specialities: newSolver.specialities
      }
    });
  } catch (error) {
    console.error('Solver registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
});

// @route   POST /api/solver/complete-doubt
// @desc    Mark a doubt as completed by the solver
// @access  Private
router.post('/complete-doubt', protect, async (req, res) => {
  try {
    const result = await completeDoubt(req.body, req.user.id);
    
    if (result.success) {
      res.status(200).json({ success: true, message: result.message, data: result.data });
    } else {
      res.status(400).json({ success: false, message: result.error, fieldErrors: result.fieldErrors });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/solver/solved-doubts
// @desc    Get all solved doubts by the current solver
// @access  Private
router.get('/solved-doubts', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getSolvedDoubts({ page: parseInt(page), limit: parseInt(limit) }, req.user.id);
    
    if (result.success) {
      res.status(200).json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, message: result.error, fieldErrors: result.fieldErrors });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/solver/metrics
// @desc    Get solver performance metrics (current month count and average rating)
// @access  Private
router.get('/metrics', protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const solverObjectId = new mongoose.Types.ObjectId(req.user.id);

    const pipeline = [
      { $match: { solver_id: solverObjectId, resolution_status: 'session_completed', resolved_at: { $gte: startOfMonth } } },
      {
        $group: {
          _id: null,
          solvedCount: { $sum: 1 },
          avgRating: { $avg: '$feedback_rating' }
        }
      }
    ];

    const results = await SolverDoubts.aggregate(pipeline);
    const metrics = results[0] || { solvedCount: 0, avgRating: null };

    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    console.error('Solver metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/solver/request
// @desc    Submit a request to become a solver
// @access  Private
router.post('/request', protect, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'pancard', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, phoneNumber, subjects } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !email || !phoneNumber || !subjects) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, phone number, and subjects are required' 
      });
    }

    // Parse subjects if it's a string
    let subjectsArray;
    try {
      subjectsArray = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
    } catch (e) {
      subjectsArray = Array.isArray(subjects) ? subjects : [];
    }

    if (!Array.isArray(subjectsArray) || subjectsArray.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one subject is required' 
      });
    }

    // Check if user is already a solver
    const existingSolver = await Solver.findOne({ user_id: userId });
    if (existingSolver) {
      // Delete uploaded files if user is already a solver
      if (req.files?.resume?.[0]) {
        fs.unlinkSync(req.files.resume[0].path);
      }
      if (req.files?.marksheet?.[0]) {
        fs.unlinkSync(req.files.marksheet[0].path);
      }
      if (req.files?.aadhar?.[0]) {
        fs.unlinkSync(req.files.aadhar[0].path);
      }
      if (req.files?.pancard?.[0]) {
        fs.unlinkSync(req.files.pancard[0].path);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'You are already registered as a solver' 
      });
    }

    // Check if there's already a pending request
    const existingRequest = await SolverRequest.findOne({ 
      user_id: userId, 
      status: 'pending' 
    });
    if (existingRequest) {
      // Delete uploaded files if request already exists
      if (req.files?.resume?.[0]) {
        fs.unlinkSync(req.files.resume[0].path);
      }
      if (req.files?.marksheet?.[0]) {
        fs.unlinkSync(req.files.marksheet[0].path);
      }
      if (req.files?.aadhar?.[0]) {
        fs.unlinkSync(req.files.aadhar[0].path);
      }
      if (req.files?.pancard?.[0]) {
        fs.unlinkSync(req.files.pancard[0].path);
      }
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending solver request. Please wait for admin approval.' 
      });
    }

    // Validate files
    if (!req.files?.resume?.[0]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Resume file is required' 
      });
    }
    if (!req.files?.marksheet?.[0]) {
      // Delete resume if marksheet is missing
      if (req.files?.resume?.[0]) fs.unlinkSync(req.files.resume[0].path);
      return res.status(400).json({ 
        success: false, 
        message: 'Marksheet file is required' 
      });
    }
    if (!req.files?.aadhar?.[0]) {
      // Delete uploaded files if aadhar is missing
      if (req.files?.resume?.[0]) fs.unlinkSync(req.files.resume[0].path);
      if (req.files?.marksheet?.[0]) fs.unlinkSync(req.files.marksheet[0].path);
      return res.status(400).json({ 
        success: false, 
        message: 'Aadhar card file is required' 
      });
    }
    if (!req.files?.pancard?.[0]) {
      // Delete uploaded files if pancard is missing
      if (req.files?.resume?.[0]) fs.unlinkSync(req.files.resume[0].path);
      if (req.files?.marksheet?.[0]) fs.unlinkSync(req.files.marksheet[0].path);
      if (req.files?.aadhar?.[0]) fs.unlinkSync(req.files.aadhar[0].path);
      return res.status(400).json({ 
        success: false, 
        message: 'Pancard file is required' 
      });
    }

    // Extract relative paths for resume and marksheet
    const getRelativePath = (fullPath) => {
      if (!fullPath) return '';
      // Normalize path separators
      const normalized = fullPath.replace(/\\/g, '/');
      // Extract part after 'uploads/'
      if (normalized.includes('uploads/')) {
        return normalized.split('uploads/')[1];
      }
      // If it's already relative, return as is
      if (!normalized.match(/^[A-Z]:/i)) {
        return normalized;
      }
      // Fallback: return filename only
      return normalized.split('/').pop();
    };

    // Create new solver request
    const newRequest = new SolverRequest({
      user_id: userId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      subjects: subjectsArray.map(s => s.trim()),
      resume: getRelativePath(req.files.resume[0].path),
      marksheet: getRelativePath(req.files.marksheet[0].path),
      aadhar: getRelativePath(req.files.aadhar[0].path),
      pancard: getRelativePath(req.files.pancard[0].path),
      status: 'pending'
    });

    await newRequest.save();

    // Create notification for all admin users
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      const notificationPromises = adminUsers.map(admin => 
        new Notification({
          user_id: admin._id,
          message_type: 'SOLVER_REQUEST',
          content: `New solver request from ${name} (${email}). Subjects: ${subjectsArray.join(', ')}`
        }).save()
      );
      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Error creating admin notifications:', notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Solver request submitted successfully! Admin will review your request and get back to you soon.',
      data: {
        requestId: newRequest._id,
        status: newRequest.status
      }
    });
  } catch (error) {
    console.error('Solver request error:', error);
    
    // Clean up uploaded files on error
    if (req.files?.resume?.[0] && fs.existsSync(req.files.resume[0].path)) {
      fs.unlinkSync(req.files.resume[0].path);
    }
    if (req.files?.marksheet?.[0] && fs.existsSync(req.files.marksheet[0].path)) {
      fs.unlinkSync(req.files.marksheet[0].path);
    }
    if (req.files?.aadhar?.[0] && fs.existsSync(req.files.aadhar[0].path)) {
      fs.unlinkSync(req.files.aadhar[0].path);
    }
    if (req.files?.pancard?.[0] && fs.existsSync(req.files.pancard[0].path)) {
      fs.unlinkSync(req.files.pancard[0].path);
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error during request submission', 
      error: error.message 
    });
  }
});

export default router;
