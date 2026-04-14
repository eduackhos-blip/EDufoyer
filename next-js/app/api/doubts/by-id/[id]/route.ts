import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import { getDoubtById } from "@/src/server/ported-backend/controllers/doubt/getDoubtById.js";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDb();
    await getAuthenticatedUser(req);
    const { id } = await params;
    const result = await getDoubtById(id);
    if (result.success) return NextResponse.json({ success: true, data: result }, { status: 200 });
    return NextResponse.json({ success: false, message: result.error }, { status: 404 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
