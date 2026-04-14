import { z } from 'zod';
import Doubt from '../../models/Doubt.js';
import SolverDoubts from '../../models/SolverDoubts.js';
import { createNotification } from '../notification/createNotification.js';
import Solver from '../../models/Solver.js';
import { getIO } from '../../socket.js';
import { creditCoinsToSolver } from '../wallet/creditCoins.js';

const SubmitFeedbackSchema = z.object({
  doubtId: z.string().min(1, 'Doubt ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function submitFeedback(formData, userId) {
  const validated = SubmitFeedbackSchema.safeParse(formData);
  if (!validated.success) {
    return { success: false, error: 'Invalid input data.', fieldErrors: validated.error.flatten().fieldErrors };
  }
  if (!userId) {
    return { success: false, error: 'Unauthorized: You must be logged in.' };
  }

  const { doubtId, rating, comment } = validated.data;

  try {
    const doubt = await Doubt.findById(doubtId);
    if (!doubt) return { success: false, error: 'Doubt not found.' };

    // Only the student (doubter) can submit feedback
    if (String(doubt.doubter_id) !== String(userId)) {
      return { success: false, error: 'You are not authorized to rate this doubt.' };
    }

    // Must have a solver and session completed record
    if (!doubt.solver_id) {
      return { success: false, error: 'No solver assigned for this doubt.' };
    }

    const solverDoubt = await SolverDoubts.findOne({ doubt_id: doubtId, solver_id: doubt.solver_id });
    const isAlreadyCompleted = solverDoubt && solverDoubt.resolution_status === 'session_completed';

    // Mark session completed if not already, and update ratings
    const now = new Date();
    await Doubt.findByIdAndUpdate(
      doubtId,
      { status: 'resolved', is_solved: true, rating, updatedAt: now },
      { new: true }
    );
    if (solverDoubt) {
      await SolverDoubts.findByIdAndUpdate(
        solverDoubt._id,
        {
          resolution_status: 'session_completed',
          resolved_at: solverDoubt.resolved_at || now,
          feedback_rating: rating,
          feedback_comment: comment || undefined,
          updatedAt: now,
        },
        { new: true }
      );
    }

    // Increment solver stats only once on first completion
    let coinInfo = null;
    if (!isAlreadyCompleted) {
      const solver = await Solver.findOne({ user_id: doubt.solver_id });
      if (solver) {
        await Solver.findByIdAndUpdate(
          solver._id,
          { $inc: { total_doubts_solved: 1 }, updatedAt: now },
          { new: true }
        );
      }

      // Credit coins to solver's wallet based on average rating
      coinInfo = await creditCoinsToSolver(doubt.solver_id, doubtId);
      if (coinInfo.success) {
        console.log(`Credited ${coinInfo.coins} coins to solver ${doubt.solver_id}. New balance: ${coinInfo.balance}`);
      }
    }

    // Notify solver
    const notificationContent = coinInfo?.success 
      ? `Your solution has been rated. You earned ${coinInfo.coins} coins! (Balance: ${coinInfo.balance} coins)`
      : 'Your solution has been rated by the student.';
    
    await createNotification({
      userId: doubt.solver_id,
      doubtId,
      messageType: 'SOLUTION_ACCEPTED',
      content: notificationContent,
    });

    // Emit realtime update so dashboard refreshes metrics
    try {
      const io = getIO();
      io.to(`solver:${doubt.solver_id}`).emit('doubt:rated', {
        doubtId: String(doubtId),
        rating,
      });
    } catch {}

    return { success: true, message: 'Feedback submitted successfully.' };
  } catch (error) {
    console.error('Submit feedback error:', error);
    return { success: false, error: 'Server error while submitting feedback.' };
  }
}


