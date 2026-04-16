import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import SolverDoubts from "@/src/models/SolverDoubts.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const solverObjectId = new mongoose.Types.ObjectId(String(user.id));
    const pipeline = [
      { $match: { solver_id: solverObjectId, resolution_status: "session_completed", resolved_at: { $gte: startOfMonth } } },
      { $group: { _id: null, solvedCount: { $sum: 1 }, avgRating: { $avg: "$feedback_rating" } } },
    ];
    const results = await SolverDoubts.aggregate(pipeline);
    const metrics = results[0] || { solvedCount: 0, avgRating: null };
    return NextResponse.json({ success: true, data: metrics }, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
