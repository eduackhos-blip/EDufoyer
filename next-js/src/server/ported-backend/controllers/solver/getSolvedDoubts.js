import { z } from 'zod';
import SolverDoubts from '../../models/SolverDoubts.js';
import Doubt from '../../models/Doubt.js';
import User from '../../models/User.js';

const GetSolvedDoubtsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
});

export async function getSolvedDoubts(formData, userId) {
  // 1. Validate Input
  const validatedFields = GetSolvedDoubtsSchema.safeParse(formData);
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
      error: "Unauthorized: You must be logged in to view solved doubts.",
    };
  }

  const { page, limit } = validatedFields.data;
  const skip = (page - 1) * limit;

  try {
    // 3. Get solved doubts with pagination
    const solvedDoubts = await SolverDoubts.find({
      solver_id: userId,
      resolution_status: "session_completed",
    })
      .populate({
        path: "doubt_id",
        select: "subject description status rating createdAt",
        populate: {
          path: "doubter_id",
          select: "name email",
        },
      })
      .sort({ resolved_at: -1 })
      .skip(skip)
      .limit(limit);

    // 4. Get total count for pagination
    const totalCount = await SolverDoubts.countDocuments({
      solver_id: userId,
      resolution_status: "session_completed",
    });

    // 5. Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      data: {
        solvedDoubts,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      },
    };
  } catch (error) {
    console.error(
      `Error fetching solved doubts for solver ${userId}:`,
      error
    );
    return {
      success: false,
      error: `An unexpected server error occurred. Please try again. ${error.message}`,
    };
  }
}




