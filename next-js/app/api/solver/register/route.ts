import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import Solver from "@/src/models/Solver";
import User from "@/src/models/User";
import cache from "@/src/utils/server/cache";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const { name, email, subjects, experience, bio } = body ?? {};

    if (!name || !email || !subjects || subjects.length === 0) {
      return NextResponse.json(
        { success: false, message: "Name, email, and at least one subject are required" },
        { status: 400 }
      );
    }
    const existingSolver = await Solver.findOne({ user_id: user.id });
    if (existingSolver) {
      return NextResponse.json({ success: false, message: "You are already registered as a solver" }, { status: 400 });
    }

    const newSolver = new Solver({
      user_id: user.id,
      specialities: subjects.map((s: string) => s.toLowerCase()),
      experience: experience || "beginner",
      bio: bio || "",
      isActive: true,
    });
    await newSolver.save();
    await User.findByIdAndUpdate(user.id, { name, email, isSolver: true });
    cache.delete(`solver:${user.id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Successfully registered as solver",
        data: { solverId: newSolver._id, specialities: newSolver.specialities },
      },
      { status: 201 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error during registration", error: message }, { status: 500 });
  }
}
