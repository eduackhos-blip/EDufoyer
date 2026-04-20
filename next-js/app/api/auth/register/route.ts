import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { serverEnv } from "@/src/utils/server/env";
import User from "@/src/models/User";
import { publishSocketEvent } from "@/src/utils/server/socketPublisher";
import { normalizeEmail, validateEmail } from "@/src/utils/server/emailValidator";
import { checkEmailWhitelist } from "@/src/utils/server/emailWhitelist";
import {
  verifyEmail,
  sendVerificationEmail,
  generateVerificationCode,
} from "@/src/utils/server/emailVerification";

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
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return bad("Name, email and password are required");
    }

    const emailValidation = validateEmail(email) as {
      isValid: boolean;
      message: string;
    };
    if (!emailValidation.isValid) return bad(emailValidation.message);

    const whitelist = checkEmailWhitelist(email) as {
      isApproved: boolean;
      message: string;
    };
    if (!whitelist.isApproved) return bad(whitelist.message, 403);

    const emailCheck = (await verifyEmail(email)) as {
      isValid: boolean;
      message: string;
    };
    if (!emailCheck.isValid) return bad(emailCheck.message);

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({
      $or: [{ email }, { email: normalizedEmail }],
    });
    if (existing) return bad("User with this email already exists", 409);

    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = new User({
      name,
      email: normalizedEmail,
      password,
      emailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpiry: verificationExpiry,
    });
    await user.save();

    if (normalizedEmail.toLowerCase().endsWith("@kiit.ac.in")) {
      void publishSocketEvent({
        event: "user:registered",
        payload: {
          userId: String(user._id),
          email: user.email,
        },
      });
    }

    const emailResult = (await sendVerificationEmail(
      normalizedEmail,
      verificationCode
    )) as { success: boolean };

    if (!emailResult.success) {
      if (process.env.NODE_ENV === "production") {
        await User.findByIdAndDelete(user._id);
        return bad(
          "Failed to send verification email. Please check if your email address is correct and try again.",
          500
        );
      }

      user.emailVerified = true;
      user.emailVerificationCode = null;
      user.emailVerificationExpiry = null;
      await user.save();

      return ok(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
          },
          token: signToken(String(user._id)),
          verificationRequired: false,
        },
        "Registration successful (dev fallback: verification email unavailable).",
        201
      );
    }

    return ok(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        verificationRequired: true,
      },
      "Registration successful. Please check your email for verification code.",
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, message: "Server error", error: message },
      { status: 500 }
    );
  }
}
