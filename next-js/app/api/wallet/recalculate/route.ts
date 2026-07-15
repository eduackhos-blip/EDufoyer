import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser, getAuthUserId } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import { recalculateAllCoins } from "@/src/utils/server/walletCredits";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const result = await recalculateAllCoins(getAuthUserId(user));

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "Coins recalculated successfully",
          data: {
            balance: result.balance,
            totalCoins: result.totalCoins,
            averageRating: result.averageRating,
          },
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
