import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import WithdrawalRequest from "@/src/server/ported-backend/models/WithdrawalRequest.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const withdrawals = await WithdrawalRequest.find({ user_id: user.id })
      .sort({ createdAt: -1 })
      .populate("approved_by", "name email");
    return NextResponse.json({ success: true, data: withdrawals }, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
