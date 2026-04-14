import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const { roomName } = body ?? {};

    if (!roomName) {
      return NextResponse.json({ success: false, message: "roomName is required" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ success: false, message: "LiveKit configuration error" }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(user.id),
      name: user.name || user.email || "Participant",
    });
    at.addGrant({
      room: String(roomName),
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json({ success: true, token: at.toJwt(), roomName }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate token";
    if (message === "Missing bearer token" || message === "Invalid token" || message === "Token expired") {
      return NextResponse.json({ success: false, message: "Access token required" }, { status: 401 });
    }
    if (message === "Invalid or inactive user") {
      return NextResponse.json({ success: false, message: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Failed to generate token" }, { status: 500 });
  }
}
