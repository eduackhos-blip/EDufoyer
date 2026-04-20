import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { serverEnv } from "@/src/utils/server/env";
import User from "@/src/models/User";
import { normalizeEmail, validateEmail } from "@/src/utils/server/emailValidator";

export const runtime = "nodejs";

const signToken = (userId: string) =>
  jwt.sign({ userId }, serverEnv.jwtSecret || "dev-secret", { expiresIn: "24h" });

const bad = (message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

const ok = (data: unknown, message?: string, status = 200) =>
  NextResponse.json(
    { success: true, ...(message ? { message } : {}), data },
    { status }
  );

export async function POST(req: NextRequest) {
  try {
    if (!serverEnv.mongoUri) {
      return bad(
        "MONGODB_URI is required for in-app auth APIs. Configure it in your Next environment.",
        503
      );
    }

    await connectDb();
    const { email, password } = await req.json();

    if (!email || !password) return bad("Email and password are required");

    const emailValidation = validateEmail(email) as {
      isValid: boolean;
      message: string;
    };
    if (!emailValidation.isValid) return bad(emailValidation.message);

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ $or: [{ email }, { email: normalizedEmail }] });

    if (!user) return bad("Invalid email or password", 401);
    if (!user.isActive) return bad("Account is deactivated", 401);
    if (!user.emailVerified) {
      return bad(
        "Please verify your email before logging in. Check your email for verification code.",
        401
      );
    }

    const isPasswordValid = await (
      user as unknown as { comparePassword: (pwd: string) => Promise<boolean> }
    ).comparePassword(password);

    if (!isPasswordValid) return bad("Invalid email or password", 401);

    user.lastLogin = new Date();
    await user.save();

    return ok(
      { user: user.toJSON(), token: signToken(String(user._id)) },
      "Login successful"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, message: "Server error", error: message },
      { status: 500 }
    );
  }
}
