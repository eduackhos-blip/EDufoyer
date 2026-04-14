import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";

export const runtime = "nodejs";

const checkMongoConnection = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

export async function GET() {
  try {
    await connectDb();
  } catch {
    // Keep parity with backend test route response.
  }

  return NextResponse.json(
    {
      success: true,
      message: "Rating routes are working",
      mongoConnected: checkMongoConnection(),
      mongoState: mongoose.connection.readyState,
    },
    { status: 200 }
  );
}
