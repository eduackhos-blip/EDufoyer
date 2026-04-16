import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import Notification from "@/src/models/Notification.js";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const { id } = await params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: user.id },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: notification }, { status: 200 });
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
