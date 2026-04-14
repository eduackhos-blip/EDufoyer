import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { completeDoubt } from "@/src/server/ported-backend/controllers/solver/completeDoubt.js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = await completeDoubt(body, user.id);
    if (result.success) return NextResponse.json({ success: true, message: result.message, data: result.data }, { status: 200 });
    return NextResponse.json({ success: false, message: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
