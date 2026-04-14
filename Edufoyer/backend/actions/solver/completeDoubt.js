import { z } from 'zod';
import Doubt from '../../models/Doubt.js';
import SolverDoubts from '../../models/SolverDoubts.js';
import Solver from '../../models/Solver.js';
import { createNotification } from '../notification/createNotification.js';
import { getIO } from '../../socket.js';

const CompleteDoubtSchema = z.object({
  doubtId: z.string().min(1, "Doubt ID is required"),
  feedback_rating: z.number().min(1).max(5).optional(),
  feedback_comment: z.string().max(1000).optional(),
});

export async function completeDoubt(formData, userId) {
  // 1. Validate Input
  const validatedFields = CompleteDoubtSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid input data.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // 2. Check Authentication
  if (!userId) {
    return {
      success: false,
      error: "Unauthorized: You must be logged in to complete a doubt.",
    };
  }

  const { doubtId, feedback_rating, feedback_comment } = validatedFields.data;

  try {
    // 3. Find the doubt and verify solver assignment
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) {
      return {
        success: false,
        error: "Doubt not found.",
      };
    }

    if (doubt.solver_id.toString() !== userId.toString()) {
      return {
        success: false,
        error: "You are not authorized to complete this doubt.",
      };
    }

    // 4. Update doubt status
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

    // 5. Update SolverDoubts record
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
      return {
        success: false,
        error: "Solver doubt record not found.",
      };
    }

    // 6. Update solver statistics
    const solver = await Solver.findOne({ user_id: userId });
    if (solver) {
      await Solver.findByIdAndUpdate(
        solver._id,
        {
          $inc: { total_doubts_solved: 1 },
          updatedAt: new Date(),
        },
        { new: true }
      );
    }

    // 7. Send notification to doubter
    await createNotification({
      userId: doubt.doubter_id,
      doubtId: doubtId,
      messageType: "DOUBT_RESOLVED",
      content: `Your doubt "${doubt.subject}" has been resolved by the solver.`,
    });

    // 8. Realtime: emit completion to solver room to refresh metrics
    try {
      const io = getIO();
      io.to(`solver:${userId}`).emit('doubt:completed', {
        doubtId: String(doubtId),
        feedbackRating: feedback_rating ?? null,
        resolvedAt: new Date().toISOString(),
      });
    } catch (emitErr) {
      console.error('Socket emit error (doubt:completed):', emitErr);
    }

    return {
      success: true,
      message: "Doubt completed successfully!",
      data: {
        doubt: updatedDoubt,
        solverDoubt: solverDoubtRecord,
      },
    };
  } catch (error) {
    console.error(
      `Error completing doubt ${doubtId} by solver ${userId}:`,
      error
    );
    return {
      success: false,
      error: `An unexpected server error occurred. Please try again. ${error.message}`,
    };
  }
}


