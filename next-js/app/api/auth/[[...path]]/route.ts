import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { serverEnv } from "@/src/server/env";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { authErrorResponse } from "@/src/server/errorResponse";
import User from "@/src/server/ported-backend/models/User.js";
import Solver from "@/src/server/ported-backend/models/Solver.js";
import { validateEmail, normalizeEmail } from "@/src/server/ported-backend/utils/emailValidator.js";
import { checkEmailWhitelist } from "@/src/server/ported-backend/utils/emailWhitelist.js";
import { verifyEmail, sendVerificationEmail, generateVerificationCode } from "@/src/server/ported-backend/utils/emailVerification.js";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

const getPath = async (ctx: Ctx) => (await Promise.resolve(ctx.params)).path ?? [];
const signToken = (userId: string) => jwt.sign({ userId }, serverEnv.jwtSecret || "dev-secret", { expiresIn: "24h" });

const bad = (message: string, status = 400, extra?: Record<string, unknown>) =>
  NextResponse.json({ success: false, message, ...(extra || {}) }, { status });

const ok = (data: unknown, message?: string, status = 200) =>
  NextResponse.json({ success: true, ...(message ? { message } : {}), data }, { status });

async function handleRegister(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return bad("Name, email and password are required");
  const emailValidation = validateEmail(email) as { isValid: boolean; message: string };
  if (!emailValidation.isValid) return bad(emailValidation.message);
  const whitelist = checkEmailWhitelist(email) as { isApproved: boolean; message: string };
  if (!whitelist.isApproved) return bad(whitelist.message, 403);
  const emailCheck = (await verifyEmail(email)) as { isValid: boolean; message: string };
  if (!emailCheck.isValid) return bad(emailCheck.message);
  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ $or: [{ email }, { email: normalizedEmail }] });
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
  const emailResult = (await sendVerificationEmail(normalizedEmail, verificationCode)) as { success: boolean };
  if (!emailResult.success) {
    await User.findByIdAndDelete(user._id);
    return bad("Failed to send verification email. Please check if your email address is correct and try again.", 500);
  }
  return ok(
    { user: { id: user._id, name: user.name, email: user.email, emailVerified: user.emailVerified }, verificationRequired: true },
    "Registration successful. Please check your email for verification code.",
    201
  );
}

async function handleLogin(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return bad("Email and password are required");
  const emailValidation = validateEmail(email) as { isValid: boolean; message: string };
  if (!emailValidation.isValid) return bad(emailValidation.message);
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ $or: [{ email }, { email: normalizedEmail }] });
  if (!user) return bad("Invalid email or password", 401);
  if (!user.isActive) return bad("Account is deactivated", 401);
  if (!user.emailVerified) return bad("Please verify your email before logging in. Check your email for verification code.", 401);
  const isPasswordValid = await (user as unknown as { comparePassword: (pwd: string) => Promise<boolean> }).comparePassword(password);
  if (!isPasswordValid) return bad("Invalid email or password", 401);
  user.lastLogin = new Date();
  await user.save();
  return ok({ user: user.toJSON(), token: signToken(String(user._id)) }, "Login successful");
}

async function handleGetProfile(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  return ok({ user: typeof user.toJSON === "function" ? user.toJSON() : user });
}

async function handleUpdateProfile(req: NextRequest) {
  const current = await getAuthenticatedUser(req);
  const { name, email, username, avatarUrl, coverImageUrl, bio } = await req.json();
  const updateData: Record<string, unknown> = {};
  const unsetData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: current._id } });
    if (existingUser) return bad("Email is already taken by another user", 409);
    updateData.email = email;
  }
  if (username !== undefined) {
    if (username === null || username === "") unsetData.username = "";
    else {
      const normalized = String(username).replace(/^@/, "").trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(normalized)) return bad("Username must be 3–30 characters (lowercase letters, numbers, underscore only)");
      const taken = await User.findOne({ username: normalized, _id: { $ne: current._id } });
      if (taken) return bad("Username is already taken", 409);
      updateData.username = normalized;
    }
  }
  if (avatarUrl !== undefined) avatarUrl ? (updateData.avatarUrl = avatarUrl) : (unsetData.avatarUrl = "");
  if (coverImageUrl !== undefined) coverImageUrl ? (updateData.coverImageUrl = coverImageUrl) : (unsetData.coverImageUrl = "");
  if (bio !== undefined) bio ? (updateData.bio = String(bio).trim()) : (unsetData.bio = "");

  const mongoUpdate: Record<string, unknown> = {};
  if (Object.keys(updateData).length) mongoUpdate.$set = updateData;
  if (Object.keys(unsetData).length) mongoUpdate.$unset = unsetData;
  const updatedUser = Object.keys(mongoUpdate).length
    ? await User.findByIdAndUpdate(current._id, mongoUpdate, { new: true, runValidators: true }).select("-password")
    : await User.findById(current._id).select("-password");
  return ok({ user: updatedUser && typeof updatedUser.toJSON === "function" ? updatedUser.toJSON() : updatedUser }, "Profile updated successfully");
}

async function handleChangePassword(req: NextRequest) {
  const current = await getAuthenticatedUser(req);
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return bad("Current and new password are required");
  const user = await User.findById(current._id);
  if (!user) return bad("User not found", 404);
  const match = await (user as unknown as { comparePassword: (pwd: string) => Promise<boolean> }).comparePassword(currentPassword);
  if (!match) return bad("Current password is incorrect", 401);
  user.password = newPassword;
  await user.save();
  const safe = await User.findById(current._id).select("-password");
  return ok({ user: safe }, "Password updated successfully");
}

async function handleLogout(req: NextRequest) {
  await getAuthenticatedUser(req);
  return NextResponse.json({ success: true, message: "Logout successful" }, { status: 200 });
}

async function handleForgotPassword(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return bad("Email is required");
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ $or: [{ email }, { email: normalizedEmail }] });
  if (!user) return NextResponse.json({ success: true, message: "If an account with that email exists, an OTP has been sent to your email." }, { status: 200 });
  const resetOTP = generateVerificationCode();
  user.passwordResetToken = resetOTP;
  user.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await (sendVerificationEmail(user.email, resetOTP) as Promise<unknown>);
  return NextResponse.json({ success: true, message: "If an account with that email exists, an OTP has been sent to your email." }, { status: 200 });
}

async function handleVerifyResetOtp(req: NextRequest) {
  const { email, otp } = await req.json();
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ $or: [{ email }, { email: normalizedEmail }] });
  if (!user) return bad("User not found", 404);
  if (!user.passwordResetToken || !user.passwordResetExpiry) return bad("No password reset request found. Please request a new OTP.");
  if (new Date() > user.passwordResetExpiry) return bad("OTP has expired. Please request a new OTP.");
  if (user.passwordResetToken !== otp) return bad("Invalid OTP. Please check and try again.");
  return NextResponse.json({ success: true, message: "OTP verified successfully", email: user.email }, { status: 200 });
}

async function handleResetPassword(req: NextRequest) {
  const { email, otp, password } = await req.json();
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ $or: [{ email }, { email: normalizedEmail }] });
  if (!user) return bad("User not found", 404);
  if (!user.passwordResetToken || !user.passwordResetExpiry) return bad("No password reset request found. Please request a new OTP.");
  if (new Date() > user.passwordResetExpiry) return bad("OTP has expired. Please request a new OTP.");
  if (user.passwordResetToken !== otp) return bad("Invalid OTP. Please check and try again.");
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpiry = null;
  await user.save();
  return NextResponse.json({ success: true, message: "Password reset successfully. You can now login with your new password." }, { status: 200 });
}

async function handleAdminOnboardSolver(req: NextRequest) {
  const current = await getAuthenticatedUser(req);
  if (current.role !== "admin") return bad("Admin privileges required", 403);
  const { email, name, specialities, experience = "beginner", bio = "" } = await req.json();
  if (!email || !name || !Array.isArray(specialities) || specialities.length === 0) return bad("Invalid input", 400);
  const existingUser = await User.findOne({ email });
  if (existingUser) return bad("User with this email already exists", 409);
  const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  const user = new User({ name, email, password: tempPassword, role: "user", isSolver: true, isActive: true, emailVerified: true });
  await user.save();
  const solver = new Solver({ user_id: user._id, specialities, experience, bio });
  await solver.save();
  return ok(
    { user: { id: user._id, name: user.name, email: user.email, isSolver: user.isSolver }, solver: { id: solver._id, specialities: solver.specialities, experience: solver.experience }, emailSent: false },
    "Solver onboarded successfully",
    201
  );
}

const run = async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDb();
    const path = await getPath(ctx);
    const key = path.join("/");
    if (req.method === "POST" && key === "register") return handleRegister(req);
    if (req.method === "POST" && key === "login") return handleLogin(req);
    if (req.method === "GET" && key === "profile") return handleGetProfile(req);
    if (req.method === "PUT" && key === "profile") return handleUpdateProfile(req);
    if (req.method === "POST" && key === "change-password") return handleChangePassword(req);
    if (req.method === "POST" && key === "logout") return handleLogout(req);
    if (req.method === "POST" && key === "forgot-password") return handleForgotPassword(req);
    if (req.method === "POST" && key === "verify-reset-otp") return handleVerifyResetOtp(req);
    if (req.method === "POST" && key === "reset-password") return handleResetPassword(req);
    if (req.method === "POST" && key === "admin/onboard-solver") return handleAdminOnboardSolver(req);
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
};

export const GET = run;
export const POST = run;
export const PUT = run;
export const PATCH = run;
export const DELETE = run;
export const OPTIONS = run;
