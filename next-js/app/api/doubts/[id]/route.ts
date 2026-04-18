import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const { id } = await params;
    const body = await req.json();

    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return NextResponse.json({ success: false, message: "Doubt not found" }, { status: 404 });
    }

    // Doubter and assigned solver are allowed to update status flows.
    const assignedSolver = await SolverDoubts.findOne({ doubt_id: id }).select("solver_id");
    const isDoubter = String((doubt as any).doubter_id) === String(user.id);
    const isAssignedSolver = String((assignedSolver as any)?.solver_id || "") === String(user.id);

    if (!isDoubter && !isAssignedSolver) {
      return NextResponse.json({ success: false, message: "Not authorized to update this doubt" }, { status: 403 });
    }

    const { status, action } = body || {};

    if (action === "answer") {
      (doubt as any).status = "resolved";
      (doubt as any).is_solved = true;
      await doubt.save();
      return NextResponse.json({ success: true, data: { doubt } }, { status: 200 });
    }

    if (action === "accept-answer") {
      (doubt as any).status = "closed";
      (doubt as any).is_solved = true;
      await doubt.save();
      return NextResponse.json({ success: true, data: { doubt } }, { status: 200 });
    }

    if (typeof status === "string" && status.trim()) {
      (doubt as any).status = status.trim();
      if (status === "resolved" || status === "closed") {
        (doubt as any).is_solved = true;
      }
      await doubt.save();
      return NextResponse.json({ success: true, data: { doubt } }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: "Either 'status' or supported 'action' is required" },
      { status: 400 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const { id } = await params;

    const doubt = await Doubt.findById(id);
    if (!doubt) {
      return NextResponse.json({ success: false, message: "Doubt not found" }, { status: 404 });
    }

    if (String((doubt as any).doubter_id) !== String(user.id)) {
      return NextResponse.json({ success: false, message: "Not authorized to delete this doubt" }, { status: 403 });
    }

    await Doubt.findByIdAndDelete(id);
    await SolverDoubts.deleteMany({ doubt_id: id });

    return NextResponse.json({ success: true, message: "Doubt deleted successfully" }, { status: 200 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
