import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser, getAuthUserId } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import { checkWithdrawalEligibility } from "@/src/utils/server/walletEligibility";
import Wallet from "@/src/models/Wallet";
import WithdrawalRequest from "@/src/models/WithdrawalRequest";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const userId = getAuthUserId(user);
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

    const wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      return NextResponse.json({ success: false, message: "Wallet not found" }, { status: 404 });
    }
    if (wallet.balance < amount) {
      return NextResponse.json(
        { success: false, message: `Insufficient balance. Available: ${wallet.balance} coins` },
        { status: 400 }
      );
    }

    const eligibility = await checkWithdrawalEligibility(userId);
    if (!eligibility.isEligible) {
      return NextResponse.json(
        { success: false, message: eligibility.message, eligibility },
        { status: 403 }
      );
    }

    const pendingRequest = await WithdrawalRequest.findOne({ user_id: userId, status: "pending" });
    if (pendingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending withdrawal request. Please wait for approval.",
        },
        { status: 400 }
      );
    }

    const withdrawalRequest = new WithdrawalRequest({
      user_id: userId,
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
      {
        success: true,
        message: "Withdrawal request submitted successfully",
        data: withdrawalRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
