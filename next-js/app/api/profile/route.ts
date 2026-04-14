import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { getProfile } from "@/src/server/ported-backend/controllers/profile/getProfile.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const result = await getProfile(user.id);

    if (result.error) {
      return NextResponse.json({ success: false, message: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Missing bearer token" || message === "Invalid token" || message === "Token expired") {
      return NextResponse.json({ success: false, message: "Access token required" }, { status: 401 });
    }
    if (message === "Invalid or inactive user") {
      return NextResponse.json({ success: false, message: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
