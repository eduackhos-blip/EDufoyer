import Wallet from "@/src/models/Wallet";
import SolverDoubts from "@/src/models/SolverDoubts";
import Doubt from "@/src/models/Doubt";

export function calculateCoins(doubtType: string, averageRating: number) {
  const baseCoins: Record<string, number> = {
    small: 40,
    medium: 60,
    large: 100,
  };
  const base = baseCoins[doubtType] || 40;
  const coins = base - (base / 5) * (5 - averageRating);
  return Math.round(coins);
}

export async function getAverageRating(solverId: string) {
const solvedDoubts = await SolverDoubts.find({
      solver_id: solverId,
      resolution_status: {
        $in: ["session_completed", "ended_solver_left", "ended_asker_timeout"],
      },
      feedback_rating: { $exists: true, $ne: null },
    }).select("feedback_rating");

  if (solvedDoubts.length === 0) return 0;

  const totalRating = solvedDoubts.reduce((sum, sd) => sum + (sd.feedback_rating || 0), 0);
  return Math.round((totalRating / solvedDoubts.length) * 10) / 10;
}

export async function recalculateAllCoins(solverId: string) {
  try {
    const solvedDoubts = await SolverDoubts.find({
      solver_id: solverId,
      resolution_status: {
        $in: ["session_completed", "ended_solver_left", "ended_asker_timeout"],
      },
      feedback_rating: { $exists: true, $ne: null },
    }).populate("doubt_id", "category rating");

    if (solvedDoubts.length === 0) {
      const wallet = await Wallet.findOne({ user_id: solverId });
      if (wallet) {
        wallet.balance = 0;
        wallet.total_earned = 0;
        wallet.transactions = [];
        await wallet.save();
      }
      return { success: true as const, totalCoins: 0, balance: 0, averageRating: 0 };
    }

    const totalRating = solvedDoubts.reduce((sum, sd) => sum + (sd.feedback_rating || 0), 0);
    const averageRating = totalRating / solvedDoubts.length;
    const roundedAverage = Math.round(averageRating * 10) / 10;

    let totalCoins = 0;
    const transactions: Array<{
      doubt_id: unknown;
      amount: number;
      doubt_type: string;
      rating: number;
      average_rating: number;
      createdAt: Date;
    }> = [];

    for (const solverDoubt of solvedDoubts) {
      const doubt = solverDoubt.doubt_id as { _id?: unknown; category?: string; rating?: number } | null;
      if (!doubt) continue;

      const doubtType = doubt.category || "medium";
      const coinsForThisDoubt = calculateCoins(doubtType, roundedAverage);
      totalCoins += coinsForThisDoubt;

      transactions.push({
        doubt_id: doubt._id,
        amount: coinsForThisDoubt,
        doubt_type: doubtType,
        rating: solverDoubt.feedback_rating || doubt.rating || 0,
        average_rating: roundedAverage,
        createdAt: solverDoubt.resolved_at || solverDoubt.updatedAt || new Date(),
      });
    }

    let wallet = await Wallet.findOne({ user_id: solverId });
    if (!wallet) {
      wallet = new Wallet({
        user_id: solverId,
        balance: 0,
        total_earned: 0,
        transactions: [],
      });
    }

    const previousTotal = wallet.total_earned;
    wallet.balance = totalCoins;
    wallet.total_earned = totalCoins;
    wallet.transactions = transactions;
    await wallet.save();

    return {
      success: true as const,
      totalCoins,
      balance: wallet.balance,
      averageRating: roundedAverage,
      previousTotal,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return { success: false as const, error: message };
  }
}

export async function creditCoinsToSolver(solverId: string, doubtId: string) {
  try {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return { success: false as const, error: "Doubt not found" };
    }

    const result = await recalculateAllCoins(solverId);
    if (!result.success) {
      return result;
    }

    const wallet = await Wallet.findOne({ user_id: solverId });
    const thisDoubtTransaction = wallet?.transactions?.find(
      (tx) => String(tx.doubt_id) === String(doubtId)
    );

    return {
      success: true as const,
      coins: thisDoubtTransaction?.amount || 0,
      balance: result.balance,
      averageRating: result.averageRating,
      totalCoins: result.totalCoins,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return { success: false as const, error: message };
  }
}
