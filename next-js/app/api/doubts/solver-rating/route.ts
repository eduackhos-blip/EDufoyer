import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { z } from "zod";
import Doubt from "@/src/models/Doubt.js";
import SolverDoubts from "@/src/models/SolverDoubts.js";
import Notification from "@/src/models/Notification.js";

export const runtime = "nodejs";

const SubmitSolverRatingSchema = z.object({
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
  if (!userId || !messageType || !content) {
    return;
  }

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

async function submitSolverRating(formData: unknown, userId: string) {
  const validated = SubmitSolverRatingSchema.safeParse(formData);
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

    if (String((doubt as any).solver_id) !== String(userId)) {
      return { success: false, error: "You are not authorized to rate this asker." };
    }

    if (!(doubt as any).solver_id) {
      return { success: false, error: "No solver assigned for this doubt." };
    }

    const solverDoubt = await SolverDoubts.findOne({ doubt_id: doubtId, solver_id: (doubt as any).solver_id });
    if (!solverDoubt) {
      return { success: false, error: "Solver doubt record not found." };
    }

    const now = new Date();
    await SolverDoubts.findByIdAndUpdate(
      (solverDoubt as any)._id,
      {
        solver_rating_of_asker: rating,
        solver_comment_of_asker: comment || undefined,
        updatedAt: now,
      },
      { new: true }
    );

    await createNotification({
      userId: (doubt as any).doubter_id,
      doubtId,
      messageType: "SOLVER_RATED_ASKER",
      content: `The solver has rated your interaction. Rating: ${rating}/5`,
    });

    return { success: true, message: "Rating submitted successfully." };
  } catch {
    return { success: false, error: "Server error while submitting rating." };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = await submitSolverRating(body, user.id);
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
