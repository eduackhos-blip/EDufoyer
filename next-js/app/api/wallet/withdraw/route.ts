import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Wallet from "@/src/models/Wallet.js";
import WithdrawalRequest from "@/src/models/WithdrawalRequest.js";
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

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const { amount, upi_id, bank_account_number, bank_ifsc, bank_name, account_holder_name } = body ?? {};

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid withdrawal amount" }, { status: 400 });
    }
    if (!account_holder_name) {
      return NextResponse.json({ success: false, message: "Account holder name is required" }, { status: 400 });
    }
    if (!upi_id && (!bank_account_number || !bank_ifsc || !bank_name)) {
      return NextResponse.json(
        { success: false, message: "Please provide either UPI ID or complete bank account details" },
        { status: 400 }
      );
    }

    const wallet = await Wallet.findOne({ user_id: user.id });
    if (!wallet) return NextResponse.json({ success: false, message: "Wallet not found" }, { status: 404 });
    if (wallet.balance < amount) {
      return NextResponse.json(
        { success: false, message: `Insufficient balance. Available: ${wallet.balance} coins` },
        { status: 400 }
      );
    }

    const eligibility = await checkWithdrawalEligibility(String(user.id));
    if (!eligibility.isEligible) {
      return NextResponse.json({ success: false, message: eligibility.message, eligibility }, { status: 403 });
    }

    const pendingRequest = await WithdrawalRequest.findOne({ user_id: user.id, status: "pending" });
    if (pendingRequest) {
      return NextResponse.json(
        { success: false, message: "You already have a pending withdrawal request. Please wait for approval." },
        { status: 400 }
      );
    }

    const withdrawalRequest = new WithdrawalRequest({
      user_id: user.id,
      amount,
      upi_id: upi_id || null,
      bank_account_number: bank_account_number || null,
      bank_ifsc: bank_ifsc || null,
      bank_name: bank_name || null,
      account_holder_name,
      status: "pending",
    });
    await withdrawalRequest.save();

    return NextResponse.json(
      { success: true, message: "Withdrawal request submitted successfully", data: withdrawalRequest },
      { status: 201 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
