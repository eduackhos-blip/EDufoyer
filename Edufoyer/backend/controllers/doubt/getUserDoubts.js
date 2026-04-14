import Doubt from '../../models/Doubt.js';
import SolverDoubts from '../../models/SolverDoubts.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';

export async function getUserDoubts(userId, page = 1, limit = 20) {
  if (!userId) {
    console.error("getUserDoubts: Unauthorized access attempt.");
    return { success: false, error: "Unauthorized", doubts: [] };
  }

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Doubt.countDocuments({ doubter_id: userId });

    // Aggregate so we can include:
    // - solver profile (name + avatarUrl)
    // - solver "answer" text (stored as SolverDoubts.feedback_comment)
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userDoubts = await Doubt.aggregate([
      { $match: { doubter_id: userObjectId } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },

      // Join solver profile
      {
        $lookup: {
          from: User.collection.name,
          localField: 'solver_id',
          foreignField: '_id',
          as: 'solver'
        }
      },
      { $unwind: { path: '$solver', preserveNullAndEmptyArrays: true } },

      // Join solver-doubt record (holds feedback_comment / rating)
      {
        $lookup: {
          from: SolverDoubts.collection.name,
          let: { doubtId: '$_id', solverId: '$solver_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$doubt_id', '$$doubtId'] },
                    { $eq: ['$solver_id', '$$solverId'] }
                  ]
                }
              }
            },
            {
              $project: {
                resolved_at: 1,
                resolution_status: 1,
                feedback_comment: 1,
                feedback_rating: 1
              }
            }
          ],
          as: 'solverDoubt'
        }
      },
      { $unwind: { path: '$solverDoubt', preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          subject: 1,
          description: 1,
          image: 1,
          status: 1,
          is_solved: 1,
          rating: 1,
          category: 1,
          createdAt: 1,
          solver: {
            name: '$solver.name',
            avatarUrl: '$solver.avatarUrl'
          },
          solverDoubt: 1
        }
      }
    ]);

    return { 
      success: true, 
      doubts: userDoubts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalDoubts: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    };

  } catch (error) {
    // Only log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`Database Error fetching doubts for user ${userId}:`, error);
    }
    return {
      success: false,
      error: "Database Error: Failed to fetch doubts.",
      doubts: [],
    };
  }
}
