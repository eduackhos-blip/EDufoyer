import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import { parseSessionRoomId, resolveMaxSessionSeconds } from "@/src/lib/session/roomId";
import Room from "@/src/models/Room";
import Doubt from "@/src/models/Doubt";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    await getAuthenticatedUser(req);

    const roomId = req.nextUrl.searchParams.get("roomId")?.trim();
    if (!roomId || !parseSessionRoomId(roomId)) {
      return NextResponse.json(
        { success: false, valid: false, code: "invalid_format" },
        { status: 400 }
      );
    }

    const parsed = parseSessionRoomId(roomId);
    const room = await Room.findOne({ roomId })
      .select("status maxSessionSeconds sessionStartedAt subject")
      .lean();
    if (!room) {
      return NextResponse.json(
        { success: false, valid: false, code: "room_not_found" },
        { status: 404 }
      );
    }

    if ((room as { status?: string }).status === "closed") {
      return NextResponse.json(
        { success: false, valid: false, code: "room_closed" },
        { status: 404 }
      );
    }

    const doubt = await Doubt.findById(parsed!.doubtId)
      .select("category subject description")
      .lean();
    const doubtCategory = (doubt as { category?: string } | null)?.category;
    const doubtSubject = (doubt as { subject?: string } | null)?.subject?.trim();
    const doubtDescription = (doubt as { description?: string } | null)?.description?.trim();
    const roomSubject = (room as { subject?: string }).subject?.trim();
    const maxSessionSeconds = resolveMaxSessionSeconds(
      (room as { maxSessionSeconds?: number }).maxSessionSeconds,
      doubtCategory
    );
    const stored = Number((room as { maxSessionSeconds?: number }).maxSessionSeconds);
    if (stored !== maxSessionSeconds) {
      await Room.updateOne({ roomId }, { $set: { maxSessionSeconds } });
    }

    const sessionStartedAt = (room as { sessionStartedAt?: Date | null }).sessionStartedAt;

    return NextResponse.json(
      {
        success: true,
        valid: true,
        maxSessionSeconds,
        sessionStartedAt: sessionStartedAt ? new Date(sessionStartedAt).getTime() : null,
        meetingTitle: doubtSubject || roomSubject || "Meeting session",
        meetingDescription: doubtDescription || "Description of the meeting",
      },
      { status: 200 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
