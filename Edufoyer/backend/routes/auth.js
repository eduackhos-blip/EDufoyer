import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticateToken, generateToken, requireAdmin } from '../middleware/auth.js';
import { validateEmail, normalizeEmail } from '../utils/emailValidator.js';
import { checkEmailWhitelist } from '../utils/emailWhitelist.js';
import { verifyEmail, sendVerificationEmail, generateVerificationCode } from '../utils/emailVerification.js';

const router = express.Router();

// Register new user
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ min: 5, max: 100 })
    .withMessage('Please provide a valid email address')
    .custom((value) => {
      // Additional validation to catch common invalid patterns
      if (!value || typeof value !== 'string') {
        throw new Error('Email is required');
      }
      
      const trimmedEmail = value.trim();
      
      // Check for basic structure
      if (!trimmedEmail.includes('@')) {
        throw new Error('Email must contain @ symbol');
      }
      
      if (trimmedEmail.startsWith('@') || trimmedEmail.endsWith('@')) {
        throw new Error('Invalid email format');
      }
      
      if (trimmedEmail.includes('..')) {
        throw new Error('Email cannot contain consecutive dots');
      }
      
      if (trimmedEmail.includes(' ')) {
        throw new Error('Email cannot contain spaces');
      }
      
      // Check for valid domain
      const parts = trimmedEmail.split('@');
      if (parts.length !== 2) {
        throw new Error('Invalid email format');
      }
      
      const [localPart, domainPart] = parts;
      
      if (!localPart || !domainPart) {
        throw new Error('Invalid email format');
      }
      
      if (!domainPart.includes('.')) {
        throw new Error('Domain must contain a dot');
      }
      
      // Check for valid TLD
      const tldRegex = /\.[a-zA-Z]{2,}$/;
      if (!tldRegex.test(domainPart)) {
        throw new Error('Invalid domain format');
      }
      
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Registration validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Comprehensive email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message
      });
    }

    // Check if email is in whitelist
    const whitelistCheck = checkEmailWhitelist(email);
    if (!whitelistCheck.isApproved) {
      return res.status(403).json({
        success: false,
        message: whitelistCheck.message
      });
    }

    // Verify email exists and is from known providers
    const emailVerification = await verifyEmail(email);
    if (!emailVerification.isValid) {
      return res.status(400).json({
        success: false,
        message: emailVerification.message
      });
    }

    // Normalize email
    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists (check both original and normalized email)
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { email: normalizedEmail }
      ]
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new user with normalized email (not verified yet)
    const user = new User({
      name,
      email: normalizedEmail,
      password,
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpiry: verificationExpiry
    });

    await user.save();

    // Emit socket event for new user registration (for real-time updates)
    if (normalizedEmail.toLowerCase().endsWith('@kiit.ac.in')) {
      setImmediate(async () => {
        try {
          const { getIO } = await import('../socket.js');
          const io = getIO();
          if (io) {
            io.emit('user:registered', {
              userId: String(user._id),
              email: user.email
            });
            console.log('📡 Emitted user:registered event for KIIT user');
          }
        } catch (emitErr) {
          console.error('Socket emit error (user:registered):', emitErr);
        }
      });
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(normalizedEmail, verificationCode);
    
    if (!emailResult.success) {
      // If email sending fails, delete the user
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please check if your email address is correct and try again.'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification code.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified
        },
        verificationRequired: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login user
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Comprehensive email validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message
      });
    }

    // Normalize email for lookup
    const normalizedEmail = normalizeEmail(email);

    // Find user by email (check both original and normalized)
    const user = await User.findOne({ 
      $or: [
        { email: email },
        { email: normalizedEmail }
      ]
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email before logging in. Check your email for verification code.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userPayload =
      req.user && typeof req.user.toJSON === 'function' ? req.user.toJSON() : req.user;
    res.json({
      success: true,
      data: {
        user: userPayload
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const updateData = {};
    const unsetData = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user._id } 
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken by another user'
        });
      }
      updateData.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'username')) {
      const raw = req.body.username;
      if (raw === null || raw === '') {
        unsetData.username = '';
      } else {
        const normalized = String(raw).replace(/^@/, '').trim().toLowerCase();
        if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
          return res.status(400).json({
            success: false,
            message: 'Username must be 3–30 characters (lowercase letters, numbers, underscore only)'
          });
        }
        const taken = await User.findOne({
          username: normalized,
          _id: { $ne: req.user._id }
        });
        if (taken) {
          return res.status(409).json({
            success: false,
            message: 'Username is already taken'
          });
        }
        updateData.username = normalized;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'avatarUrl')) {
      const raw = req.body.avatarUrl;
      if (raw === null || raw === '') {
        unsetData.avatarUrl = '';
      } else {
        const s = String(raw);
        if (s.length > 1100000) {
          return res.status(400).json({
            success: false,
            message: 'Avatar image is too large'
          });
        }
        const isDataImage = s.startsWith('data:image/');
        const isHttp = /^https?:\/\//i.test(s);
        if (!isDataImage && !isHttp) {
          return res.status(400).json({
            success: false,
            message: 'Avatar must be an http(s) URL or a data:image URL'
          });
        }
        updateData.avatarUrl = s;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'coverImageUrl')) {
      const raw = req.body.coverImageUrl;
      if (raw === null || raw === '') {
        unsetData.coverImageUrl = '';
      } else {
        const s = String(raw);
        if (s.length > 1100000) {
          return res.status(400).json({
            success: false,
            message: 'Cover image is too large'
          });
        }
        const isDataImage = s.startsWith('data:image/');
        const isHttp = /^https?:\/\//i.test(s);
        if (!isDataImage && !isHttp) {
          return res.status(400).json({
            success: false,
            message: 'Cover must be an http(s) URL or a data:image URL'
          });
        }
        updateData.coverImageUrl = s;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'bio')) {
      const raw = req.body.bio;
      if (raw === null || raw === '') {
        unsetData.bio = '';
      } else {
        const t = String(raw).trim();
        if (t.length > 280) {
          return res.status(400).json({
            success: false,
            message: 'Bio cannot exceed 280 characters'
          });
        }
        if (!t) {
          unsetData.bio = '';
        } else {
          updateData.bio = t;
        }
      }
    }

    const mongoUpdate = {};
    if (Object.keys(updateData).length) mongoUpdate.$set = updateData;
    if (Object.keys(unsetData).length) mongoUpdate.$unset = unsetData;

    const updatedUser = Object.keys(mongoUpdate).length
      ? await User.findByIdAndUpdate(req.user._id, mongoUpdate, {
          new: true,
          runValidators: true
        }).select('-password')
      : await User.findById(req.user._id).select('-password');

    const userPayload =
      updatedUser && typeof updatedUser.toJSON === 'function'
        ? updatedUser.toJSON()
        : updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userPayload
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// Change password (logged-in user)
router.post('/change-password', authenticateToken, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const match = await user.comparePassword(currentPassword);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    const safe = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      message: 'Password updated successfully',
      data: { user: safe }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Test email validation endpoint
router.post('/test-email', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  const emailValidation = validateEmail(email);
  const whitelistCheck = checkEmailWhitelist(email);
  
  res.json({
    success: emailValidation.isValid && whitelistCheck.isApproved,
    message: emailValidation.isValid ? whitelistCheck.message : emailValidation.message,
    email: email,
    isValid: emailValidation.isValid,
    isApproved: whitelistCheck.isApproved
  });
});

// Verify email with verification code
router.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.'
      });
    }

    if (new Date() > user.emailVerificationExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    if (user.emailVerificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiry = null;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpiry = verificationExpiry;
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);
    
    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during resend verification'
    });
  }
});

// Forgot password - request password reset
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    console.log('Forgot password request received:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    console.log('Processing forgot password for email:', email);

    // Find user by email
    const normalizedEmail = normalizeEmail(email);
    console.log('Normalized email:', normalizedEmail);
    
    const user = await User.findOne({ 
      $or: [
        { email: email },
        { email: normalizedEmail }
      ]
    });

    console.log('User found:', !!user);

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      console.log('User not found, returning success message');
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent to your email.'
      });
    }

    // Generate OTP for password reset
    console.log('Generating OTP for password reset...');
    const resetOTP = generateVerificationCode();
    const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log('OTP generated:', resetOTP, 'expiry:', resetExpiry);

    try {
      user.passwordResetToken = resetOTP;
      user.passwordResetExpiry = resetExpiry;
      await user.save();
      console.log('Password reset OTP saved successfully');
    } catch (saveError) {
      console.error('Error saving password reset OTP:', saveError);
      console.error('Save error details:', {
        message: saveError.message,
        stack: saveError.stack,
        name: saveError.name
      });
      throw new Error('Failed to save password reset OTP');
    }

    // Send OTP email
    console.log('Preparing to send OTP email...');
    
    try {
      const emailResult = await sendVerificationEmail(user.email, resetOTP);
      
      // Update email subject for password reset
      const { sendEmail } = await import('../utils/email.js');
      const customEmailResult = await sendEmail({
        to: user.email,
        subject: 'Password Reset OTP - NLS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested to reset your password. Please use the following OTP to reset your password:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #1f2937; margin: 0; font-size: 32px; letter-spacing: 4px;">${resetOTP}</h1>
            </div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>NLS Team</p>
          </div>
        `,
        text: `Password Reset Request\n\nHello ${user.name},\n\nYou requested to reset your password. Please use the following OTP to reset your password:\n\nOTP: ${resetOTP}\n\nThis OTP will expire in 10 minutes.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nNLS Team`
      });

      console.log('Email send result:', customEmailResult);

      if (!customEmailResult.success) {
        console.error('Email sending failed:', customEmailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP email. Please try again.'
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        stack: emailError.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    console.log('Password reset OTP sent successfully');
    res.json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent to your email.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    // Ensure we always return JSON
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Server error during password reset request',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } else {
      console.error('Response already sent, cannot send error response');
    }
  }
});

// Verify OTP for password reset
router.post('/verify-reset-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Find user by email
    const user = await User.findOne({ 
      $or: [
        { email: email },
        { email: normalizedEmail }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if OTP exists and is valid
    if (!user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No password reset request found. Please request a new OTP.'
      });
    }

    if (new Date() > user.passwordResetExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (user.passwordResetToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // OTP is valid, return success (password will be reset in next step)
    res.json({
      success: true,
      message: 'OTP verified successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification'
    });
  }
});

// Reset password with OTP
router.post('/reset-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otp, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Find user with valid reset OTP
    const user = await User.findOne({
      $or: [
        { email: email },
        { email: normalizedEmail }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify OTP
    if (!user.passwordResetToken || !user.passwordResetExpiry) {
      return res.status(400).json({
        success: false,
        message: 'No password reset request found. Please request a new OTP.'
      });
    }

    if (new Date() > user.passwordResetExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    if (user.passwordResetToken !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// Admin endpoints for whitelist management
import { 
  addToWhitelist, 
  removeFromWhitelist, 
  getApprovedEmails, 
  getApprovedDomains 
} from '../utils/emailWhitelist.js';

// Get approved emails (admin only)
router.get('/admin/whitelist', authenticateToken, (req, res) => {
  // Add admin check here if needed
  res.json({
    success: true,
    data: {
      approvedEmails: getApprovedEmails(),
      approvedDomains: getApprovedDomains()
    }
  });
});

// Add email to whitelist (admin only)
router.post('/admin/whitelist', authenticateToken, (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  const added = addToWhitelist(email);
  
  res.json({
    success: true,
    message: added ? 'Email added to whitelist' : 'Email already in whitelist',
    data: {
      email: email,
      added: added
    }
  });
});

// Remove email from whitelist (admin only)
router.delete('/admin/whitelist', authenticateToken, (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }
  
  const removed = removeFromWhitelist(email);
  
  res.json({
    success: true,
    message: removed ? 'Email removed from whitelist' : 'Email not found in whitelist',
    data: {
      email: email,
      removed: removed
    }
  });
});

// Admin onboard solver by email
router.post('/admin/onboard-solver', requireAdmin, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('specialities')
    .isArray({ min: 1 })
    .withMessage('At least one speciality is required'),
  body('specialities.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each speciality must be between 1 and 50 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, name, specialities, experience = 'beginner', bio = '' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: tempPassword,
      role: 'user',
      isSolver: true,
      isActive: true,
      emailVerified: true // Admin onboarded users are pre-verified
    });

    await user.save();

    // Create solver profile
    const Solver = (await import('../models/Solver.js')).default;
    const solver = new Solver({
      user_id: user._id,
      specialities,
      experience,
      bio
    });

    await solver.save();

    // Send onboarding email
    const { sendEmail } = await import('../utils/email.js');
    const onboardingEmailResult = await sendEmail({
      to: email,
      subject: 'Welcome to NLS - Solver Onboarding',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to NLS Solver Community!</h2>
          <p>Hello ${name},</p>
          <p>You have been onboarded as a solver for the following subjects: <strong>${specialities.join(', ')}</strong></p>
          <p>Your temporary login credentials:</p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Password:</strong> ${tempPassword}</li>
          </ul>
          <p><strong>Important:</strong> Please change your password after your first login for security.</p>
          <p>You can now start helping students with their doubts in your areas of expertise.</p>
          <p>Best regards,<br>NLS Admin Team</p>
        </div>
      `,
      text: `Welcome to NLS Solver Community!\n\nHello ${name},\n\nYou have been onboarded as a solver for: ${specialities.join(', ')}\n\nYour temporary login credentials:\nEmail: ${email}\nPassword: ${tempPassword}\n\nPlease change your password after first login.\n\nBest regards,\nNLS Admin Team`
    });

    if (!onboardingEmailResult.success) {
      console.error('Failed to send onboarding email:', onboardingEmailResult.error);
      // Don't fail the request, just log the error
    }

    res.status(201).json({
      success: true,
      message: 'Solver onboarded successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isSolver: user.isSolver
        },
        solver: {
          id: solver._id,
          specialities: solver.specialities,
          experience: solver.experience
        },
        emailSent: onboardingEmailResult.success
      }
    });

  } catch (error) {
    console.error('Solver onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during solver onboarding'
    });
  }
});

// Serve admin promotion page
router.get('/admin/promote', (req, res) => {
  res.sendFile('admin-promote.html', { root: '.' });
});

// Promote user to admin (for development/testing)
router.post('/admin/promote-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Promote user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user promotion'
    });
  }
});

export default router;
