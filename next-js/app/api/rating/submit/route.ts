import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import RatingFeedback from "@/src/models/RatingFeedback";

export const runtime = "nodejs";

const checkMongoConnection = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    if (!checkMongoConnection()) {
      return NextResponse.json(
        {
          success: false,
          message: "Database connection unavailable. Please try again later.",
          error: "MongoDB not connected",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { user_name, user_email, rating, feedback } = body ?? {};

    if (!user_name || !rating || !feedback) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, rating, and feedback are required",
        },
        { status: 400 }
      );
    }

    const ratingNum = parseInt(String(rating), 10);
    if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    const ratingFeedback = new RatingFeedback({
      user_name: String(user_name).trim(),
      user_email: user_email ? String(user_email).trim().toLowerCase() : undefined,
      rating: ratingNum,
      feedback: String(feedback).trim(),
    });

    await ratingFeedback.save();

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your feedback! Your rating has been submitted.",
        data: ratingFeedback,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: message,
      },
      { status: 500 }
    );
  }
}
