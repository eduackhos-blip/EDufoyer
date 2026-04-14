import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { recalculateAllCoins } from "@/src/server/ported-backend/controllers/wallet/creditCoins.js";

export const runtime = "nodejs";

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
