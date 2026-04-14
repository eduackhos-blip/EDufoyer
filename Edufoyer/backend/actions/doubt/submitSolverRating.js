import { z } from 'zod';
import Doubt from '../../models/Doubt.js';
import SolverDoubts from '../../models/SolverDoubts.js';
import { createNotification } from '../notification/createNotification.js';

const SubmitSolverRatingSchema = z.object({
  doubtId: z.string().min(1, 'Doubt ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function submitSolverRating(formData, userId) {
  const validated = SubmitSolverRatingSchema.safeParse(formData);
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

    // Only the solver can submit rating for asker
    if (String(doubt.solver_id) !== String(userId)) {
      return { success: false, error: 'You are not authorized to rate this asker.' };
    }

    // Must have a solver assigned
    if (!doubt.solver_id) {
      return { success: false, error: 'No solver assigned for this doubt.' };
    }

    const solverDoubt = await SolverDoubts.findOne({ doubt_id: doubtId, solver_id: doubt.solver_id });
    if (!solverDoubt) {
      return { success: false, error: 'Solver doubt record not found.' };
    }

    // Update solver's rating of asker
    const now = new Date();
    await SolverDoubts.findByIdAndUpdate(
      solverDoubt._id,
      {
        solver_rating_of_asker: rating,
        solver_comment_of_asker: comment || undefined,
        updatedAt: now,
      },
      { new: true }
    );

    // Notify asker that solver has rated them
    await createNotification({
      userId: doubt.doubter_id,
      doubtId,
      messageType: 'SOLVER_RATED_ASKER',
      content: `The solver has rated your interaction. Rating: ${rating}/5`,
    });

    return { success: true, message: 'Rating submitted successfully.' };
  } catch (error) {
    console.error('Submit solver rating error:', error);
    return { success: false, error: 'Server error while submitting rating.' };
  }
}












