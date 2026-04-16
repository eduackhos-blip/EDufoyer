import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { z } from "zod";
import SolverDoubts from "@/src/models/SolverDoubts";

export const runtime = "nodejs";

const GetSolvedDoubtsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
});

async function getSolvedDoubts(formData: unknown, userId: string) {
  const validatedFields = GetSolvedDoubtsSchema.safeParse(formData);
  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid input data.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized: You must be logged in to view solved doubts.",
    };
  }

  const { page, limit } = validatedFields.data;
  const skip = (page - 1) * limit;

  try {
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

    const totalCount = await SolverDoubts.countDocuments({
      solver_id: userId,
      resolution_status: "session_completed",
    });

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
    const message = error instanceof Error ? error.message : "Unexpected error";
    return {
      success: false,
      error: `An unexpected server error occurred. Please try again. ${message}`,
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const page = Number(req.nextUrl.searchParams.get("page") || "1");
    const limit = Number(req.nextUrl.searchParams.get("limit") || "10");
    const result = await getSolvedDoubts({ page, limit }, user.id);
    if (result.success) return NextResponse.json({ success: true, data: result.data }, { status: 200 });
    return NextResponse.json({ success: false, message: result.error, fieldErrors: result.fieldErrors }, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
