import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Wallet from "@/src/models/Wallet.js";
import SolverDoubts from "@/src/models/SolverDoubts.js";

export const runtime = "nodejs";

async function checkWithdrawalEligibility(solverId: string) {
  const completedDoubts = await SolverDoubts.countDocuments({
    solver_id: solverId,
    resolution_status: "session_completed",
    feedback_rating: { $exists: true, $ne: null },
  });
  const solvedDoubts = await SolverDoubts.find({
    solver_id: solverId,
    resolution_status: "session_completed",
    feedback_rating: { $exists: true, $ne: null },
  }).select("feedback_rating");

  let averageRating = 0;
  if (solvedDoubts.length > 0) {
    const totalRating = solvedDoubts.reduce((sum, sd) => sum + (sd.feedback_rating || 0), 0);
    averageRating = Math.round((totalRating / solvedDoubts.length) * 10) / 10;
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
      ? "You are eligible for withdrawal"
      : completedDoubts < minDoubtsRequired
        ? `Complete ${minDoubtsRequired - completedDoubts} more doubts to unlock withdrawal (Free trial period: ${completedDoubts}/${minDoubtsRequired})`
        : `Your average rating is ${averageRating.toFixed(1)}. You need at least ${minRatingRequired} stars to withdraw.`,
  };
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    let wallet = await Wallet.findOne({ user_id: user.id })
      .populate("transactions.doubt_id", "subject category")
      .sort({ "transactions.createdAt": -1 });

    if (!wallet) {
      wallet = new Wallet({ user_id: user.id, balance: 0, total_earned: 0, transactions: [] });
      await wallet.save();
    }
    const eligibility = await checkWithdrawalEligibility(String(user.id));
    return NextResponse.json(
      {
        success: true,
        data: {
          balance: wallet.balance,
          total_earned: wallet.total_earned,
          transactions: wallet.transactions,
          withdrawalEligibility: eligibility,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
