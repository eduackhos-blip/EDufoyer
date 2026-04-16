import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Doubt from "@/src/models/Doubt.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    await getAuthenticatedUser(req);
    const doubts = await Doubt.find().populate("doubter_id", "name email").sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: doubts }, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
