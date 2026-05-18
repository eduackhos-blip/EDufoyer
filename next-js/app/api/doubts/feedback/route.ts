import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser, getAuthUserId } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import { z } from "zod";
import Doubt from "@/src/models/Doubt";
import SolverDoubts from "@/src/models/SolverDoubts";
import Solver from "@/src/models/Solver";
import Notification from "@/src/models/Notification";
import { publishSocketEvent } from "@/src/utils/server/socketPublisher";
import { creditCoinsToSolver } from "@/src/utils/server/walletCredits";

export const runtime = "nodejs";

const SubmitFeedbackSchema = z.object({
  doubtId: z.string().min(1, "Doubt ID is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

async function createNotification({
  userId,
  doubtId,
  messageType,
  content,
}: {
  userId: unknown;
  doubtId?: unknown;
  messageType: unknown;
  content: unknown;
}) {
  if (!userId || !messageType || !content) return;
  try {
    await Notification.create({
      user_id: userId,
      doubt_id: doubtId ?? undefined,
      message_type: messageType,
      content: content,
    });
  } catch {
    // swallow
  }
}

async function submitFeedback(formData: unknown, userId: string) {
  const validated = SubmitFeedbackSchema.safeParse(formData);
  if (!validated.success) {
    return { success: false, error: "Invalid input data.", fieldErrors: validated.error.flatten().fieldErrors };
  }
  if (!userId) {
    return { success: false, error: "Unauthorized: You must be logged in." };
  }

  const { doubtId, rating, comment } = validated.data;

  try {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) return { success: false, error: "Doubt not found." };

    if (String((doubt as any).doubter_id) !== String(userId)) {
      return { success: false, error: "You are not authorized to rate this doubt." };
    }

    const endedStatuses = ["session_completed", "ended_solver_left", "ended_asker_timeout"] as const;
    const systemEndedStatuses = ["ended_solver_left", "ended_asker_timeout"] as const;

    let solverDoubt = (doubt as any).solver_id
      ? await SolverDoubts.findOne({ doubt_id: doubtId, solver_id: (doubt as any).solver_id })
      : null;

    if (!solverDoubt) {
      solverDoubt = await SolverDoubts.findOne({
        doubt_id: doubtId,
        resolution_status: { $in: [...endedStatuses] },
      }).sort({ resolved_at: -1, updatedAt: -1 });
    }

    if (!solverDoubt) {
      return { success: false, error: "No completed session found to rate for this doubt." };
    }

    const solverId = String((solverDoubt as any).solver_id);
    const resolutionStatus = (solverDoubt as any).resolution_status as string;
    const systemRating = (solverDoubt as any).feedback_rating as number | undefined;
    const isSystemEndedSession = systemEndedStatuses.includes(
      resolutionStatus as (typeof systemEndedStatuses)[number]
    );

    const now = new Date();

    if (isSystemEndedSession && systemRating != null) {
      const trimmedComment = comment?.trim();
      if (trimmedComment) {
        const existing = String((solverDoubt as any).feedback_comment || "").trim();
        const askerNote = `Asker note: ${trimmedComment}`;
        await SolverDoubts.findByIdAndUpdate((solverDoubt as any)._id, {
          feedback_comment: existing ? `${existing}\n\n${askerNote}` : askerNote,
          updatedAt: now,
        });
      }

      return {
        success: true,
        message: trimmedComment
          ? "Thank you — your note was saved."
          : "Session rating was already recorded by the system.",
        rating: systemRating,
        systemRated: true,
      };
    }

    const skipSolverStatsIncrement = endedStatuses.includes(
      resolutionStatus as (typeof endedStatuses)[number]
    );

    await Doubt.findByIdAndUpdate(doubtId, { status: "resolved", is_solved: true, rating, updatedAt: now }, { new: true });

    await SolverDoubts.findByIdAndUpdate(
      (solverDoubt as any)._id,
      {
        resolution_status: "session_completed",
        resolved_at: (solverDoubt as any).resolved_at || now,
        feedback_rating: rating,
        feedback_comment: comment || undefined,
        updatedAt: now,
      },
      { new: true }
    );

    if (!skipSolverStatsIncrement) {
      const solver = await Solver.findOne({ user_id: solverId });
      if (solver) {
        await Solver.findByIdAndUpdate(
          (solver as any)._id,
          { $inc: { total_doubts_solved: 1 }, updatedAt: now },
          { new: true }
        );
      }
      await creditCoinsToSolver(solverId, String(doubtId));
    }

    await createNotification({
      userId: solverId,
      doubtId,
      messageType: "SOLUTION_ACCEPTED",
      content: "Your solution has been rated by the student.",
    });

    void publishSocketEvent({
      event: "doubt:rated",
      room: `solver:${solverId}`,
      payload: {
        doubtId: String(doubtId),
        rating,
      },
    });

    return { success: true, message: "Feedback submitted successfully." };
  } catch {
    return { success: false, error: "Server error while submitting feedback." };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = await submitFeedback(body, getAuthUserId(user));
    if (result.success) return NextResponse.json({ success: true, message: result.message }, { status: 200 });
    return NextResponse.json(
      { success: false, message: result.error, fieldErrors: result.fieldErrors },
      { status: 400 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
