import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import { z } from "zod";
import Doubt from "@/src/models/Doubt";
import Solver from "@/src/models/Solver";
import SolverDoubts from "@/src/models/SolverDoubts";
import Room from "@/src/models/Room";
import User from "@/src/models/User";
import Notification from "@/src/models/Notification";
import { sendEmail } from "@/src/utils/server/email";
import { publishSocketEvent } from "@/src/utils/server/socketPublisher";
import { resolveMaxSessionSeconds } from "@/src/lib/session/roomId";

export const runtime = "nodejs";

const AcceptDoubtSchema = z.object({
  doubtId: z.string().min(1, "Doubt ID is required"),
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
    // ignore
  }
}

async function getUserEmail(userId: string) {
  try {
    const userResult = await User.findById(userId).select("email");
    return (userResult as any)?.email || null;
  } catch {
    return null;
  }
}

function resolveFrontendBase(requestOrigin: string) {
  const envBase = (process.env.FRONTEND_URL || "").trim();
  if (process.env.NODE_ENV === "production" && envBase) {
    return envBase.replace(/\/+$/, "");
  }
  return requestOrigin.replace(/\/+$/, "");
}

async function allotDoubt({
  doubtId,
  solverId,
  frontendBase,
}: {
  doubtId: string;
  solverId: string;
  frontendBase: string;
}) {
  try {
    const [doubtToAssign, solverToAssign] = await Promise.all([
      Doubt.findById(doubtId)
        .select("status solver_id subject doubter_id category is_scheduled scheduled_date scheduled_time")
        .lean(),
      Solver.findOne({ user_id: solverId }).select("user_id specialities").lean(),
    ]);

    if (!doubtToAssign) throw new Error("Doubt not found.");
    if (!solverToAssign) throw new Error("Solver not found.");

    if ((doubtToAssign as any).status !== "open") {
      const assignedSolverId = (doubtToAssign as any).solver_id;
      const message =
        String(assignedSolverId) === String(solverId)
          ? "You have already accepted this doubt."
          : "This doubt has already been assigned to another solver.";
      throw new Error(message);
    }

    const hasSpeciality = (solverToAssign as any).specialities?.some(
      (spec: string) => spec.toLowerCase() === String((doubtToAssign as any).subject || "").toLowerCase()
    );
    if (!hasSpeciality && (doubtToAssign as any).subject) {
      throw new Error(`Solver does not have the required speciality: ${(doubtToAssign as any).subject}`);
    }

    const roomId = `doubt-${String(doubtId)}-solver-${String((solverToAssign as any).user_id)}`;
    const maxSessionSeconds = resolveMaxSessionSeconds(
      null,
      (doubtToAssign as { category?: string }).category
    );
    await Room.findOneAndUpdate(
      {
        doubt_id: doubtId,
        solver_id: (solverToAssign as any).user_id,
      },
      {
        $set: {
          roomId,
          doubter_id: (doubtToAssign as any).doubter_id,
          subject: String((doubtToAssign as any).subject || ""),
          status: "active",
          closedAt: null,
          hasSolverEverJoined: false,
          hasAskerEverJoined: false,
          maxSessionSeconds,
          sessionStartedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const [updatedDoubt, solverDoubtLink] = await Promise.all([
      Doubt.findByIdAndUpdate(
        doubtId,
        { status: "assigned", solver_id: (solverToAssign as any).user_id, updatedAt: new Date() },
        { new: true, select: "status solver_id" }
      ),
      SolverDoubts.findOneAndUpdate(
        { doubt_id: doubtId, solver_id: (solverToAssign as any).user_id },
        {
          $set: {
            resolution_status: "session_scheduled",
            assigned_at: new Date(),
            room_id: roomId,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);

    const studentId = String((doubtToAssign as any).doubter_id);
    const [studentEmail, solverEmail] = await Promise.all([
      getUserEmail(studentId),
      getUserEmail(solverId),
    ]);

    const sessionUrl = `${frontendBase}/dashboard/session/${roomId}`;
    const emailSessionUrl = `${sessionUrl}?email=true`;

    let scheduledInfo = "";
    let scheduledTextInfo = "";
    if ((doubtToAssign as any).is_scheduled && (doubtToAssign as any).scheduled_date) {
      const sd = new Date((doubtToAssign as any).scheduled_date);
      const formattedDate = sd.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime =
        (doubtToAssign as any).scheduled_time ||
        sd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      scheduledInfo = `<p><strong>Scheduled Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>`;
      scheduledTextInfo = `Scheduled Date & Time: ${formattedDate} at ${formattedTime}\n\n`;
    }

    let solverNotificationContent = `You accepted doubt "${(doubtToAssign as any).subject}". Join the session: ${sessionUrl}`;
    if ((doubtToAssign as any).is_scheduled && (doubtToAssign as any).scheduled_date) {
      const sd = new Date((doubtToAssign as any).scheduled_date);
      const formattedDate = sd.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime =
        (doubtToAssign as any).scheduled_time ||
        sd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      solverNotificationContent = `You accepted doubt "${(doubtToAssign as any).subject}" scheduled for ${formattedDate} at ${formattedTime}. You'll receive the meeting link at the scheduled time.`;
    }

    let studentNotificationContent = `Solver assigned for "${(doubtToAssign as any).subject}". Join the session: ${sessionUrl}`;
    if ((doubtToAssign as any).is_scheduled && (doubtToAssign as any).scheduled_date) {
      const sd = new Date((doubtToAssign as any).scheduled_date);
      const formattedDate = sd.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime =
        (doubtToAssign as any).scheduled_time ||
        sd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      studentNotificationContent = `Solver assigned for "${(doubtToAssign as any).subject}" scheduled for ${formattedDate} at ${formattedTime}. You'll receive the meeting link at the scheduled time.`;
    }

    // Do not defer critical notification writes; ensure they are persisted before response.
    await Promise.allSettled([
      createNotification({
        userId: solverId,
        doubtId,
        messageType: "ASSIGNED_TO_SOLVER",
        content: solverNotificationContent,
      }),
      createNotification({
        userId: studentId,
        doubtId,
        messageType: "DOUBT_ASSIGNED",
        content: studentNotificationContent,
      }),
    ]);

    if (solverEmail) {
      void sendEmail({
        to: solverEmail,
        subject: `Solving Session Ready: ${(doubtToAssign as any).subject}`,
        text: `You have accepted the doubt "${(doubtToAssign as any).subject}".\n\n${scheduledTextInfo}Please join the solving session here: ${emailSessionUrl}\n\nThe student has also been notified.`,
        html: `<p>You have accepted the doubt "<strong>${(doubtToAssign as any).subject}</strong>".</p>${scheduledInfo}<p>Please join the solving session with the student by clicking the button below:</p><p style="text-align: center; margin: 20px 0;"><a href="${emailSessionUrl}" style="background-color: #104be3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Session</a></p><p>The student has also been notified and will join the same link.</p>`,
      }).catch(() => undefined);
    }

    if (studentEmail) {
      void sendEmail({
        to: studentEmail,
        subject: `Solver Ready for Your Doubt: ${(doubtToAssign as any).subject}`,
        text: `A solver has accepted your doubt "${(doubtToAssign as any).subject}" and is ready to help.\n\n${scheduledTextInfo}Please join the solving session here: ${emailSessionUrl}\n\nThe solver has also been notified.`,
        html: `<p>A solver has accepted your doubt "<strong>${(doubtToAssign as any).subject}</strong>" and is ready to help.</p>${scheduledInfo}<p>Please join the solving session with the solver by clicking the button below:</p><p style="text-align: center; margin: 20px 0;"><a href="${emailSessionUrl}" style="background-color: #104be3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Session</a></p><p>The solver has also been notified and will join the same link.</p>`,
      }).catch(() => undefined);
    }

    void publishSocketEvent({
      event: "doubt:assigned",
      room: `subject:${String((doubtToAssign as any).subject || "").toLowerCase()}`,
      payload: { doubtId: String(doubtId), assignedTo: String(solverId), roomId },
    });

    return {
      success: true,
      doubt: updatedDoubt,
      solverDoubt: solverDoubtLink,
      roomId,
      doubtId: String(doubtId),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred during assignment.";
    return { success: false, error: message };
  }
}

async function acceptDoubtAssignment(formData: unknown, userId: string, frontendBase: string) {
  const validatedFields = AcceptDoubtSchema.safeParse(formData);
  if (!validatedFields.success) {
    return { success: false, error: "Invalid input data.", fieldErrors: validatedFields.error.flatten().fieldErrors };
  }
  if (!userId) {
    return { success: false, error: "Unauthorized: You must be logged in to accept a doubt." };
  }

  const { doubtId } = validatedFields.data;
  try {
    const result = await allotDoubt({ doubtId, solverId: userId, frontendBase });
    if ((result as any).success) {
      return {
        success: true,
        message: "Doubt assigned! Check your email for the session link.",
        roomId: (result as { roomId?: string }).roomId,
        doubtId,
      };
    }
    return { success: false, error: (result as any).error || "Failed to accept the doubt assignment." };
  } catch (error) {
    const safeMessage = error instanceof Error ? error.message : "Unexpected error";
    return { success: false, error: `An unexpected server error occurred. Please try again. ${safeMessage}` };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const frontendBase = resolveFrontendBase(req.nextUrl.origin);
    const result = await acceptDoubtAssignment(body, user.id, frontendBase);
    if (!result || typeof result !== "object") {
      return NextResponse.json(
        { success: false, message: "Unexpected server response while accepting doubt" },
        { status: 500 }
      );
    }
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          data: { roomId: result.roomId, doubtId: result.doubtId },
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ success: false, message: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
