import Wallet from '../../models/Wallet.js';
import SolverDoubts from '../../models/SolverDoubts.js';
import Doubt from '../../models/Doubt.js';

/**
 * Calculate coins based on doubt type and average rating
 * @param {string} doubtType - 'small', 'medium', or 'large'
 * @param {number} averageRating - Average rating of the solver (0-5)
 * @returns {number} - Coins to credit
 */
function calculateCoins(doubtType, averageRating) {
  // Base coins for 5-star rating
  const baseCoins = {
    small: 40,   // 20 min - Short
    medium: 60,  // 30 min - Medium
    large: 100   // 60 min - Long (fixed to 100 as per requirement)
  };

  const base = baseCoins[doubtType] || 40;
  
  // Calculate coins based on average rating
  // Formula: base - (base/5) * (5 - averageRating)
  // For 5 stars: base - 0 = base
  // For 4 stars: base - (base/5) = base * 0.8
  // For 3 stars: base - (base/5)*2 = base * 0.6
  const coins = base - (base / 5) * (5 - averageRating);
  
  return Math.round(coins);
}

/**
 * Get average rating for a solver based on all their solved doubts
 * @param {string} solverId - Solver user ID
 * @returns {Promise<number>} - Average rating (0-5)
 */
async function getAverageRating(solverId) {
  try {
    const solvedDoubts = await SolverDoubts.find({
      solver_id: solverId,
      resolution_status: 'session_completed',
      feedback_rating: { $exists: true, $ne: null }
    }).select('feedback_rating');

    if (solvedDoubts.length === 0) {
      return 0;
    }

    const totalRating = solvedDoubts.reduce((sum, sd) => sum + (sd.feedback_rating || 0), 0);
    const average = totalRating / solvedDoubts.length;
    
    return Math.round(average * 10) / 10; // Round to 1 decimal
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return 0;
  }
}

/**
 * Recalculate all coins for all solved doubts based on current average rating
 * This ensures all doubts are credited based on the latest average rating
 * @param {string} solverId - Solver user ID
 * @returns {Promise<{success: boolean, totalCoins?: number, balance?: number, averageRating?: number, error?: string}>}
 */
export async function recalculateAllCoins(solverId) {
  try {
    // Get all solved doubts with ratings
    const solvedDoubts = await SolverDoubts.find({
      solver_id: solverId,
      resolution_status: 'session_completed',
      feedback_rating: { $exists: true, $ne: null }
    }).populate('doubt_id', 'category rating');

    if (solvedDoubts.length === 0) {
      // No solved doubts, reset wallet
      let wallet = await Wallet.findOne({ user_id: solverId });
      if (wallet) {
        wallet.balance = 0;
        wallet.total_earned = 0;
        wallet.transactions = [];
        await wallet.save();
      }
      return { success: true, totalCoins: 0, balance: 0, averageRating: 0 };
    }

    // Calculate current average rating
    const totalRating = solvedDoubts.reduce((sum, sd) => sum + (sd.feedback_rating || 0), 0);
    const averageRating = totalRating / solvedDoubts.length;
    const roundedAverage = Math.round(averageRating * 10) / 10;

    // Recalculate coins for each doubt based on current average
    let totalCoins = 0;
    const transactions = [];

    for (const solverDoubt of solvedDoubts) {
      const doubt = solverDoubt.doubt_id;
      if (!doubt) continue;

      const doubtType = doubt.category || 'medium';
      const coinsForThisDoubt = calculateCoins(doubtType, roundedAverage);
      
      totalCoins += coinsForThisDoubt;
      
      transactions.push({
        doubt_id: doubt._id,
        amount: coinsForThisDoubt,
        doubt_type: doubtType,
        rating: solverDoubt.feedback_rating || doubt.rating || 0,
        average_rating: roundedAverage,
        createdAt: solverDoubt.resolved_at || solverDoubt.updatedAt || new Date()
      });
    }

    // Find or create wallet
    let wallet = await Wallet.findOne({ user_id: solverId });
    
    if (!wallet) {
      wallet = new Wallet({
        user_id: solverId,
        balance: 0,
        total_earned: 0,
        transactions: []
      });
    }

    // Update wallet with recalculated values
    const previousTotal = wallet.total_earned;
    wallet.balance = totalCoins;
    wallet.total_earned = totalCoins;
    wallet.transactions = transactions;

    await wallet.save();

    return {
      success: true,
      totalCoins,
      balance: wallet.balance,
      averageRating: roundedAverage,
      previousTotal
    };
  } catch (error) {
    console.error('Error recalculating coins:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Credit coins to solver's wallet when a doubt is solved
 * This recalculates ALL previous doubts based on new average rating
 * @param {string} solverId - Solver user ID
 * @param {string} doubtId - Doubt ID (newly solved)
 * @returns {Promise<{success: boolean, coins?: number, balance?: number, averageRating?: number, error?: string}>}
 */
export async function creditCoinsToSolver(solverId, doubtId) {
  try {
    // Find the newly solved doubt
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return { success: false, error: 'Doubt not found' };
    }

    // Recalculate all coins based on current average (including the new doubt)
    const result = await recalculateAllCoins(solverId);
    
    if (!result.success) {
      return result;
    }

    // Find the transaction for this specific doubt to get its coin amount
    const wallet = await Wallet.findOne({ user_id: solverId });
    const thisDoubtTransaction = wallet?.transactions?.find(
      tx => String(tx.doubt_id) === String(doubtId)
    );

    return {
      success: true,
      coins: thisDoubtTransaction?.amount || 0,
      balance: result.balance,
      averageRating: result.averageRating,
      totalCoins: result.totalCoins
    };
  } catch (error) {
    console.error('Error crediting coins:', error);
    return { success: false, error: error.message };
  }
}

