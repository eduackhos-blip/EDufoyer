import Doubt from '../../models/Doubt.js';
import SolverDoubts from '../../models/SolverDoubts.js';
import Solver from '../../models/Solver.js';

export async function getDoubtById(doubtId) {
  try {
    // Fetch the base doubt
    const doubtData = await Doubt.findById(doubtId);

    if (!doubtData) {
      return {
        success: false,
        doubt: null,
        error: "Doubt not found.",
      };
    }

    // Fetch related solver and solver doubt data
    let solverData = null;
    let solverDoubtData = null;

    // If doubt has a solver_id or status indicates it's been assigned
    if (
      doubtData.status === "assigned" ||
      doubtData.status === "resolved" ||
      doubtData.status === "closed"
    ) {
      // Get assigned solver details
      const solverDoubtResult = await SolverDoubts.findOne({
        doubt_id: doubtId
      });

      if (solverDoubtResult) {
        solverDoubtData = solverDoubtResult;

        if (solverDoubtData.solver_id) {
          const solverResult = await Solver.findOne({
            user_id: solverDoubtData.solver_id
          });

          if (solverResult) {
            solverData = solverResult;
          }
        }
      }
    }

    return {
      success: true,
      doubt: {
        ...doubtData.toObject(),
        solver: solverData,
        solverDoubt: solverDoubtData,
      },
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error fetching doubt:", err);
    return {
      success: false,
      doubt: null,
      error: "An unexpected error occurred.",
    };
  }
}
