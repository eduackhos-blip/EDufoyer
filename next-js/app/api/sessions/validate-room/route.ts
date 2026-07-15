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
      .select("status maxSessionSeconds sessionStartedAt")
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

    const doubt = await Doubt.findById(parsed!.doubtId).select("category").lean();
    const doubtCategory = (doubt as { category?: string } | null)?.category;
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
