import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import SolverDoubts from "@/src/models/SolverDoubts";
import Doubt from "@/src/models/Doubt";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
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

    const assignment = await SolverDoubts.findOne({ doubt_id: doubtId })
      .select("solver_id livekit_room_name resolution_status")
      .lean();
    if (!assignment || !assignment.livekit_room_name) {
      return NextResponse.json({ success: false, message: "Session not found or not scheduled" }, { status: 404 });
    }

    const doubt = await Doubt.findById(doubtId).select("doubter_id status").lean();
    if (!doubt) {
      return NextResponse.json({ success: false, message: "Doubt not found" }, { status: 404 });
    }

    if (doubt.status === "resolved" || assignment.resolution_status === "session_completed") {
      return NextResponse.json(
        { success: false, message: "Session already completed. Rejoining is not allowed." },
        { status: 403 }
      );
    }

    const solverIdStr = assignment.solver_id?.toString?.() || String(assignment.solver_id);
    const doubterIdStr = doubt.doubter_id?.toString?.() || String(doubt.doubter_id);
    if (user.id.toString() !== solverIdStr && user.id.toString() !== doubterIdStr) {
      return NextResponse.json({ success: false, message: "Not authorized for this session" }, { status: 403 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: String(user.id),
      name: user.name || user.email || "Participant",
      ttl: 3600,
    });

    at.addGrant({
      room: assignment.livekit_room_name,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return NextResponse.json(
      {
        success: true,
        token: at.toJwt(),
        roomName: assignment.livekit_room_name,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate session token";
    if (message === "Missing bearer token" || message === "Invalid token" || message === "Token expired") {
      return NextResponse.json({ success: false, message: "Access token required" }, { status: 401 });
    }
    if (message === "Invalid or inactive user") {
      return NextResponse.json({ success: false, message: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Failed to generate session token" }, { status: 500 });
  }
}
