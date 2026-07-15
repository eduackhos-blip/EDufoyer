import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser, getAuthUserId } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import { checkWithdrawalEligibility } from "@/src/utils/server/walletEligibility";
import Wallet from "@/src/models/Wallet";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const userId = getAuthUserId(user);

    let wallet = await Wallet.findOne({ user_id: userId }).populate(
      "transactions.doubt_id",
      "subject category"
    );

    if (!wallet) {
      wallet = new Wallet({ user_id: userId, balance: 0, total_earned: 0, transactions: [] });
      await wallet.save();
    }

    const transactions = [...(wallet.transactions || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const eligibility = await checkWithdrawalEligibility(userId);

    return NextResponse.json(
      {
        success: true,
        data: {
          balance: wallet.balance,
          total_earned: wallet.total_earned,
          transactions,
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
