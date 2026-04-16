import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { z } from "zod";
import Doubt from "@/src/models/Doubt";
import SolverDoubts from "@/src/models/SolverDoubts";
import Solver from "@/src/models/Solver";
import Notification from "@/src/models/Notification";
import { publishSocketEvent } from "@/src/server/socketPublisher";

export const runtime = "nodejs";

const CompleteDoubtSchema = z.object({
  doubtId: z.string().min(1, "Doubt ID is required"),
  feedback_rating: z.number().min(1).max(5).optional(),
  feedback_comment: z.string().max(1000).optional(),
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

async function completeDoubt(formData: unknown, userId: string) {
  const validatedFields = CompleteDoubtSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid input data.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized: You must be logged in to complete a doubt.",
    };
  }

  const { doubtId, feedback_rating, feedback_comment } = validatedFields.data;

  try {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return { success: false, error: "Doubt not found." };
    }

    if (String((doubt as any).solver_id) !== String(userId)) {
      return { success: false, error: "You are not authorized to complete this doubt." };
    }

    const updatedDoubt = await Doubt.findByIdAndUpdate(
      doubtId,
      {
        status: "resolved",
        is_solved: true,
        rating: feedback_rating,
        updatedAt: new Date(),
      },
      { new: true }
    );

    const solverDoubtRecord = await SolverDoubts.findOneAndUpdate(
      { doubt_id: doubtId, solver_id: userId },
      {
        resolution_status: "session_completed",
        resolved_at: new Date(),
        feedback_rating: feedback_rating,
        feedback_comment: feedback_comment,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!solverDoubtRecord) {
      return { success: false, error: "Solver doubt record not found." };
    }

    const solver = await Solver.findOne({ user_id: userId });
    if (solver) {
      await Solver.findByIdAndUpdate(
        (solver as any)._id,
        {
          $inc: { total_doubts_solved: 1 },
          updatedAt: new Date(),
        },
        { new: true }
      );
    }

    await createNotification({
      userId: (doubt as any).doubter_id,
      doubtId: doubtId,
      messageType: "DOUBT_RESOLVED",
      content: `Your doubt "${(doubt as any).subject}" has been resolved by the solver.`,
    });

    void publishSocketEvent({
      event: "doubt:completed",
      room: `solver:${userId}`,
      payload: {
        doubtId: String(doubtId),
        feedbackRating: feedback_rating ?? null,
        resolvedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Doubt completed successfully!",
      data: {
        doubt: updatedDoubt,
        solverDoubt: solverDoubtRecord,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return {
      success: false,
      error: `An unexpected server error occurred. Please try again. ${message}`,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = await completeDoubt(body, user.id);
    if (result.success) return NextResponse.json({ success: true, message: result.message, data: result.data }, { status: 200 });
    return NextResponse.json({ success: false, message: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
