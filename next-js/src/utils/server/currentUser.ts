import { NextRequest } from "next/server";
import { requireAuthFromHeaders } from "@/src/utils/server/auth";
import User from "@/src/models/User";

export const getAuthenticatedUser = async (req: NextRequest) => {
  const authorization = req.headers.get("authorization");
  const payload = requireAuthFromHeaders(authorization);
  const userId = String(payload.userId || payload.id || "");

  if (!userId) {
    throw new Error("Invalid token");
  }

  const user = await User.findById(userId).select("-password");
  if (!user || !user.isActive) {
    throw new Error("Invalid or inactive user");
  }

  return user;
};

/** Stable Mongo user id for wallet, withdrawals, and other user-scoped queries. */
export const getAuthUserId = (user: { _id?: unknown; id?: string }) =>
  String(user._id ?? user.id ?? "");

