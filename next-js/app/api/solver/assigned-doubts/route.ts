import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Doubt from "@/src/server/ported-backend/models/Doubt.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const status = req.nextUrl.searchParams.get("status") || "all";
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const solverObjectId = new mongoose.Types.ObjectId(String(user.id));

    const results = await Doubt.aggregate([
      {
        $lookup: {
          from: "solverdoubts",
          localField: "_id",
          foreignField: "doubt_id",
          as: "solverDoubt",
        },
      },
      {
        $match: {
          "solverDoubt.solver_id": solverObjectId,
          ...(status !== "all" ? { "solverDoubt.resolution_status": status } : {}),
        },
      },
      { $sort: { "solverDoubt.assigned_at": -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalResults = await Doubt.aggregate([
      {
        $lookup: {
          from: "solverdoubts",
          localField: "_id",
          foreignField: "doubt_id",
          as: "solverDoubt",
        },
      },
      {
        $match: {
          "solverDoubt.solver_id": solverObjectId,
          ...(status !== "all" ? { "solverDoubt.resolution_status": status } : {}),
        },
      },
      { $count: "total" },
    ]);
    const total = totalResults[0]?.total || 0;

    return NextResponse.json(
      {
        success: true,
        data: results,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalDoubts: total,
          hasNext: skip + limit < total,
          hasPrev: page > 1,
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
