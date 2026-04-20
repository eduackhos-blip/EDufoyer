import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { serverEnv } from "@/src/utils/server/env";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import User from "@/src/models/User";

export const runtime = "nodejs";

const bad = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

const ok = (data: unknown, message?: string, status = 200) =>
  NextResponse.json(
    { success: true, ...(message ? { message } : {}), data },
    { status }
  );

export async function GET(req: NextRequest) {
  try {
    if (!serverEnv.mongoUri) {
      return bad(
        "MONGODB_URI is required for in-app auth APIs. Configure it in your Next environment.",
        503
      );
    }

    await connectDb();
    const user = await getAuthenticatedUser(req);
    return ok({ user: typeof user.toJSON === "function" ? user.toJSON() : user });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, message: "Server error", error: message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!serverEnv.mongoUri) {
      return bad(
        "MONGODB_URI is required for in-app auth APIs. Configure it in your Next environment.",
        503
      );
    }

    await connectDb();
    const current = await getAuthenticatedUser(req);

    let body: {
      name?: string;
      email?: string;
      username?: string | null;
      avatarUrl?: string;
      coverImageUrl?: string;
      bio?: string;
    };
    try {
      body = await req.json();
    } catch {
      return bad(
        "Could not read profile data. The request may be too large (try smaller images) or the body was truncated.",
        413
      );
    }

    const { name, email, username, avatarUrl, coverImageUrl, bio } = body;
    const updateData: Record<string, unknown> = {};
    const unsetData: Record<string, string> = {};

    if (name) updateData.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: current._id } });
      if (existingUser) return bad("Email is already taken by another user", 409);
      updateData.email = email;
    }

    if (username !== undefined) {
      if (username === null || username === "") {
        unsetData.username = "";
      } else {
        const normalized = String(username).replace(/^@/, "").trim().toLowerCase();
        if (!/^[a-z0-9_]{3,30}$/.test(normalized)) {
          return bad(
            "Username must be 3–30 characters (lowercase letters, numbers, underscore only)"
          );
        }
        const taken = await User.findOne({
          username: normalized,
          _id: { $ne: current._id },
        });
        if (taken) return bad("Username is already taken", 409);
        updateData.username = normalized;
      }
    }

    if (avatarUrl !== undefined) {
      avatarUrl ? (updateData.avatarUrl = avatarUrl) : (unsetData.avatarUrl = "");
    }
    if (coverImageUrl !== undefined) {
      coverImageUrl
        ? (updateData.coverImageUrl = coverImageUrl)
        : (unsetData.coverImageUrl = "");
    }
    if (bio !== undefined) {
      bio ? (updateData.bio = String(bio).trim()) : (unsetData.bio = "");
    }

    const mongoUpdate: Record<string, unknown> = {};
    if (Object.keys(updateData).length) mongoUpdate.$set = updateData;
    if (Object.keys(unsetData).length) mongoUpdate.$unset = unsetData;

    const updatedUser = Object.keys(mongoUpdate).length
      ? await User.findByIdAndUpdate(current._id, mongoUpdate, {
          new: true,
          runValidators: true,
        }).select("-password")
      : await User.findById(current._id).select("-password");

    return ok(
      {
        user:
          updatedUser && typeof updatedUser.toJSON === "function"
            ? updatedUser.toJSON()
            : updatedUser,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, message: "Server error", error: message },
      { status: 500 }
    );
  }
}
