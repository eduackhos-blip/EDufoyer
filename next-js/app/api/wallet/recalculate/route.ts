import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Wallet from "@/src/models/Wallet.js";
import SolverDoubts from "@/src/models/SolverDoubts.js";

export const runtime = "nodejs";

function calculateCoins(doubtType: string, averageRating: number) {
  const baseCoins: Record<string, number> = {
    small: 40,
    medium: 60,
    large: 100,
  };
  const base = baseCoins[doubtType] || 40;
  const coins = base - (base / 5) * (5 - averageRating);
  return Math.round(coins);
}

async function recalculateAllCoins(solverId: string) {
  try {
    const solvedDoubts = await SolverDoubts.find({
      solver_id: solverId,
      resolution_status: "session_completed",
      feedback_rating: { $exists: true, $ne: null },
    }).populate("doubt_id", "category rating");

    if (solvedDoubts.length === 0) {
      let wallet = await Wallet.findOne({ user_id: solverId });
      if (wallet) {
        wallet.balance = 0;
        wallet.total_earned = 0;
        wallet.transactions = [];
        await wallet.save();
      }
      return { success: true, totalCoins: 0, balance: 0, averageRating: 0 };
    }

    const totalRating = solvedDoubts.reduce((sum: number, sd: any) => sum + (sd.feedback_rating || 0), 0);
    const averageRating = totalRating / solvedDoubts.length;
    const roundedAverage = Math.round(averageRating * 10) / 10;

    let totalCoins = 0;
    const transactions: any[] = [];

    for (const solverDoubt of solvedDoubts as any[]) {
      const doubt = (solverDoubt as any).doubt_id;
      if (!doubt) continue;

      const doubtType = (doubt as any).category || "medium";
      const coinsForThisDoubt = calculateCoins(doubtType, roundedAverage);

      totalCoins += coinsForThisDoubt;

      transactions.push({
        doubt_id: (doubt as any)._id,
        amount: coinsForThisDoubt,
        doubt_type: doubtType,
        rating: (solverDoubt as any).feedback_rating || (doubt as any).rating || 0,
        average_rating: roundedAverage,
        createdAt: (solverDoubt as any).resolved_at || (solverDoubt as any).updatedAt || new Date(),
      });
    }

    let wallet = await Wallet.findOne({ user_id: solverId });
    if (!wallet) {
      wallet = new (Wallet as any)({
        user_id: solverId,
        balance: 0,
        total_earned: 0,
        transactions: [],
      });
    }

    const previousTotal = (wallet as any).total_earned;
    (wallet as any).balance = totalCoins;
    (wallet as any).total_earned = totalCoins;
    (wallet as any).transactions = transactions;

    await (wallet as any).save();

    return {
      success: true,
      totalCoins,
      balance: (wallet as any).balance,
      averageRating: roundedAverage,
      previousTotal,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return { success: false, error: message };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const result = await recalculateAllCoins(user.id);
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "Coins recalculated successfully",
          data: { balance: result.balance, totalCoins: result.totalCoins, averageRating: result.averageRating },
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ success: false, message: result.error }, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
