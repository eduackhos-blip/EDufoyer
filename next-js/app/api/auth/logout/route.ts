import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { serverEnv } from "@/src/utils/server/env";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!serverEnv.mongoUri) {
      return NextResponse.json(
        {
          success: false,
          message:
            "MONGODB_URI is required for in-app auth APIs. Configure it in your Next environment.",
        },
        { status: 503 }
      );
    }

    await connectDb();
    await getAuthenticatedUser(req);
    return NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, message: "Server error", error: message },
      { status: 500 }
    );
  }
}
