import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { createDoubt } from "@/src/server/ported-backend/controllers/doubt/createDoubt.js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = (await createDoubt(body, user.id)) as Record<string, unknown>;

    if (result.success) {
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    const response: Record<string, unknown> = {
      success: false,
      error: result.error,
      message: result.message || result.error,
    };
    if (result.fieldErrors) response.fieldErrors = result.fieldErrors;
    if (result.validationDetails) response.validationDetails = result.validationDetails;
    if (result.quotaDetails) response.quotaDetails = result.quotaDetails;
    return NextResponse.json(response, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
