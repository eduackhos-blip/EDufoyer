import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Wallet from '../models/Wallet.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import SolverDoubts from '../models/SolverDoubts.js';
import { recalculateAllCoins } from '../actions/wallet/creditCoins.js';

const router = express.Router();

/**
 * Check if solver is eligible for withdrawal
 * Requirements: 
 * - Must have completed at least 30 doubts (free trial period)
 * - Must have average rating of 3.5 or above
 */
async function checkWithdrawalEligibility(solverId) {
  try {
    // Count completed doubts
    const completedDoubts = await SolverDoubts.countDocuments({
      solver_id: solverId,
      resolution_status: 'session_completed',
      feedback_rating: { $exists: true, $ne: null }
    });

    // Get average rating
    const solvedDoubts = await SolverDoubts.find({
      solver_id: solverId,
      resolution_status: 'session_completed',
      feedback_rating: { $exists: true, $ne: null }
    }).select('feedback_rating');

    let averageRating = 0;
    if (solvedDoubts.length > 0) {
      const totalRating = solvedDoubts.reduce((sum, sd) => sum + (sd.feedback_rating || 0), 0);
      averageRating = totalRating / solvedDoubts.length;
      averageRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
    }

    const minDoubtsRequired = 30;
    const minRatingRequired = 3.5;
    
    const isEligible = completedDoubts >= minDoubtsRequired && averageRating >= minRatingRequired;

    return {
      isEligible,
      completedDoubts,
      averageRating,
      minDoubtsRequired,
      minRatingRequired,
      message: isEligible 
        ? 'You are eligible for withdrawal'
        : completedDoubts < minDoubtsRequired
          ? `Complete ${minDoubtsRequired - completedDoubts} more doubts to unlock withdrawal (Free trial period: ${completedDoubts}/${minDoubtsRequired})`
          : `Your average rating is ${averageRating.toFixed(1)}. You need at least ${minRatingRequired} stars to withdraw.`
    };
  } catch (error) {
    console.error('Error checking withdrawal eligibility:', error);
    return {
      isEligible: false,
      completedDoubts: 0,
      averageRating: 0,
      minDoubtsRequired: 30,
      minRatingRequired: 3.5,
      message: 'Error checking eligibility'
    };
  }
}

// @route   GET /api/wallet
// @desc    Get user's wallet balance and transactions
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user_id: req.user.id })
      .populate('transactions.doubt_id', 'subject category')
      .sort({ 'transactions.createdAt': -1 });

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = new Wallet({
        user_id: req.user.id,
        balance: 0,
        total_earned: 0,
        transactions: []
      });
      await wallet.save();
    }

    // Check withdrawal eligibility
    const eligibility = await checkWithdrawalEligibility(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        balance: wallet.balance,
        total_earned: wallet.total_earned,
        transactions: wallet.transactions,
        withdrawalEligibility: eligibility
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/wallet/balance
// @desc    Get only wallet balance
// @access  Private
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user_id: req.user.id });
    
    res.status(200).json({
      success: true,
      data: {
        balance: wallet?.balance || 0,
        total_earned: wallet?.total_earned || 0
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/wallet/recalculate
// @desc    Manually recalculate all coins based on current average rating
// @access  Private
router.post('/recalculate', authenticateToken, async (req, res) => {
  try {
    const result = await recalculateAllCoins(req.user.id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Coins recalculated successfully',
        data: {
          balance: result.balance,
          totalCoins: result.totalCoins,
          averageRating: result.averageRating
        }
      });
    } else {
      res.status(400).json({ success: false, message: result.error });
    }
  } catch (error) {
    console.error('Recalculate coins error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/wallet/withdraw
// @desc    Create a withdrawal request
// @access  Private
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount, upi_id, bank_account_number, bank_ifsc, bank_name, account_holder_name } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    if (!account_holder_name) {
      return res.status(400).json({ success: false, message: 'Account holder name is required' });
    }

    // Check if user has UPI ID or bank account details
    if (!upi_id && (!bank_account_number || !bank_ifsc || !bank_name)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide either UPI ID or complete bank account details' 
      });
    }

    // Get user's wallet
    const wallet = await Wallet.findOne({ user_id: req.user.id });
    if (!wallet) {
      return res.status(404).json({ success: false, message: 'Wallet not found' });
    }

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: ${wallet.balance} coins` 
      });
    }

    // Check withdrawal eligibility (30 doubts + 3.5 rating)
    const eligibility = await checkWithdrawalEligibility(req.user.id);
    if (!eligibility.isEligible) {
      return res.status(403).json({
        success: false,
        message: eligibility.message,
        eligibility: eligibility
      });
    }

    // Check for pending withdrawal requests
    const pendingRequest = await WithdrawalRequest.findOne({
      user_id: req.user.id,
      status: 'pending'
    });

    if (pendingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending withdrawal request. Please wait for approval.' 
      });
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      user_id: req.user.id,
      amount,
      upi_id: upi_id || null,
      bank_account_number: bank_account_number || null,
      bank_ifsc: bank_ifsc || null,
      bank_name: bank_name || null,
      account_holder_name,
      status: 'pending'
    });

    await withdrawalRequest.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawalRequest
    });
  } catch (error) {
    console.error('Create withdrawal request error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/wallet/withdrawals
// @desc    Get user's withdrawal requests
// @access  Private
router.get('/withdrawals', authenticateToken, async (req, res) => {
  try {
    const withdrawals = await WithdrawalRequest.find({ user_id: req.user.id })
      .sort({ createdAt: -1 })
      .populate('approved_by', 'name email');

    res.status(200).json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;

