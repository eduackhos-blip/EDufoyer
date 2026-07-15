import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/src/lib/db";
import { serverEnv } from "@/src/utils/server/env";
import {
  processSessionEnd,
  type SessionEndReason,
} from "@/src/utils/server/processSessionEnd";

export const runtime = "nodejs";

const bodySchema = z.object({
  roomId: z.string().min(1),
  reason: z.enum([
    "solver_left",
    "asker_left_timeout",
    "asker_left_rated",
    "timer_completed",
    "solver_left_during_asker_grace",
  ]),
  elapsedSeconds: z.number().min(0),
  plannedSeconds: z.number().positive().optional(),
  solverId: z.string().optional(),
  askerRating: z.number().min(1).max(5).optional(),
  askerComment: z.string().max(1000).optional(),
});

const requireInternalKey = (req: NextRequest) => {
  if (!serverEnv.socketServerApiKey) return true;
  const headerKey = req.headers.get("x-socket-api-key");
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return headerKey === serverEnv.socketServerApiKey || bearer === serverEnv.socketServerApiKey;
};

export async function POST(req: NextRequest) {
  try {
    if (!requireInternalKey(req)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const body = bodySchema.parse(await req.json());
    const result = await processSessionEnd({
      roomId: body.roomId,
      reason: body.reason as SessionEndReason,
      elapsedSeconds: body.elapsedSeconds,
      plannedSeconds: body.plannedSeconds,
      solverId: body.solverId,
      askerRating: body.askerRating,
      askerComment: body.askerComment,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
