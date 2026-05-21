import Doubt from "@/src/models/Doubt";
import Room from "@/src/models/Room";
import Solver from "@/src/models/Solver";
import SolverDoubts from "@/src/models/SolverDoubts";
import Notification from "@/src/models/Notification";
import {
  attendancePercentToRating,
  computeAttendancePercent,
} from "@/src/lib/session/attendanceRating";
import { parseSessionRoomId, plannedSecondsFromCategory } from "@/src/lib/session/roomId";
import { creditCoinsToSolver } from "@/src/utils/server/walletCredits";
import { publishSocketEvent } from "@/src/utils/server/socketPublisher";

export type SessionEndReason =
  | "solver_left"
  | "asker_left_timeout"
  | "asker_left_rated"
  | "timer_completed"
  | "solver_left_during_asker_grace";

export type ProcessSessionEndInput = {
  roomId: string;
  reason: SessionEndReason;
  elapsedSeconds: number;
  plannedSeconds?: number;
  solverId?: string;
  /** When asker leaves intentionally after rating the solver on the leave flow. */
  askerRating?: number;
  askerComment?: string;
};

export type ProcessSessionEndResult =
  | {
      success: true;
      alreadyProcessed?: boolean;
      attendancePercent: number;
      feedbackRating: number;
      ratingSource?: "system_attendance" | "asker_intentional";
      askerMessage?: string;
      walletCredited: boolean;
      coins?: number;
      balance?: number;
    }
  | { success: false; error: string };

const resolutionStatusForReason: Record<SessionEndReason, string> = {
  solver_left: "ended_solver_left",
  asker_left_timeout: "ended_asker_timeout",
  asker_left_rated: "ended_asker_rated",
  timer_completed: "session_completed",
  solver_left_during_asker_grace: "ended_solver_abandoned_grace",
};

/** System rating from how long the session actually ran vs planned length. */
function buildSystemSessionRating(
  reason: SessionEndReason,
  elapsedSeconds: number,
  plannedSeconds: number
) {
  const attendancePercent = computeAttendancePercent(elapsedSeconds, plannedSeconds);
  const feedbackRating =
    reason === "solver_left_during_asker_grace"
      ? 1
      : attendancePercentToRating(attendancePercent);
  const feedbackComment =
    reason === "solver_left_during_asker_grace"
      ? "Solver left before asker rejoin window ended."
      : `System rating from session attendance (${attendancePercent}% of planned time).`;

  return {
    attendancePercent,
    feedbackRating,
    feedbackComment,
    ratingSource: "system_attendance" as const,
  };
}

export async function processSessionEnd(
  input: ProcessSessionEndInput
): Promise<ProcessSessionEndResult> {
  const parsed = parseSessionRoomId(input.roomId);
  if (!parsed) {
    return { success: false, error: "Invalid session room id" };
  }

  const solverId = input.solverId || parsed.solverId;
  const { doubtId, roomId } = parsed;

  const [doubt, room, solverDoubt] = await Promise.all([
    Doubt.findById(doubtId),
    Room.findOne({ roomId }),
    SolverDoubts.findOne({ doubt_id: doubtId, solver_id: solverId }),
  ]);

  if (!doubt) {
    return { success: false, error: "Doubt not found" };
  }

  if (room?.status === "closed" && solverDoubt?.resolution_status?.startsWith("ended_")) {
    return {
      success: true,
      alreadyProcessed: true,
      attendancePercent: 0,
      feedbackRating: 0,
      walletCredited: false,
    };
  }

  if (String(doubt.solver_id) !== String(solverId)) {
    return { success: false, error: "Doubt is not assigned to this solver" };
  }

  if (doubt.status !== "assigned") {
    return {
      success: true,
      alreadyProcessed: true,
      attendancePercent: 0,
      feedbackRating: 0,
      walletCredited: false,
    };
  }

  const plannedSeconds =
    input.plannedSeconds && input.plannedSeconds > 0
      ? input.plannedSeconds
      : plannedSecondsFromCategory((doubt as { category?: string }).category);

  const skipWallet = input.reason === "solver_left_during_asker_grace";
  const attendancePercent = computeAttendancePercent(input.elapsedSeconds, plannedSeconds);

  const askerRated =
    input.reason === "asker_left_rated" &&
    typeof input.askerRating === "number" &&
    input.askerRating >= 1 &&
    input.askerRating <= 5;

  let feedbackRating: number;
  let feedbackComment: string;
  let ratingSource: "system_attendance" | "asker_intentional";

  if (askerRated) {
    feedbackRating = Math.round(input.askerRating!);
    ratingSource = "asker_intentional";
    const trimmed = input.askerComment?.trim();
    feedbackComment = trimmed
      ? `Asker ended session with rating: ${trimmed}`
      : "Asker ended session and rated the solver (intentional leave).";
  } else {
    const system = buildSystemSessionRating(input.reason, input.elapsedSeconds, plannedSeconds);
    feedbackRating = system.feedbackRating;
    feedbackComment = system.feedbackComment;
    ratingSource = system.ratingSource;
  }

  const now = new Date();
  const resolutionStatus = resolutionStatusForReason[input.reason];

  if (solverDoubt) {
    await SolverDoubts.findByIdAndUpdate(solverDoubt._id, {
      resolution_status: resolutionStatus,
      resolved_at: solverDoubt.resolved_at || now,
      feedback_rating: feedbackRating,
      feedback_comment: feedbackComment,
      updatedAt: now,
    });
  } else {
    await SolverDoubts.create({
      doubt_id: doubtId,
      solver_id: solverId,
      resolution_status: resolutionStatus,
      resolved_at: now,
      room_id: roomId,
      feedback_rating: feedbackRating,
      feedback_comment: feedbackComment,
      assigned_at: now,
    });
  }

  const sessionCompleted =
    askerRated || input.reason === "timer_completed";

  const doubtUpdate = sessionCompleted
    ? {
        status: "resolved" as const,
        solver_id: null,
        rating: feedbackRating,
        is_solved: true,
        updatedAt: now,
      }
    : {
        status: "open" as const,
        solver_id: null,
        rating: feedbackRating,
        is_solved: false,
        updatedAt: now,
      };

  await Doubt.findByIdAndUpdate(doubtId, doubtUpdate);

  await Room.deleteOne({ roomId });

  let walletCredited = false;
  let coins = 0;
  let balance = 0;

  if (!skipWallet) {
    const coinResult = await creditCoinsToSolver(solverId, doubtId);
    if (coinResult.success) {
      walletCredited = true;
      coins = coinResult.coins;
      balance = coinResult.balance;
    }
  }

  const subject = String((doubt as { subject?: string }).subject || "").toLowerCase();

  if (input.reason !== "timer_completed" && input.reason !== "asker_left_rated") {
    void publishSocketEvent({
      event: "doubt:available",
      room: `subject:${subject}`,
      payload: {
        doubtId: String(doubtId),
        subject: (doubt as { subject?: string }).subject,
        description: (doubt as { description?: string }).description,
        status: "open",
        reason: input.reason,
      },
    });
  }

  const askerId = String((doubt as { doubter_id?: unknown }).doubter_id || "");

  const notificationMessages: Record<SessionEndReason, { solver: string; asker: string }> = {
    solver_left: {
      solver: `Session ended. You received a ${feedbackRating}/5 rating (${attendancePercent}% attendance)${
        walletCredited ? ` and earned ${coins} coins.` : "."
      }`,
      asker: `Your solver left the session. They were rated ${feedbackRating}/5 based on ${attendancePercent}% of the scheduled session time. The doubt is open again if you need another solver.`,
    },
    asker_left_timeout: {
      solver: `The asker did not return within 3 minutes. Session closed with ${feedbackRating}/5 (${attendancePercent}% attendance)${
        walletCredited ? ` — ${coins} coins credited.` : "."
      }`,
      asker: `You left the session. The doubt has been released back to the pool.`,
    },
    asker_left_rated: {
      solver: `The asker ended the session and rated you ${feedbackRating}/5. No rejoin window.${
        walletCredited ? ` ${coins} coins credited.` : ""
      }`,
      asker: `You rated your solver ${feedbackRating}/5 and left the session.`,
    },
    timer_completed: {
      solver: `Scheduled session time ended. You received ${feedbackRating}/5 (${attendancePercent}% attendance)${
        walletCredited ? ` and earned ${coins} coins.` : "."
      }`,
      asker: `Your session time is complete. Your solver was rated ${feedbackRating}/5 based on attendance.`,
    },
    solver_left_during_asker_grace: {
      solver: `You left while waiting for the asker to rejoin. No wallet credit; session recorded as 1/5.`,
      asker: `The solver left before you could rejoin. The doubt is available again.`,
    },
  };

  const copy = notificationMessages[input.reason];
  const askerMessage = copy.asker;

  void publishSocketEvent({
    event: "session:processed",
    room: roomId,
    payload: {
      roomId,
      doubtId: String(doubtId),
      reason: input.reason,
      attendancePercent,
      feedbackRating,
      ratingSource,
      askerMessage,
      walletCredited,
    },
  });

  await Promise.allSettled([
    Notification.create({
      user_id: solverId,
      doubt_id: doubtId,
      message_type: "SOLUTION_ACCEPTED",
      content: copy.solver,
    }),
    askerId
      ? Notification.create({
          user_id: askerId,
          doubt_id: doubtId,
          message_type: "DOUBT_ASSIGNED",
          content: copy.asker,
        })
      : Promise.resolve(),
    Solver.findOneAndUpdate(
      { user_id: solverId },
      { $inc: { total_doubts_solved: skipWallet ? 0 : 1 }, updatedAt: now }
    ),
  ]);

  return {
    success: true,
    attendancePercent,
    feedbackRating,
    ratingSource,
    askerMessage,
    walletCredited,
    coins,
    balance,
  };
}
