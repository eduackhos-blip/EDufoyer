import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Doubt from "@/src/models/Doubt";
import SolverDoubts from "@/src/models/SolverDoubts";
import User from "@/src/models/User";
import mongoose from "mongoose";

export const runtime = "nodejs";

async function getUserDoubts(userId: string, page = 1, limit = 20) {
  if (!userId) {
    return { success: false, error: "Unauthorized", doubts: [] as unknown[] };
  }

  try {
    const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
    const total = await Doubt.countDocuments({ doubter_id: userId });

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userDoubts = await Doubt.aggregate([
      { $match: { doubter_id: userObjectId } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(String(limit)) },
      {
        $lookup: {
          from: (User as any).collection.name,
          localField: "solver_id",
          foreignField: "_id",
          as: "solver",
        },
      },
      { $unwind: { path: "$solver", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: (SolverDoubts as any).collection.name,
          let: { doubtId: "$_id", solverId: "$solver_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$doubt_id", "$$doubtId"] },
                    { $eq: ["$solver_id", "$$solverId"] },
                  ],
                },
              },
            },
            {
              $project: {
                resolved_at: 1,
                resolution_status: 1,
                feedback_comment: 1,
                feedback_rating: 1,
              },
            },
          ],
          as: "solverDoubt",
        },
      },
      { $unwind: { path: "$solverDoubt", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          subject: 1,
          description: 1,
          image: 1,
          status: 1,
          is_solved: 1,
          rating: 1,
          category: 1,
          createdAt: 1,
          solver: {
            name: "$solver.name",
            avatarUrl: "$solver.avatarUrl",
          },
          solverDoubt: 1,
        },
      },
    ]);

    return {
      success: true,
      doubts: userDoubts,
      pagination: {
        currentPage: parseInt(String(page)),
        totalPages: Math.ceil(total / parseInt(String(limit))),
        totalDoubts: total,
        hasNext: skip + parseInt(String(limit)) < total,
        hasPrev: parseInt(String(page)) > 1,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: "Database Error: Failed to fetch doubts.",
      doubts: [] as unknown[],
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
    const result = await getUserDoubts(user.id, page, limit);
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          data: {
            doubts: result.doubts,
            pagination:
              result.pagination || {
                currentPage: 1,
                totalPages: 0,
                totalDoubts: result.doubts.length,
                hasNext: false,
                hasPrev: false,
              },
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
