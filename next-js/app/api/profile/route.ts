import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import Profile from "@/src/models/Profile";
import cache from "@/src/utils/server/cache";

export const runtime = "nodejs";

async function getProfile(userId: string) {
  try {
    const cacheKey = `profile:${userId}`;
    const cachedProfile = cache.get(cacheKey);
    if (cachedProfile) {
      return cachedProfile;
    }

    const userProfile = await Profile.findOne({ userId: userId }).select("strongSubject").lean();

    if (!userProfile) {
      return {
        error: "Profile not found.",
      };
    }

    cache.set(cacheKey, userProfile, 10 * 60 * 1000);
    return userProfile;
  } catch (error) {
    return {
      error: "An unexpected error occurred while fetching the profile.",
    };
  }
}

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
