import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import RatingFeedback from "@/src/models/RatingFeedback";

export const runtime = "nodejs";

const emptyPublicRatings = () => ({
  success: true,
  message: "No ratings available",
  data: [],
  stats: {
    averageRating: 0,
    totalRatings: 0,
  },
});

const checkMongoConnection = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const mongoConnected = checkMongoConnection();
    if (!mongoConnected) {
      return NextResponse.json(emptyPublicRatings(), { status: 200 });
    }

    const limit = Number(req.nextUrl.searchParams.get("limit") || "10");

    let ratings: unknown[] = [];
    let averageRating: Array<{ avgRating: number; count: number }> = [];

    try {
      ratings = await RatingFeedback.find({ is_approved: true })
        .sort({ is_featured: -1, createdAt: -1 })
        .limit(Number(limit))
        .lean();

      averageRating = await RatingFeedback.aggregate([
        { $match: { is_approved: true } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]);
    } catch {
      ratings = [];
      averageRating = [];
    }

    return NextResponse.json(
      {
        success: true,
        data: ratings || [],
        stats: {
          averageRating: averageRating[0]?.avgRating || 0,
          totalRatings: averageRating[0]?.count || 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : undefined;
    return NextResponse.json(
      {
        ...emptyPublicRatings(),
        error: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 200 }
    );
  }
}
