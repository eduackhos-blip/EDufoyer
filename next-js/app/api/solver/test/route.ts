import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({ success: true, message: "Solver routes are working" }, { status: 200 });
}
