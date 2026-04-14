import { connectDb } from "@/src/server/db";
import { ok } from "@/src/server/http";

export const runtime = "nodejs";

export async function GET() {
  let db = "disconnected";
  try {
    await connectDb();
    db = "connected";
  } catch {
    db = "disconnected";
  }

  return ok({
    success: true,
    service: "next-api",
    db,
    timestamp: new Date().toISOString(),
  });
}
