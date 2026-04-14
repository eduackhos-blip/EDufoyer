import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import Doubt from "@/src/server/ported-backend/models/Doubt.js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { doubtId } = body ?? {};

    if (!doubtId) {
      return NextResponse.json({ success: false, message: "Doubt ID is required" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ success: false, message: "LiveKit configuration error" }, { status: 500 });
    }

    const doubt = await Doubt.findById(doubtId).select("_id subject status roomName").lean();
    if (!doubt) {
      return NextResponse.json({ success: false, message: "Doubt not found" }, { status: 404 });
    }

    const doubtStatus = String(doubt.status || "");
    if (doubtStatus !== "awaiting_solver" && doubtStatus !== "in_progress") {
      return NextResponse.json({ success: false, message: "Doubt session is not available" }, { status: 400 });
    }

    const roomName = (doubt as { roomName?: string }).roomName || `doubt-session-${doubtId}`;
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `email-join-${Date.now()}`,
      name: "Email Join User",
      ttl: 3600,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json(
      {
        success: true,
        token: at.toJwt(),
        roomName,
        message: "Token generated successfully for email join",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, message: "Failed to generate email token" }, { status: 500 });
  }
}
