import express from 'express';
import mongoose from 'mongoose';
import { protect, requireAdmin } from '../middleware/auth.js';
import Solver from '../models/Solver.js';
import User from '../models/User.js';
import DoubtPack from '../models/DoubtPack.js';
import SolverRequest from '../models/SolverRequest.js';
import Notification from '../models/Notification.js';
import DoubtPackPurchase from '../models/DoubtPackPurchase.js';
import RatingFeedback from '../models/RatingFeedback.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Wallet from '../models/Wallet.js';
import { sendVerificationEmail } from '../utils/emailVerification.js';
import { generateVerificationCode } from '../utils/emailVerification.js';

const router = express.Router();

// In-memory OTP store for admin (in production, use Redis or database)
const adminOTPStore = new Map();
const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

// Custom middleware to check admin authentication (supports both JWT and admin flag)
// Must be defined before routes that use it
const checkAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Check for admin_authenticated flag in a custom header or allow if token starts with 'admin-token'
    if (token && token.startsWith('admin-token')) {
      // Admin authenticated via admin login
      req.user = { role: 'admin', _id: 'hardcoded-admin-id' };
      return next();
    }

    // Otherwise, use standard requireAdmin middleware
    return requireAdmin(req, res, next);
  } catch (error) {
    // If JWT fails, check if it's an admin token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token && token.startsWith('admin-token')) {
      req.user = { role: 'admin', _id: 'hardcoded-admin-id' };
      return next();
    }
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }
};

// @route   POST /api/admin/register-solver
// @desc    Register any user as a solver (admin function)
// @access  Private (Admin only)
router.post('/register-solver', requireAdmin, async (req, res) => {
  try {
    const { name, email, subjects, experience, bio } = req.body;

    // Validate required fields
    if (!name || !email || !subjects || subjects.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and at least one subject are required' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        name: name,
        email: email.toLowerCase(),
        password: 'temp_password_' + Date.now(), // Temporary password
        isEmailVerified: false,
        isSolver: false
      });
      await user.save();
    }

    // Check if user is already a solver
    const existingSolver = await Solver.findOne({ user_id: user._id });
    if (existingSolver) {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already registered as a solver' 
      });
    }

    // Create new solver
    const newSolver = new Solver({
      user_id: user._id,
      specialities: subjects.map(s => s.toLowerCase()),
      experience: experience || 'beginner',
      bio: bio || '',
      isActive: true
    });

    await newSolver.save();

    // Update user profile with solver info
    await User.findByIdAndUpdate(user._id, {
      name: name,
      isSolver: true
    });

    res.status(201).json({
      success: true,
      message: `Successfully registered ${email} as a solver`,
      data: {
        userId: user._id,
        solverId: newSolver._id,
        email: email,
        specialities: newSolver.specialities
      }
    });
  } catch (error) {
    console.error('Admin register solver error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration', 
      error: error.message 
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin function) with pagination
// @access  Private (Admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, isSolver, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query object
    const query = {};
    if (role) query.role = role;
    if (isSolver !== undefined) query.isSolver = isSolver === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email isSolver role isActive createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/admin/solvers
// @desc    Get all solvers (admin function) with pagination
// @access  Private (Admin only)
router.get('/solvers', checkAdminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query object
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const [solvers, total] = await Promise.all([
      Solver.find(query)
        .select('specialities experience bio total_doubts_solved rating isActive createdAt')
        .populate('user_id', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Solver.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: solvers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSolvers: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get solvers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/admin/send-otp
// @desc    Send OTP to admin email
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate credentials
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if credentials match admin
    const ADMIN_EMAIL = 'eduackhos@gmail.com';
    const ADMIN_PASSWORD = '123456';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Generate OTP
    const otp = generateVerificationCode();
    const expiryTime = Date.now() + OTP_EXPIRY_TIME;

    // Store OTP with expiry
    adminOTPStore.set(email, {
      otp,
      expiry: expiryTime,
      attempts: 0
    });

    // Send OTP email
    const emailResult = await sendVerificationEmail(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP send',
      error: error.message
    });
  }
});

// @route   POST /api/admin/verify-otp
// @desc    Verify OTP for admin login
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedData = adminOTPStore.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiry) {
      adminOTPStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if too many attempts
    if (storedData.attempts >= 5) {
      adminOTPStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP verified successfully - remove from store
    adminOTPStore.delete(email);

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: error.message
    });
  }
});

// @route   POST /api/admin/university/send-otp
// @desc    Send OTP to university admin email
// @access  Public
router.post('/university/send-otp', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📧 University admin OTP request:', { email });

    // Validate credentials
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if credentials match university admin
    // Using KIIT admin credentials from config
    const UNIVERSITY_ADMIN_EMAIL = '2105834@kiit.ac.in';
    const UNIVERSITY_ADMIN_PASSWORD = '123456';

    if (email !== UNIVERSITY_ADMIN_EMAIL || password !== UNIVERSITY_ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid university admin credentials'
      });
    }

    // Generate OTP
    const otp = generateVerificationCode();
    const expiryTime = Date.now() + OTP_EXPIRY_TIME;

    // Store OTP with expiry (using email as key)
    adminOTPStore.set(email, {
      otp,
      expiry: expiryTime,
      attempts: 0
    });

    console.log('✅ OTP generated for university admin:', email);

    // Send OTP email
    const emailResult = await sendVerificationEmail(email, otp);
    
    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    console.log('✅ OTP sent successfully to:', email);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email'
    });

  } catch (error) {
    console.error('❌ University admin send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP send',
      error: error.message
    });
  }
});

// @route   POST /api/admin/university/verify-otp
// @desc    Verify OTP for university admin login
// @access  Public
router.post('/university/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log('🔍 University admin OTP verification:', { email });

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedData = adminOTPStore.get(email);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new OTP.'
      });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiry) {
      adminOTPStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if too many attempts
    if (storedData.attempts >= 5) {
      adminOTPStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP verified successfully - remove from store
    adminOTPStore.delete(email);

    console.log('✅ University admin OTP verified successfully:', email);

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('❌ University admin verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: error.message
    });
  }
});

// @route   POST /api/admin/doubt-packs
// @desc    Create a new doubt pack
// @access  Private (Admin only)
router.post('/doubt-packs', checkAdminAuth, async (req, res) => {
  try {
    const { totalDoubts, categories } = req.body;

    // Validate required fields
    if (!totalDoubts || !categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Total doubts and categories are required'
      });
    }

    // Validate total doubts
    if (totalDoubts <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total doubts must be greater than zero'
      });
    }

    // Validate categories
    const categoryTotal = categories.reduce((sum, cat) => sum + (cat.count || 0), 0);
    if (categoryTotal !== totalDoubts) {
      return res.status(400).json({
        success: false,
        message: 'Category counts must add up to the total number of doubts'
      });
    }

    // Get admin user ID if available
    let createdBy = null;
    if (req.user && req.user._id && req.user._id !== 'hardcoded-admin-id') {
      createdBy = req.user._id;
    }

    // Create new doubt pack
    const newDoubtPack = new DoubtPack({
      totalDoubts,
      categories: categories.map(cat => ({
        name: cat.name.trim(),
        count: cat.count
      })),
      createdBy,
      isActive: true
    });

    await newDoubtPack.save();

    res.status(201).json({
      success: true,
      message: 'Doubt pack created successfully',
      data: newDoubtPack
    });

  } catch (error) {
    console.error('Create doubt pack error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during doubt pack creation',
      error: error.message
    });
  }
});

// @route   GET /api/admin/doubt-packs
// @desc    Get all doubt packs (public endpoint for university admin)
// @access  Public (for university admin purchases)
router.get('/doubt-packs', async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const doubtPacks = await DoubtPack.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .limit(100);

    res.status(200).json({
      success: true,
      data: doubtPacks
    });

  } catch (error) {
    console.error('Get doubt packs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during doubt packs fetch',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/doubt-packs/:id
// @desc    Delete a doubt pack
// @access  Private (Admin only)
router.delete('/doubt-packs/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const doubtPack = await DoubtPack.findById(id);
    if (!doubtPack) {
      return res.status(404).json({
        success: false,
        message: 'Doubt pack not found'
      });
    }

    await DoubtPack.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Doubt pack deleted successfully'
    });

  } catch (error) {
    console.error('Delete doubt pack error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during doubt pack deletion',
      error: error.message
    });
  }
});

// @route   GET /api/admin/solver-requests
// @desc    Get all solver requests
// @access  Private (Admin only)
router.get('/solver-requests', checkAdminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const requests = await SolverRequest.find(query)
      .populate('user_id', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get solver requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/solver-requests/:id/approve
// @desc    Approve a solver request
// @access  Private (Admin only)
router.post('/solver-requests/:id/approve', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const request = await SolverRequest.findById(id).populate('user_id');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solver request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // Check if user is already a solver
    const existingSolver = await Solver.findOne({ user_id: request.user_id._id });
    if (existingSolver) {
      request.status = 'approved';
      request.admin_notes = admin_notes || 'User already registered as solver';
      await request.save();
      return res.status(200).json({
        success: true,
        message: 'User is already a solver',
        data: request
      });
    }

    // Create solver profile
    const newSolver = new Solver({
      user_id: request.user_id._id,
      specialities: request.subjects.map(s => s.toLowerCase()),
      experience: 'beginner',
      bio: '',
      isActive: true
    });

    await newSolver.save();

    // Update user profile
    await User.findByIdAndUpdate(request.user_id._id, {
      name: request.name,
      email: request.email,
      isSolver: true
    });

    // Update request status
    request.status = 'approved';
    request.admin_notes = admin_notes || '';
    await request.save();

    // Create notification for user
    const userNotification = new Notification({
      user_id: request.user_id._id,
      message_type: 'SOLUTION_ACCEPTED',
      content: `Your solver request has been approved! You can now start solving doubts in: ${request.subjects.join(', ')}`
    });
    await userNotification.save();

    res.status(200).json({
      success: true,
      message: 'Solver request approved successfully',
      data: {
        request,
        solver: newSolver
      }
    });
  } catch (error) {
    console.error('Approve solver request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/solver-requests/:id/reject
// @desc    Reject a solver request
// @access  Private (Admin only)
router.post('/solver-requests/:id/reject', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const request = await SolverRequest.findById(id).populate('user_id');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Solver request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // Update request status
    request.status = 'rejected';
    request.admin_notes = admin_notes || 'Request rejected by admin';
    await request.save();

    // Create notification for user
    const userNotification = new Notification({
      user_id: request.user_id._id,
      message_type: 'DOUBT_REJECTED',
      content: `Your solver request has been rejected. ${admin_notes || 'Please contact admin for more information.'}`
    });
    await userNotification.save();

    res.status(200).json({
      success: true,
      message: 'Solver request rejected',
      data: request
    });
  } catch (error) {
    console.error('Reject solver request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/notifications
// @desc    Get admin notifications (only SOLVER_REQUEST type)
// @access  Private (Admin only)
router.get('/notifications', checkAdminAuth, async (req, res) => {
  try {
    // Handle both hardcoded admin and regular admin
    let adminUserId = req.user._id || req.user.id;
    
    // For hardcoded admin, get all admin users and fetch their notifications
    if (req.user._id === 'hardcoded-admin-id') {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      const adminIds = adminUsers.map(u => u._id);
      // Only fetch SOLVER_REQUEST notifications
      const notifications = await Notification.find({ 
        user_id: { $in: adminIds },
        message_type: 'SOLVER_REQUEST'
      })
        .sort({ createdAt: -1 })
        .limit(50);
      return res.status(200).json({
        success: true,
        data: notifications
      });
    }

    // Only fetch SOLVER_REQUEST notifications
    const notifications = await Notification.find({ 
      user_id: adminUserId,
      message_type: 'SOLVER_REQUEST'
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (Admin only)
router.post('/notifications/:id/read', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.is_read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/doubt-pack-purchases
// @desc    Get all doubt pack purchases
// @access  Private (Admin only)
router.get('/doubt-pack-purchases', checkAdminAuth, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const purchases = await DoubtPackPurchase.find({})
      .populate('doubt_pack_id', 'totalDoubts categories')
      .populate('university_id', 'name email')
      .sort({ purchase_date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await DoubtPackPurchase.countDocuments({});

    res.status(200).json({
      success: true,
      data: purchases,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('Get doubt pack purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/doubt-pack-purchases
// @desc    Record a doubt pack purchase (called from university admin)
// @access  Private (University Admin)
router.post('/doubt-pack-purchases', async (req, res) => {
  try {
    const { university_id, university_name, university_email, doubt_pack_id, doubt_pack_details, amount } = req.body;

    console.log('Purchase request received:', { university_id, university_name, university_email, doubt_pack_id, amount });

    // Validate required fields
    if (!university_name || !university_email || !doubt_pack_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        received: { university_id, university_name, university_email, doubt_pack_id, amount }
      });
    }

    // Verify doubt pack exists
    const doubtPack = await DoubtPack.findById(doubt_pack_id);
    if (!doubtPack) {
      return res.status(404).json({
        success: false,
        message: 'Doubt pack not found',
        doubt_pack_id
      });
    }

    // Handle university_id - if it's not a valid ObjectId, set to null
    let userId = null;
    if (university_id && mongoose.Types.ObjectId.isValid(university_id)) {
      // Verify user exists
      try {
        const userExists = await User.findById(university_id);
        if (userExists) {
          userId = university_id;
        }
      } catch (err) {
        console.log('User lookup failed:', err.message);
      }
    }
    
    // If no valid userId, try to find by email
    if (!userId) {
      try {
        const existingUser = await User.findOne({ email: university_email });
        if (existingUser) {
          userId = existingUser._id;
        }
      } catch (err) {
        console.log('Email lookup failed:', err.message);
      }
    }
    
    // If still no userId, we'll save purchase without university_id (it's optional now)
    // This allows purchases even if university user doesn't exist in our system

    // Create purchase record
    const purchaseData = {
      university_name,
      university_email,
      doubt_pack_id,
      doubt_pack_details: doubt_pack_details || {
        totalDoubts: doubtPack.totalDoubts,
        categories: doubtPack.categories
      },
      amount: parseFloat(amount),
      payment_status: 'completed'
    };

    // Only add university_id if it's valid
    if (userId) {
      purchaseData.university_id = userId;
    }

    const purchase = new DoubtPackPurchase(purchaseData);

    try {
      await purchase.save();
      console.log('Purchase saved successfully:', purchase._id);
    } catch (saveError) {
      console.error('Error saving purchase:', saveError);
      throw saveError;
    }

    // Create notification for admin
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      if (adminUsers.length > 0) {
        const notificationPromises = adminUsers.map(admin => 
          new Notification({
            user_id: admin._id,
            message_type: 'DOUBT_PACK_PURCHASED',
            content: `${university_name} (${university_email}) purchased a doubt pack worth ₹${amount}. Pack: ${doubtPack.totalDoubts} doubts`
          }).save()
        );
        await Promise.all(notificationPromises);
      }
    } catch (notifError) {
      console.error('Error creating admin notifications:', notifError);
      // Don't fail the purchase if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Purchase recorded successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Record purchase error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Return detailed error for debugging
    res.status(500).json({
      success: false,
      message: 'Server error while recording purchase',
      error: error.message,
      errorName: error.name,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// @route   GET /api/admin/ratings-feedback
// @desc    Get all ratings and feedback
// @access  Private (Admin only)
router.get('/ratings-feedback', checkAdminAuth, async (req, res) => {
  try {
    console.log('📊 GET /api/admin/ratings-feedback - Request received');
    console.log('📊 Query params:', req.query);
    
    const { approved, featured, limit = 100, skip = 0 } = req.query;
    
    // Build query object
    const query = {};
    if (approved !== undefined && approved !== '') {
      query.is_approved = approved === 'true' || approved === true;
    }
    if (featured !== undefined && featured !== '') {
      query.is_featured = featured === 'true' || featured === true;
    }

    console.log('📊 MongoDB query:', JSON.stringify(query));

    // Check if RatingFeedback model exists
    if (!RatingFeedback) {
      console.error('❌ RatingFeedback model not found');
      return res.status(500).json({
        success: false,
        message: 'RatingFeedback model not available',
        error: 'Model not loaded'
      });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. State:', mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable',
        error: 'MongoDB not connected'
      });
    }

    const ratings = await RatingFeedback.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    console.log('✅ Found ratings:', ratings.length);

    // Count all ratings (for stats)
    const total = await RatingFeedback.countDocuments({});
    const approvedCount = await RatingFeedback.countDocuments({ is_approved: true });
    const featuredCount = await RatingFeedback.countDocuments({ is_featured: true });
    const pendingCount = await RatingFeedback.countDocuments({ is_approved: false });
    
    console.log('📊 Stats:', { total, approvedCount, featuredCount, pendingCount });
    
    let averageRating = [];
    try {
      averageRating = await RatingFeedback.aggregate([
        { $match: { is_approved: true } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]);
    } catch (aggError) {
      console.error('Error calculating average rating:', aggError);
      averageRating = [];
    }

    const response = {
      success: true,
      data: ratings,
      stats: {
        total,
        approved: approvedCount,
        featured: featuredCount,
        averageRating: averageRating[0]?.avgRating || 0
      },
      limit: parseInt(limit),
      skip: parseInt(skip)
    };

    console.log('✅ Sending response with', ratings.length, 'ratings');
    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Get ratings feedback error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/ratings-feedback/:id/approve
// @desc    Approve a rating/feedback
// @access  Private (Admin only)
router.post('/ratings-feedback/:id/approve', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const rating = await RatingFeedback.findById(id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    rating.is_approved = true;
    if (featured !== undefined) {
      rating.is_featured = featured;
    }
    await rating.save();

    res.status(200).json({
      success: true,
      message: 'Rating approved successfully',
      data: rating
    });
  } catch (error) {
    console.error('Approve rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/ratings-feedback/:id
// @desc    Delete a rating/feedback
// @access  Private (Admin only)
router.delete('/ratings-feedback/:id', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const rating = await RatingFeedback.findById(id);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    await RatingFeedback.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/withdrawals
// @desc    Get all withdrawal requests
// @access  Admin
router.get('/withdrawals', checkAdminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const withdrawals = await WithdrawalRequest.find(query)
      .populate('user_id', 'name email')
      .populate('approved_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/withdrawals/:id/approve
// @desc    Approve a withdrawal request
// @access  Admin
router.post('/withdrawals/:id/approve', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id).populate('user_id');
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal request is already ${withdrawal.status}`
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user_id: withdrawal.user_id._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check if user still has sufficient balance
    if (wallet.balance < withdrawal.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${wallet.balance} coins`
      });
    }

    // Update withdrawal status
    withdrawal.status = 'approved';
    // Only set approved_by if it's a valid ObjectId
    const adminId = req.user._id || req.user.id;
    if (adminId && adminId !== 'hardcoded-admin-id' && mongoose.Types.ObjectId.isValid(adminId)) {
      withdrawal.approved_by = new mongoose.Types.ObjectId(adminId);
    }
    // If adminId is invalid, leave approved_by as undefined (optional field)
    if (admin_notes) {
      withdrawal.admin_notes = admin_notes;
    }
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal request approved',
      data: withdrawal
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/withdrawals/:id/disburse
// @desc    Disburse payment for approved withdrawal
// @access  Admin
router.post('/withdrawals/:id/disburse', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id).populate('user_id');
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal request must be approved before disbursement. Current status: ${withdrawal.status}`
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user_id: withdrawal.user_id._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    // Check if user still has sufficient balance
    if (wallet.balance < withdrawal.amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ${wallet.balance} coins`
      });
    }

    // Deduct amount from wallet
    wallet.balance -= withdrawal.amount;
    await wallet.save();

    // Update withdrawal status
    withdrawal.status = 'disbursed';
    withdrawal.disbursed_at = new Date();
    if (admin_notes) {
      withdrawal.admin_notes = admin_notes;
    }
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: 'Payment disbursed successfully',
      data: withdrawal
    });
  } catch (error) {
    console.error('Disburse withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/withdrawals/:id/reject
// @desc    Reject a withdrawal request
// @access  Admin
router.post('/withdrawals/:id/reject', checkAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const withdrawal = await WithdrawalRequest.findById(id);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal request is already ${withdrawal.status}`
      });
    }

    // Update withdrawal status
    withdrawal.status = 'rejected';
    // Only set approved_by if it's a valid ObjectId
    const adminId = req.user._id || req.user.id;
    if (adminId && adminId !== 'hardcoded-admin-id' && mongoose.Types.ObjectId.isValid(adminId)) {
      withdrawal.approved_by = new mongoose.Types.ObjectId(adminId);
    }
    // If adminId is invalid, leave approved_by as undefined (optional field)
    if (admin_notes) {
      withdrawal.admin_notes = admin_notes;
    }
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal request rejected',
      data: withdrawal
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
