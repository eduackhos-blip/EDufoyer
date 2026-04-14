import Doubt from '../../models/Doubt.js';
import Solver from '../../models/Solver.js';
import SolverDoubts from '../../models/SolverDoubts.js';
import User from '../../models/User.js';
import { RoomServiceClient } from 'livekit-server-sdk';
import { createNotification } from '../notification/createNotification.js';
import { sendEmail } from '../../utils/email.js';
import { getIO } from '../../socket.js';

async function getUserEmail(userId) {
  try {
    const userResult = await User.findById(userId).select('email');
    return userResult?.email || null;
  } catch (error) {
    console.error(`Error fetching email for user ${userId}:`, error);
    return null;
  }
}

export async function allotDoubt({ doubtId, solverId }) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  // Debug: Log environment variables
  console.log('LiveKit Debug - API Key:', apiKey ? 'SET' : 'NOT SET');
  console.log('LiveKit Debug - API Secret:', apiSecret ? 'SET' : 'NOT SET');
  console.log('LiveKit Debug - LiveKit URL:', process.env.LIVEKIT_URL);

  if (!apiKey || !apiSecret) {
    console.error("LiveKit environment variables not configured.");
    console.error("Available env vars:", Object.keys(process.env).filter(key => key.includes('LIVEKIT')));
    return {
      success: false,
      error: "Server configuration error for real-time session.",
    };
  }

  try {
    // Optimize: Parallel database queries for faster processing
    const [doubtToAssign, solverToAssign] = await Promise.all([
      Doubt.findById(doubtId).select('status solver_id subject doubter_id category is_scheduled scheduled_date scheduled_time').lean(),
      Solver.findOne({ user_id: solverId }).select('user_id specialities').lean()
    ]);

    if (!doubtToAssign) {
      throw new Error("Doubt not found.");
    }

    if (!solverToAssign) {
      throw new Error("Solver not found.");
    }

    // 2. Check if Doubt is Still 'open'
    if (doubtToAssign.status !== "open") {
      const assignedSolverId = doubtToAssign.solver_id;
      const message =
        assignedSolverId === solverId
          ? "You have already accepted this doubt."
          : "This doubt has already been assigned to another solver.";
      throw new Error(message);
    }

    // 4. Verify Solver Eligibility (optimized)
    const hasSpeciality = solverToAssign.specialities?.some(
      (spec) =>
        spec.toLowerCase() === doubtToAssign.subject?.toLowerCase()
    );
    if (!hasSpeciality && doubtToAssign.subject) {
      throw new Error(
        `Solver does not have the required speciality: ${doubtToAssign.subject}`
      );
    }

    // 5. Create LiveKit Room
    const roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL || 'https://remote-opgy8hh4.livekit.cloud',
      apiKey,
      apiSecret
    );
    const roomName = `doubt-session-${doubtId}`;
    // Set room timeout based on doubt category
    const category = doubtToAssign.category || 'medium';
    const minutes = category === 'small' ? 20 : category === 'medium' ? 30 : 60;
    const roomOptions = {
      name: roomName,
      emptyTimeout: 60, // cleanup when empty
      maxParticipants: 2,
      // LiveKit server uses other timeouts; enforce duration from app side via timer
    };

    // Optimize: Create room with timeout to prevent hanging
    let livekitRoom;
    try {
      const roomPromise = roomService.createRoom(roomOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LiveKit room creation timeout')), 10000)
      );
      
      livekitRoom = await Promise.race([roomPromise, timeoutPromise]);
      console.log(`LiveKit room '${roomName}' created successfully.`);
    } catch (lkError) {
      if (lkError.message?.includes("room already exists") || lkError.message?.includes("timeout")) {
        console.warn(`LiveKit room '${roomName}' already exists or timeout. Proceeding...`);
      } else {
        console.error(`Failed to create LiveKit room '${roomName}':`, lkError);
        throw new Error("Failed to set up the solving session room.");
      }
    }

    // Optimize: Parallel database operations for faster processing
    const [updatedDoubt, solverDoubtLink] = await Promise.all([
      Doubt.findByIdAndUpdate(
        doubtId,
        {
          status: "assigned",
          solver_id: solverToAssign.user_id,
          updatedAt: new Date(),
        },
        { new: true, select: 'status solver_id' }
      ),
      SolverDoubts.create({
        doubt_id: doubtId,
        solver_id: solverToAssign.user_id,
        resolution_status: "session_scheduled",
        assigned_at: new Date(),
        livekit_room_name: roomName,
      })
    ]);

    // Optimize: Process notifications asynchronously to not block response
    setImmediate(async () => {
      try {
        const studentId = doubtToAssign.doubter_id;
        const [studentEmail, solverEmail] = await Promise.all([
          getUserEmail(studentId),
          getUserEmail(solverId),
        ]);

        const frontendBase = (process.env.FRONTEND_URL || '').trim();
        if (!frontendBase) {
          console.warn('FRONTEND_URL is not set; email/session links will be relative.');
        }
        const base = frontendBase || '';
        const sessionUrl = `${base}/dashboard/session/${doubtId}`;
        // Use email-specific link to trigger public token flow on the frontend
        const emailSessionUrl = `${sessionUrl}?email=true`;

        // Format scheduled date/time if doubt is scheduled
        let scheduledInfo = '';
        let scheduledTextInfo = '';
        if (doubtToAssign.is_scheduled && doubtToAssign.scheduled_date) {
          const scheduledDate = new Date(doubtToAssign.scheduled_date);
          const formattedDate = scheduledDate.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const formattedTime = doubtToAssign.scheduled_time || scheduledDate.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          scheduledInfo = `<p><strong>Scheduled Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>`;
          scheduledTextInfo = `Scheduled Date & Time: ${formattedDate} at ${formattedTime}\n\n`;
        }

        // Notify Assigned Solver
        let solverNotificationContent = `You accepted doubt "${doubtToAssign.subject}". Join the session: ${sessionUrl}`;
        if (doubtToAssign.is_scheduled && doubtToAssign.scheduled_date) {
          const scheduledDate = new Date(doubtToAssign.scheduled_date);
          const formattedDate = scheduledDate.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const formattedTime = doubtToAssign.scheduled_time || scheduledDate.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          solverNotificationContent = `You accepted doubt "${doubtToAssign.subject}" scheduled for ${formattedDate} at ${formattedTime}. You'll receive the meeting link at the scheduled time.`;
        }
        await createNotification({
          userId: solverId,
          doubtId: doubtId,
          messageType: "ASSIGNED_TO_SOLVER",
          content: solverNotificationContent,
        });

        if (solverEmail) {
          await sendEmail({
            to: solverEmail,
            subject: `Solving Session Ready: ${doubtToAssign.subject}`,
            text: `You have accepted the doubt "${doubtToAssign.subject}".\n\n${scheduledTextInfo}Please join the solving session here: ${emailSessionUrl}\n\nThe student has also been notified.`,
            html: `<p>You have accepted the doubt "<strong>${doubtToAssign.subject}</strong>".</p>${scheduledInfo}<p>Please join the solving session with the student by clicking the button below:</p><p style="text-align: center; margin: 20px 0;"><a href="${emailSessionUrl}" style="background-color: #104be3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Session</a></p><p>The student has also been notified and will join the same link.</p>`,
          });
        }

    // Notify Student
    let studentNotificationContent = `Solver assigned for "${doubtToAssign.subject}". Join the session: ${sessionUrl}`;
    if (doubtToAssign.is_scheduled && doubtToAssign.scheduled_date) {
      const scheduledDate = new Date(doubtToAssign.scheduled_date);
      const formattedDate = scheduledDate.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formattedTime = doubtToAssign.scheduled_time || scheduledDate.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      studentNotificationContent = `Solver assigned for "${doubtToAssign.subject}" scheduled for ${formattedDate} at ${formattedTime}. You'll receive the meeting link at the scheduled time.`;
    }
    await createNotification({
      userId: studentId,
      doubtId: doubtId,
      messageType: "DOUBT_ASSIGNED",
      content: studentNotificationContent,
    });

    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: `Solver Ready for Your Doubt: ${doubtToAssign.subject}`,
        text: `A solver has accepted your doubt "${doubtToAssign.subject}" and is ready to help.\n\n${scheduledTextInfo}Please join the solving session here: ${emailSessionUrl}\n\nThe solver has also been notified.`,
        html: `<p>A solver has accepted your doubt "<strong>${doubtToAssign.subject}</strong>" and is ready to help.</p>${scheduledInfo}<p>Please join the solving session with the solver by clicking the button below:</p><p style="text-align: center; margin: 20px 0;"><a href="${emailSessionUrl}" style="background-color: #104be3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Session</a></p><p>The solver has also been notified and will join the same link.</p>`,
      });
    }

    // Realtime: broadcast that this doubt is now assigned so others remove it
    try {
      const io = getIO();
      io.to(`subject:${String(doubtToAssign.subject || '').toLowerCase()}`).emit('doubt:assigned', {
        doubtId: String(doubtId),
        assignedTo: String(solverId),
      });
    } catch (emitErr) {
      console.error('Socket emit error (doubt:assigned):', emitErr);
    }

    console.log(
      `Doubt ${doubtId} assigned to solver ${solverId}, LiveKit room '${roomName}' prepared, notifications enqueued.`
    );
      } catch (notificationError) {
        console.error('Error processing notifications:', notificationError);
      }
    });
    // Immediately return success, do not wait for notifications
    return { success: true, doubt: updatedDoubt };
  } catch (error) {
    console.error(
      `Error allotting doubt ${doubtId} to solver ${solverId}:`,
      error
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during assignment.";
    return { success: false, error: errorMessage };
  }
}
