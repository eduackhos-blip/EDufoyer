import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { createProfile } from "@/src/server/ported-backend/controllers/profile/createProfile.js";
import cache from "@/src/server/ported-backend/utils/cache.js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = await createProfile(body, user.id);

    if (result.success) {
      cache.delete(`profile:${user.id}`);
      return NextResponse.json({ success: true, message: "Profile created successfully" }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
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
