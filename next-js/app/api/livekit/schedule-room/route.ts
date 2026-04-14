import { RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const { roomBase = "pyq", scheduledAt, maxParticipants = 2 } = body ?? {};

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || "https://remote-opgy8hh4.livekit.cloud";
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ success: false, message: "LiveKit configuration error" }, { status: 500 });
    }

    const when = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
    const safeBase = String(roomBase).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "pyq";
    const roomName = `${safeBase}-${user.id}-${when}`;

    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
    const roomOptions = {
      name: roomName,
      emptyTimeout: 60,
      maxParticipants: Math.max(2, Math.min(50, Number(maxParticipants) || 2)),
    };

    try {
      await roomService.createRoom(roomOptions);
    } catch (error) {
      if (!String((error as Error)?.message || "").includes("already exists")) {
        throw error;
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          roomName,
          scheduledAt: scheduledAt || new Date().toISOString(),
          maxParticipants: roomOptions.maxParticipants,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule room";
    if (message === "Missing bearer token" || message === "Invalid token" || message === "Token expired") {
      return NextResponse.json({ success: false, message: "Access token required" }, { status: 401 });
    }
    if (message === "Invalid or inactive user") {
      return NextResponse.json({ success: false, message: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Failed to schedule room" }, { status: 500 });
  }
}
