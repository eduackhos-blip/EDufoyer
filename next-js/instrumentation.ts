/**
 * Warm MongoDB on server start and avoid noisy dev crashes when the browser
 * navigates away from a slow in-flight API request (ECONNRESET / aborted).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { connectDb } = await import("@/src/lib/db");
  connectDb().catch(() => undefined);

  if (process.env.NODE_ENV === "development") {
    process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
      if (err.code === "ECONNRESET" || err.message === "aborted") return;
      console.error("[uncaughtException]", err);
    });
  }
}
