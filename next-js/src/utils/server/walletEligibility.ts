import SolverDoubts from "@/src/models/SolverDoubts";

export async function checkWithdrawalEligibility(solverId: string) {
  try {
    const completedDoubts = await SolverDoubts.countDocuments({
      solver_id: solverId,
      resolution_status: "session_completed",
      feedback_rating: { $exists: true, $ne: null },
    });

    const solvedDoubts = await SolverDoubts.find({
      solver_id: solverId,
      resolution_status: "session_completed",
      feedback_rating: { $exists: true, $ne: null },
    }).select("feedback_rating");

    let averageRating = 0;
    if (solvedDoubts.length > 0) {
      const totalRating = solvedDoubts.reduce((sum, sd) => sum + (sd.feedback_rating || 0), 0);
      averageRating = Math.round((totalRating / solvedDoubts.length) * 10) / 10;
    }

    const minDoubtsRequired = 30;
    const minRatingRequired = 3.5;
    const isEligible = completedDoubts >= minDoubtsRequired && averageRating >= minRatingRequired;

    return {
      isEligible,
      completedDoubts,
      averageRating,
      minDoubtsRequired,
      minRatingRequired,
      message: isEligible
        ? "You are eligible for withdrawal"
        : completedDoubts < minDoubtsRequired
          ? `Complete ${minDoubtsRequired - completedDoubts} more doubts to unlock withdrawal (Free trial period: ${completedDoubts}/${minDoubtsRequired})`
          : `Your average rating is ${averageRating.toFixed(1)}. You need at least ${minRatingRequired} stars to withdraw.`,
    };
  } catch (error) {
    console.error("Error checking withdrawal eligibility:", error);
    return {
      isEligible: false,
      completedDoubts: 0,
      averageRating: 0,
      minDoubtsRequired: 30,
      minRatingRequired: 3.5,
      message: "Error checking eligibility",
    };
  }
}
