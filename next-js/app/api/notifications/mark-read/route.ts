import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import Notification from "@/src/models/Notification";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);

    await Notification.updateMany({ user_id: user.id, is_read: false }, { is_read: true });
    return NextResponse.json({ success: true, message: "All notifications marked as read" }, { status: 200 });
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
