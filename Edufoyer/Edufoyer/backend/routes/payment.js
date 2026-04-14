import express from 'express';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DoubtPackPurchase from '../models/DoubtPackPurchase.js';
import DoubtPack from '../models/DoubtPack.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import UniversityDoubtBalance from '../models/UniversityDoubtBalance.js';
import mongoose from 'mongoose';

const router = express.Router();

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Razorpay
let razorpay;
try {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_R7UFY2mbYmsWuL';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'AcF9r8g62oCaAWKAxRSAfxOQ';
  
  console.log('🔧 Initializing Razorpay...');
  console.log('🔑 Key ID:', keyId ? `${keyId.substring(0, 10)}...` : 'NOT SET');
  console.log('🔑 Key Secret:', keySecret ? 'SET' : 'NOT SET');
  
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
  
  console.log('✅ Razorpay initialized successfully');
  console.log('🔑 Razorpay Key ID:', razorpay.key_id);
  console.log('🔑 Razorpay instance type:', typeof razorpay);
} catch (razorpayInitError) {
  console.error('❌ Razorpay initialization failed:', razorpayInitError);
  console.error('❌ Init error details:', {
    name: razorpayInitError?.name,
    message: razorpayInitError?.message,
    stack: razorpayInitError?.stack
  });
  // Create a dummy object to prevent crashes, but routes will check for this
  razorpay = null;
}

// @route   GET /api/payment/test
// @desc    Test Razorpay initialization
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    razorpayInitialized: !!razorpay,
    razorpayKeyId: razorpay?.key_id || 'NOT SET',
    message: razorpay ? 'Razorpay is initialized' : 'Razorpay initialization failed'
  });
});

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order for doubt pack purchase
// @access  Public (but should be protected in production)
router.post('/create-order', async (req, res) => {
  try {
    console.log('💳 ============================================');
    console.log('💳 POST /api/payment/create-order - Request received');
    console.log('💳 Request body:', JSON.stringify(req.body, null, 2));
    console.log('💳 ============================================');

    const { amount, doubt_pack_id, university_name, university_email, university_id } = req.body;

    // Validate required fields
    if (!amount || !doubt_pack_id) {
      console.error('❌ Missing required fields:', { amount, doubt_pack_id });
      return res.status(400).json({
        success: false,
        message: 'Amount and doubt_pack_id are required'
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

    // Check if DoubtPack model exists
    if (!DoubtPack) {
      console.error('❌ DoubtPack model not found');
      return res.status(500).json({
        success: false,
        message: 'DoubtPack model not available',
        error: 'Model not loaded'
      });
    }

    console.log('💳 Verifying doubt pack:', doubt_pack_id);
    console.log('💳 Doubt pack ID type:', typeof doubt_pack_id);
    console.log('💳 Is valid ObjectId:', mongoose.Types.ObjectId.isValid(doubt_pack_id));

    // Verify doubt pack exists
    let doubtPack;
    try {
      // Check if doubt_pack_id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(doubt_pack_id)) {
        console.error('❌ Invalid ObjectId format:', doubt_pack_id);
        return res.status(400).json({
          success: false,
          message: 'Invalid doubt pack ID format',
          doubt_pack_id,
          hint: 'Doubt pack ID must be a valid MongoDB ObjectId'
        });
      }

      doubtPack = await DoubtPack.findById(doubt_pack_id);
      if (!doubtPack) {
        console.error('❌ Doubt pack not found in database:', doubt_pack_id);
        return res.status(404).json({
          success: false,
          message: 'Doubt pack not found',
          doubt_pack_id
        });
      }
      console.log('✅ Doubt pack found:', doubtPack.totalDoubts, 'doubts');
    } catch (dbError) {
      console.error('❌ Database error while finding doubt pack:', dbError);
      console.error('Error details:', {
        name: dbError.name,
        message: dbError.message,
        stack: dbError.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Database error while finding doubt pack',
        error: dbError.message,
        errorName: dbError.name
      });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    console.log('💳 Amount conversion:', { amount, amountInPaise });

    // Check if Razorpay is initialized
    if (!razorpay) {
      console.error('❌ Razorpay not initialized');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not initialized',
        error: 'Razorpay initialization failed'
      });
    }

    // Create Razorpay order
    // Receipt must be max 40 characters (Razorpay requirement)
    // Format: dp_{shortId}_{timestamp} where shortId is first 8 chars of ObjectId
    const shortPackId = doubt_pack_id.toString().substring(0, 8);
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `dp_${shortPackId}_${timestamp}`; // Max length: 3 + 8 + 1 + 8 = 20 chars
    
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt, // Max 40 characters required by Razorpay
      notes: {
        doubt_pack_id: doubt_pack_id.toString(),
        university_name: university_name || 'University',
        university_email: university_email || '',
        university_id: university_id || '',
        full_receipt: `doubt_pack_${doubt_pack_id}_${Date.now()}` // Full receipt in notes for reference
      }
    };

    console.log('💳 Creating Razorpay order with options:', options);

    let order;
    try {
      console.log('💳 Calling Razorpay API...');
      console.log('💳 Razorpay instance:', razorpay ? 'exists' : 'null');
      console.log('💳 Razorpay key_id:', razorpay?.key_id);
      
      order = await razorpay.orders.create(options);
      console.log('✅ Razorpay order created successfully:', order.id);
      console.log('✅ Order details:', JSON.stringify(order, null, 2));
    } catch (razorpayError) {
      console.error('❌ Razorpay API error:', razorpayError);
      console.error('❌ Error type:', typeof razorpayError);
      console.error('❌ Error name:', razorpayError?.name);
      console.error('❌ Error message:', razorpayError?.message);
      console.error('❌ Error stack:', razorpayError?.stack);
      console.error('❌ Full error object:', JSON.stringify(razorpayError, null, 2));
      
      // Handle Razorpay specific errors
      if (razorpayError?.error) {
        console.error('❌ Razorpay error details:', razorpayError.error);
      }
      
      // Extract error details
      const errorMessage = razorpayError?.message || razorpayError?.error?.description || 'Unknown Razorpay error';
      const errorCode = razorpayError?.error?.code || razorpayError?.statusCode || 'UNKNOWN';
      const errorDescription = razorpayError?.error?.description || razorpayError?.message || 'No description available';
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create Razorpay order',
        error: errorMessage,
        errorCode: errorCode,
        errorDescription: errorDescription,
        hint: 'Check Razorpay credentials, network connection, and ensure test keys are valid'
      });
    }

    console.log('✅ ============================================');
    console.log('✅ Successfully created order:', order.id);
    console.log('✅ ============================================');

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      key_id: razorpay.key_id
    });
  } catch (error) {
    console.error('❌ ============================================');
    console.error('❌ Create order error (outer catch):', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    console.error('❌ ============================================');
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/payment/verify-payment
// @desc    Verify Razorpay payment and record purchase
// @access  Public (but should be protected in production)
router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

    console.log('🔍 Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is missing'
      });
    }

    // Verify payment signature
    const crypto = await import('crypto');
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'AcF9r8g62oCaAWKAxRSAfxOQ';
    const generatedSignature = crypto.default
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('❌ Payment signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

    console.log('✅ Payment signature verified');

    // Extract order data
    const { doubt_pack_id, university_name, university_email, university_id, amount } = orderData;

    // Verify doubt pack exists
    const doubtPack = await DoubtPack.findById(doubt_pack_id);
    if (!doubtPack) {
      return res.status(404).json({
        success: false,
        message: 'Doubt pack not found'
      });
    }

    // Handle university_id - if it's not a valid ObjectId, set to null
    let userId = null;
    if (university_id && mongoose.Types.ObjectId.isValid(university_id)) {
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
    if (!userId && university_email) {
      try {
        const existingUser = await User.findOne({ email: university_email });
        if (existingUser) {
          userId = existingUser._id;
        }
      } catch (err) {
        console.log('Email lookup failed:', err.message);
      }
    }

    // Create purchase record
    const purchaseData = {
      university_name: university_name || 'University',
      university_email: university_email || '',
      doubt_pack_id,
      doubt_pack_details: {
        totalDoubts: doubtPack.totalDoubts,
        categories: doubtPack.categories
      },
      amount: parseFloat(amount),
      currency: 'INR',
      payment_status: 'completed',
      razorpay_order_id,
      razorpay_payment_id
    };

    // Only add university_id if it's valid
    if (userId) {
      purchaseData.university_id = userId;
    }

    const purchase = new DoubtPackPurchase(purchaseData);
    await purchase.save();

    console.log('✅ Purchase recorded successfully:', purchase._id);

    // Update university available doubts
    try {
      console.log('📦 Updating university available doubts...');
      
      // Find or create university doubt balance
      let universityBalance = await UniversityDoubtBalance.findOne({ 
        university_email: university_email.toLowerCase() 
      });

      if (!universityBalance) {
        // Create new balance record
        universityBalance = new UniversityDoubtBalance({
          university_id: userId,
          university_email: university_email.toLowerCase(),
          university_name: university_name || 'University',
          doubtBuckets: {
            small: 0,
            medium: 0,
            large: 0
          }
        });
      }

      // Add purchased doubts to buckets based on categories
      if (doubtPack.categories && Array.isArray(doubtPack.categories)) {
        doubtPack.categories.forEach(category => {
          const categoryName = category.name?.toLowerCase();
          const count = category.count || 0;
          
          if (categoryName === 'small' || categoryName === 's') {
            universityBalance.doubtBuckets.small = (universityBalance.doubtBuckets.small || 0) + count;
          } else if (categoryName === 'medium' || categoryName === 'm') {
            universityBalance.doubtBuckets.medium = (universityBalance.doubtBuckets.medium || 0) + count;
          } else if (categoryName === 'large' || categoryName === 'l') {
            universityBalance.doubtBuckets.large = (universityBalance.doubtBuckets.large || 0) + count;
          }
        });
      }

      // Update university_id if available
      if (userId && !universityBalance.university_id) {
        universityBalance.university_id = userId;
      }

      await universityBalance.save();
      
      console.log('✅ University doubts updated:', {
        email: university_email,
        small: universityBalance.doubtBuckets.small,
        medium: universityBalance.doubtBuckets.medium,
        large: universityBalance.doubtBuckets.large,
        total: universityBalance.totalAvailable
      });
    } catch (balanceError) {
      console.error('❌ Error updating university doubt balance:', balanceError);
      // Don't fail the purchase if balance update fails
    }

    // Create notification for admin
    try {
      const adminUsers = await User.find({ role: 'admin' }).select('_id');
      if (adminUsers.length > 0) {
        const notificationPromises = adminUsers.map(admin => 
          new Notification({
            user_id: admin._id,
            message_type: 'DOUBT_PACK_PURCHASED',
            content: `${university_name || 'University'} (${university_email || 'N/A'}) purchased a doubt pack worth ₹${amount}. Pack: ${doubtPack.totalDoubts} doubts. Payment ID: ${razorpay_payment_id}`
          }).save()
        );
        await Promise.all(notificationPromises);
      }
    } catch (notifError) {
      console.error('Error creating admin notifications:', notifError);
      // Don't fail the purchase if notification fails
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and purchase recorded successfully',
      data: purchase
    });
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

export default router;

