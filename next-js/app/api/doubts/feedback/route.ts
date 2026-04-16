import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { z } from "zod";
import Doubt from "@/src/models/Doubt.js";
import SolverDoubts from "@/src/models/SolverDoubts.js";
import Solver from "@/src/models/Solver.js";
import Wallet from "@/src/models/Wallet.js";
import Notification from "@/src/models/Notification.js";
import { publishSocketEvent } from "@/src/server/socketPublisher";

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

function calculateCoins(doubtType: string, averageRating: number) {
  const baseCoins: Record<string, number> = {
    small: 40,
    medium: 60,
    large: 100,
  };
  const base = baseCoins[doubtType] || 40;
  const coins = base - (base / 5) * (5 - averageRating);
  return Math.round(coins);
}

async function recalculateAllCoins(solverId: string) {
  const solvedDoubts = await SolverDoubts.find({
    solver_id: solverId,
    resolution_status: "session_completed",
    feedback_rating: { $exists: true, $ne: null },
  }).populate("doubt_id", "category rating");

  if (solvedDoubts.length === 0) {
    let wallet = await Wallet.findOne({ user_id: solverId });
    if (wallet) {
      wallet.balance = 0;
      wallet.total_earned = 0;
      wallet.transactions = [];
      await wallet.save();
    }
    return { success: true, totalCoins: 0, balance: 0, averageRating: 0 };
  }

  const totalRating = solvedDoubts.reduce((sum: number, sd: any) => sum + (sd.feedback_rating || 0), 0);
  const averageRating = totalRating / solvedDoubts.length;
  const roundedAverage = Math.round(averageRating * 10) / 10;

  let totalCoins = 0;
  const transactions: any[] = [];

  for (const solverDoubt of solvedDoubts as any[]) {
    const doubt = (solverDoubt as any).doubt_id;
    if (!doubt) continue;
    const doubtType = (doubt as any).category || "medium";
    const coinsForThisDoubt = calculateCoins(doubtType, roundedAverage);
    totalCoins += coinsForThisDoubt;
    transactions.push({
      doubt_id: (doubt as any)._id,
      amount: coinsForThisDoubt,
      doubt_type: doubtType,
      rating: (solverDoubt as any).feedback_rating || (doubt as any).rating || 0,
      average_rating: roundedAverage,
      createdAt: (solverDoubt as any).resolved_at || (solverDoubt as any).updatedAt || new Date(),
    });
  }

  let wallet = await Wallet.findOne({ user_id: solverId });
  if (!wallet) {
    wallet = new (Wallet as any)({ user_id: solverId, balance: 0, total_earned: 0, transactions: [] });
  }

  (wallet as any).balance = totalCoins;
  (wallet as any).total_earned = totalCoins;
  (wallet as any).transactions = transactions;
  await (wallet as any).save();

  return { success: true, totalCoins, balance: (wallet as any).balance, averageRating: roundedAverage };
}

async function creditCoinsToSolver(solverId: string, doubtId: string) {
  const doubt = await Doubt.findById(doubtId);
  if (!doubt) return { success: false, error: "Doubt not found" };

  const result = await recalculateAllCoins(solverId);
  if (!(result as any).success) return result as any;

  const wallet = await Wallet.findOne({ user_id: solverId });
  const thisDoubtTransaction = (wallet as any)?.transactions?.find((tx: any) => String(tx.doubt_id) === String(doubtId));

  return {
    success: true,
    coins: thisDoubtTransaction?.amount || 0,
    balance: (result as any).balance,
    averageRating: (result as any).averageRating,
    totalCoins: (result as any).totalCoins,
  };
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

    if (!(doubt as any).solver_id) {
      return { success: false, error: "No solver assigned for this doubt." };
    }

    const solverDoubt = await SolverDoubts.findOne({ doubt_id: doubtId, solver_id: (doubt as any).solver_id });
    const isAlreadyCompleted = solverDoubt && (solverDoubt as any).resolution_status === "session_completed";

    const now = new Date();
    await Doubt.findByIdAndUpdate(doubtId, { status: "resolved", is_solved: true, rating, updatedAt: now }, { new: true });

    if (solverDoubt) {
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
    }

    let coinInfo: any = null;
    if (!isAlreadyCompleted) {
      const solver = await Solver.findOne({ user_id: (doubt as any).solver_id });
      if (solver) {
        await Solver.findByIdAndUpdate((solver as any)._id, { $inc: { total_doubts_solved: 1 }, updatedAt: now }, { new: true });
      }
      coinInfo = await creditCoinsToSolver(String((doubt as any).solver_id), String(doubtId));
    }

    const notificationContent = coinInfo?.success
      ? `Your solution has been rated. You earned ${coinInfo.coins} coins! (Balance: ${coinInfo.balance} coins)`
      : "Your solution has been rated by the student.";

    await createNotification({
      userId: (doubt as any).solver_id,
      doubtId,
      messageType: "SOLUTION_ACCEPTED",
      content: notificationContent,
    });

    void publishSocketEvent({
      event: "doubt:rated",
      room: `solver:${String((doubt as any).solver_id)}`,
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
    const result = await submitFeedback(body, user.id);
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
