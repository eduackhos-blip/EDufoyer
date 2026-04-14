import { z } from 'zod';
import { allotDoubt } from './allotDoubt.js';

const AcceptDoubtSchema = z.object({
  doubtId: z.string().min(1, "Doubt ID is required"),
});

export async function acceptDoubtAssignment(formData, userId) {
  // 1. Validate Input
  const validatedFields = AcceptDoubtSchema.safeParse(formData);
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
      error: "Unauthorized: You must be logged in to accept a doubt.",
    };
  }

  const { doubtId } = validatedFields.data;

  try {
    // 3. Call the modified allotDoubt function with current user's ID
    const result = await allotDoubt({
      doubtId: doubtId,
      solverId: userId, // The logged-in user is the one accepting
    });

    // 4. Handle the result from allotDoubt
    if (result.success) {
      return {
        success: true,
        message: "Doubt assigned! Check your email for the session link.",
      };
    } else {
      return {
        success: false,
        error: result.error || "Failed to accept the doubt assignment.",
      };
    }
  } catch (error) {
    console.error(
      `Unexpected error in acceptDoubtAssignment for doubt ${doubtId} by user ${userId}:`,
      error
    );
    const safeMessage = (error && error.message) ? error.message : 'Unexpected error';
    return {
      success: false,
      error: `An unexpected server error occurred. Please try again. ${safeMessage}`,
    };
  }
}
