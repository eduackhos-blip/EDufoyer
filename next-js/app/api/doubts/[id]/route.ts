import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import Doubt from "@/src/models/Doubt";
import SolverDoubts from "@/src/models/SolverDoubts";
import Solver from "@/src/models/Solver";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

async function getDoubtById(doubtId: string) {
  try {
    const doubtData = await Doubt.findById(doubtId);
    if (!doubtData) {
      return { success: false, doubt: null, error: "Doubt not found." };
    }

    let solverData: unknown = null;
    let solverDoubtData: unknown = null;

    if (
      (doubtData as any).status === "assigned" ||
      (doubtData as any).status === "resolved" ||
      (doubtData as any).status === "closed"
    ) {
      const solverDoubtResult = await SolverDoubts.findOne({ doubt_id: doubtId });
      if (solverDoubtResult) {
        solverDoubtData = solverDoubtResult;
        if ((solverDoubtResult as any).solver_id) {
          const solverResult = await Solver.findOne({ user_id: (solverDoubtResult as any).solver_id });
          if (solverResult) solverData = solverResult;
        }
      }
    }

    return {
      success: true,
      doubt: {
        ...(doubtData as any).toObject(),
        solver: solverData,
        solverDoubt: solverDoubtData,
      },
      error: null,
    };
  } catch {
    return { success: false, doubt: null, error: "An unexpected error occurred." };
  }
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    await getAuthenticatedUser(req);
    const { id } = await params;
    const result = await getDoubtById(id);
    if (result.success) return NextResponse.json({ success: true, data: result.doubt }, { status: 200 });
    return NextResponse.json({ success: false, message: result.error }, { status: 404 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
