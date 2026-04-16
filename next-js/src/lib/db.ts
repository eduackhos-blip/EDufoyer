import mongoose from "mongoose";
import { serverEnv } from "@/src/server/env";

declare global {
  // eslint-disable-next-line no-var
  var __mongoose_conn__: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const globalCache =
  global.__mongoose_conn__ ??
  (global.__mongoose_conn__ = {
    conn: null,
    promise: null,
  });

export const connectDb = async () => {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  if (!serverEnv.mongoUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(serverEnv.mongoUri, {
      maxPoolSize: 10,
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
};

