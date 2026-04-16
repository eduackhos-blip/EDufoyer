import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Solver from "@/src/models/Solver.js";
import Doubt from "@/src/models/Doubt.js";
import cache from "@/src/server/utils/cache.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const cacheKey = `solver:${user.id}`;
    let solverInfo = cache.get(cacheKey);
    if (!solverInfo) {
      solverInfo = await Solver.findOne({ user_id: user.id }).select("specialities").lean();
      if (solverInfo) cache.set(cacheKey, solverInfo, 15 * 60 * 1000);
    }
    if (!solverInfo?.specialities?.length) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }
    const specialities = solverInfo.specialities.map((s: string) => s.toLowerCase());
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const availableDoubts = await Doubt.find({ status: "open", subject: { $in: specialities } })
      .select("_id subject description image createdAt is_scheduled scheduled_date scheduled_time")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Doubt.countDocuments({ status: "open", subject: { $in: specialities } });
    return NextResponse.json(
      {
        success: true,
        data: availableDoubts,
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
