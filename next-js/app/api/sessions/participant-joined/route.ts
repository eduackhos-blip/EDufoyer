import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { parseSessionRoomId, resolveMaxSessionSeconds } from "@/src/lib/session/roomId";
import Doubt from "@/src/models/Doubt";
import Room from "@/src/models/Room";
import { serverEnv } from "@/src/utils/server/env";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  socketId: z.string().min(1).optional(),
  plannedSeconds: z.number().positive().optional(),
});

function verifySocketApiKey(req: NextRequest) {
  if (!serverEnv.socketServerApiKey) return true;
  const key = req.headers.get("x-socket-api-key");
  return key === serverEnv.socketServerApiKey;
}

export async function POST(req: NextRequest) {
  if (!verifySocketApiKey(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDb();
    const body = BodySchema.parse(await req.json());
    const parsed = parseSessionRoomId(body.roomId);
    if (!parsed) {
      return NextResponse.json({ success: false, message: "Invalid roomId format" }, { status: 400 });
    }

    let room = await Room.findOne({ roomId: body.roomId });
    const doubtForRoom = await Doubt.findById(parsed.doubtId)
      .select("doubter_id subject category")
      .lean();
    if (!doubtForRoom) {
      return NextResponse.json({ success: false, message: "Doubt not found" }, { status: 404 });
    }

    const doubtCategory = (doubtForRoom as { category?: string }).category;
    const maxSessionSeconds = resolveMaxSessionSeconds(
      (room as { maxSessionSeconds?: number } | null)?.maxSessionSeconds,
      doubtCategory
    );

    if (!room) {
      room = await Room.create({
        roomId: body.roomId,
        doubt_id: parsed.doubtId,
        solver_id: parsed.solverId,
        doubter_id: (doubtForRoom as { doubter_id: unknown }).doubter_id,
        subject: String((doubtForRoom as { subject?: string }).subject || ""),
        status: "active",
        hasSolverEverJoined: false,
        hasAskerEverJoined: false,
        maxSessionSeconds,
      });
    } else {
      const stored = Number((room as { maxSessionSeconds?: number }).maxSessionSeconds);
      if (stored !== maxSessionSeconds) {
        await Room.updateOne({ roomId: body.roomId }, { $set: { maxSessionSeconds } });
      }
    }

    const isSolver =
      String(body.userId) === parsed.solverId ||
      String(body.userId) === String((room as { solver_id?: unknown }).solver_id);
    const isAsker = String(body.userId) === String((room as { doubter_id?: unknown }).doubter_id);

    if (!isSolver && !isAsker) {
      return NextResponse.json(
        { success: false, message: "User is not a participant in this room" },
        { status: 403 }
      );
    }

    const update: Record<string, unknown> = {};
    if (isSolver) update.hasSolverEverJoined = true;
    if (isAsker) update.hasAskerEverJoined = true;

    const updated = await Room.findOneAndUpdate(
      { roomId: body.roomId },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Room not found" }, { status: 404 });
    }

    const hasSolver = Boolean((updated as { hasSolverEverJoined?: boolean }).hasSolverEverJoined);
    const hasAsker = Boolean((updated as { hasAskerEverJoined?: boolean }).hasAskerEverJoined);
    const alreadyStarted = Boolean((updated as { sessionStartedAt?: Date | null }).sessionStartedAt);

    let sessionStartedAt = (updated as { sessionStartedAt?: Date | null }).sessionStartedAt ?? null;
    let timerJustStarted = false;

    if (hasSolver && hasAsker && !alreadyStarted) {
      sessionStartedAt = new Date();
      timerJustStarted = true;
      await Room.findOneAndUpdate(
        { roomId: body.roomId },
        { $set: { sessionStartedAt } }
      );
    }

    let plannedSeconds = body.plannedSeconds;
    if (!plannedSeconds || plannedSeconds <= 0) {
      plannedSeconds = maxSessionSeconds;
    }

    return NextResponse.json({
      success: true,
      hasSolverEverJoined: hasSolver,
      hasAskerEverJoined: hasAsker,
      timerJustStarted,
      sessionStartedAt: sessionStartedAt ? sessionStartedAt.toISOString() : null,
      plannedSeconds,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
