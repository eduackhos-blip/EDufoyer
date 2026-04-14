import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { getSolvedDoubts } from "@/src/server/ported-backend/controllers/solver/getSolvedDoubts.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "10");
    const result = await getSolvedDoubts({ page, limit }, user.id);
    if (result.success) return NextResponse.json({ success: true, data: result.data }, { status: 200 });
    return NextResponse.json({ success: false, message: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
