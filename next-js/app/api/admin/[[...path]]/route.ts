import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import { generateVerificationCode, sendVerificationEmail } from "@/src/server/utils/emailVerification.js";
import Solver from "@/src/models/Solver";
import User from "@/src/models/User";
import DoubtPack from "@/src/models/DoubtPack";
import SolverRequest from "@/src/models/SolverRequest";
import Notification from "@/src/models/Notification";
import DoubtPackPurchase from "@/src/models/DoubtPackPurchase";
import RatingFeedback from "@/src/models/RatingFeedback";
import WithdrawalRequest from "@/src/models/WithdrawalRequest";
import Wallet from "@/src/models/Wallet";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

const adminOTPStore = new Map<string, { otp: string; expiry: number; attempts: number }>();
const OTP_EXPIRY_TIME = 10 * 60 * 1000;

const getPath = async (ctx: Ctx) => (await Promise.resolve(ctx.params)).path ?? [];
const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const parseBool = (v: string | null) => (v === null ? undefined : v === "true");

const getAdminActor = async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  if (token?.startsWith("admin-token")) {
    return { _id: "hardcoded-admin-id", id: "hardcoded-admin-id", role: "admin", email: "eduackhos@gmail.com" };
  }
  const user = await getAuthenticatedUser(req);
  if (user.role !== "admin") throw new Error("Admin privileges required");
  return user;
};

const run = async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDb();
    const path = await getPath(ctx);
    const key = path.join("/");
    const method = req.method.toUpperCase();

    if (method === "POST" && key === "send-otp") {
      const { email, password } = await req.json();
      if (!email || !password) return json({ success: false, message: "Email and password are required" }, 400);
      if (email !== "eduackhos@gmail.com" || password !== "123456") {
        return json({ success: false, message: "Invalid admin credentials" }, 401);
      }
      const otp = generateVerificationCode();
      adminOTPStore.set(email, { otp, expiry: Date.now() + OTP_EXPIRY_TIME, attempts: 0 });
      const emailResult = (await sendVerificationEmail(email, otp)) as { success: boolean };
      if (!emailResult.success) return json({ success: false, message: "Failed to send OTP email. Please try again." }, 500);
      return json({ success: true, message: "OTP sent successfully to your email" });
    }

    if (method === "POST" && key === "verify-otp") {
      const { email, otp } = await req.json();
      if (!email || !otp) return json({ success: false, message: "Email and OTP are required" }, 400);
      const storedData = adminOTPStore.get(email);
      if (!storedData) return json({ success: false, message: "OTP not found. Please request a new OTP." }, 400);
      if (Date.now() > storedData.expiry) {
        adminOTPStore.delete(email);
        return json({ success: false, message: "OTP has expired. Please request a new one." }, 400);
      }
      if (storedData.attempts >= 5) {
        adminOTPStore.delete(email);
        return json({ success: false, message: "Too many failed attempts. Please request a new OTP." }, 400);
      }
      if (storedData.otp !== otp) {
        storedData.attempts += 1;
        return json({ success: false, message: "Invalid OTP" }, 400);
      }
      adminOTPStore.delete(email);
      return json({ success: true, message: "OTP verified successfully" });
    }

    if (method === "POST" && key === "university/send-otp") {
      const { email, password } = await req.json();
      if (!email || !password) return json({ success: false, message: "Email and password are required" }, 400);
      if (email !== "2105834@kiit.ac.in" || password !== "123456") {
        return json({ success: false, message: "Invalid university admin credentials" }, 401);
      }
      const otp = generateVerificationCode();
      adminOTPStore.set(email, { otp, expiry: Date.now() + OTP_EXPIRY_TIME, attempts: 0 });
      const emailResult = (await sendVerificationEmail(email, otp)) as { success: boolean };
      if (!emailResult.success) return json({ success: false, message: "Failed to send OTP email. Please try again." }, 500);
      return json({ success: true, message: "OTP sent successfully to your email" });
    }

    if (method === "POST" && key === "university/verify-otp") {
      const { email, otp } = await req.json();
      if (!email || !otp) return json({ success: false, message: "Email and OTP are required" }, 400);
      const storedData = adminOTPStore.get(email);
      if (!storedData) return json({ success: false, message: "OTP not found. Please request a new OTP." }, 400);
      if (Date.now() > storedData.expiry) {
        adminOTPStore.delete(email);
        return json({ success: false, message: "OTP has expired. Please request a new one." }, 400);
      }
      if (storedData.attempts >= 5) {
        adminOTPStore.delete(email);
        return json({ success: false, message: "Too many failed attempts. Please request a new OTP." }, 400);
      }
      if (storedData.otp !== otp) {
        storedData.attempts += 1;
        return json({ success: false, message: "Invalid OTP" }, 400);
      }
      adminOTPStore.delete(email);
      return json({ success: true, message: "OTP verified successfully" });
    }

    const admin = await getAdminActor(req);

    if (method === "POST" && key === "register-solver") {
      const { name, email, subjects, experience, bio } = await req.json();
      if (!name || !email || !subjects || subjects.length === 0) {
        return json({ success: false, message: "Name, email, and at least one subject are required" }, 400);
      }
      let user = await User.findOne({ email: String(email).toLowerCase() });
      if (!user) {
        user = new User({
          name,
          email: String(email).toLowerCase(),
          password: `temp_password_${Date.now()}`,
          isEmailVerified: false,
          isSolver: false,
        });
        await user.save();
      }
      const existingSolver = await Solver.findOne({ user_id: user._id });
      if (existingSolver) return json({ success: false, message: "User is already registered as a solver" }, 400);
      const newSolver = new Solver({
        user_id: user._id,
        specialities: subjects.map((s: string) => s.toLowerCase()),
        experience: experience || "beginner",
        bio: bio || "",
        isActive: true,
      });
      await newSolver.save();
      await User.findByIdAndUpdate(user._id, { name, isSolver: true });
      return json(
        {
          success: true,
          message: `Successfully registered ${email} as a solver`,
          data: { userId: user._id, solverId: newSolver._id, email, specialities: newSolver.specialities },
        },
        201
      );
    }

    if (method === "GET" && key === "users") {
      const page = Number(req.nextUrl.searchParams.get("page") || "1");
      const limit = Number(req.nextUrl.searchParams.get("limit") || "50");
      const skip = (page - 1) * limit;
      const role = req.nextUrl.searchParams.get("role");
      const isSolver = parseBool(req.nextUrl.searchParams.get("isSolver"));
      const isActive = parseBool(req.nextUrl.searchParams.get("isActive"));
      const query: Record<string, unknown> = {};
      if (role) query.role = role;
      if (isSolver !== undefined) query.isSolver = isSolver;
      if (isActive !== undefined) query.isActive = isActive;
      const [users, total] = await Promise.all([
        User.find(query).select("name email isSolver role isActive createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        User.countDocuments(query),
      ]);
      return json({
        success: true,
        data: users,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalUsers: total, hasNext: skip + limit < total, hasPrev: page > 1 },
      });
    }

    if (method === "GET" && key === "solvers") {
      const page = Number(req.nextUrl.searchParams.get("page") || "1");
      const limit = Number(req.nextUrl.searchParams.get("limit") || "50");
      const skip = (page - 1) * limit;
      const isActive = parseBool(req.nextUrl.searchParams.get("isActive"));
      const query: Record<string, unknown> = {};
      if (isActive !== undefined) query.isActive = isActive;
      const [solvers, total] = await Promise.all([
        Solver.find(query).select("specialities experience bio total_doubts_solved rating isActive createdAt").populate("user_id", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Solver.countDocuments(query),
      ]);
      return json({
        success: true,
        data: solvers,
        pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalSolvers: total, hasNext: skip + limit < total, hasPrev: page > 1 },
      });
    }

    if (method === "POST" && key === "doubt-packs") {
      const { totalDoubts, categories } = await req.json();
      if (!totalDoubts || !Array.isArray(categories) || categories.length === 0) {
        return json({ success: false, message: "Total doubts and categories are required" }, 400);
      }
      if (totalDoubts <= 0) return json({ success: false, message: "Total doubts must be greater than zero" }, 400);
      const categoryTotal = categories.reduce((sum: number, cat: { count?: number }) => sum + (cat.count || 0), 0);
      if (categoryTotal !== totalDoubts) return json({ success: false, message: "Category counts must add up to the total number of doubts" }, 400);
      const createdBy = admin._id !== "hardcoded-admin-id" ? admin._id : null;
      const pack = new DoubtPack({
        totalDoubts,
        categories: categories.map((cat: { name: string; count: number }) => ({ name: cat.name.trim(), count: cat.count })),
        createdBy,
        isActive: true,
      });
      await pack.save();
      return json({ success: true, message: "Doubt pack created successfully", data: pack }, 201);
    }

    if (method === "GET" && key === "doubt-packs") {
      const isActive = req.nextUrl.searchParams.get("isActive");
      const query: Record<string, unknown> = {};
      if (isActive !== null) query.isActive = isActive === "true";
      const packs = await DoubtPack.find(query).sort({ createdAt: -1 }).populate("createdBy", "name email").limit(100);
      return json({ success: true, data: packs });
    }

    if (method === "DELETE" && path[0] === "doubt-packs" && path[1]) {
      const pack = await DoubtPack.findById(path[1]);
      if (!pack) return json({ success: false, message: "Doubt pack not found" }, 404);
      await DoubtPack.findByIdAndDelete(path[1]);
      return json({ success: true, message: "Doubt pack deleted successfully" });
    }

    if (method === "GET" && key === "solver-requests") {
      const status = req.nextUrl.searchParams.get("status");
      const query: Record<string, unknown> = {};
      if (status) query.status = status;
      const requests = await SolverRequest.find(query).populate("user_id", "name email").sort({ createdAt: -1 });
      return json({ success: true, data: requests });
    }

    if (method === "POST" && path[0] === "solver-requests" && path[1] && path[2] === "approve") {
      const { admin_notes } = await req.json();
      const request = await SolverRequest.findById(path[1]).populate("user_id");
      if (!request) return json({ success: false, message: "Solver request not found" }, 404);
      if (request.status !== "pending") return json({ success: false, message: `Request is already ${request.status}` }, 400);
      const existingSolver = await Solver.findOne({ user_id: request.user_id._id });
      if (!existingSolver) {
        const newSolver = new Solver({
          user_id: request.user_id._id,
          specialities: request.subjects.map((s: string) => s.toLowerCase()),
          experience: "beginner",
          bio: "",
          isActive: true,
        });
        await newSolver.save();
        await User.findByIdAndUpdate(request.user_id._id, { name: request.name, email: request.email, isSolver: true });
      }
      request.status = "approved";
      request.admin_notes = admin_notes || "";
      await request.save();
      await new Notification({
        user_id: request.user_id._id,
        message_type: "SOLUTION_ACCEPTED",
        content: `Your solver request has been approved! You can now start solving doubts in: ${request.subjects.join(", ")}`,
      }).save();
      return json({ success: true, message: "Solver request approved successfully", data: request });
    }

    if (method === "POST" && path[0] === "solver-requests" && path[1] && path[2] === "reject") {
      const { admin_notes } = await req.json();
      const request = await SolverRequest.findById(path[1]).populate("user_id");
      if (!request) return json({ success: false, message: "Solver request not found" }, 404);
      if (request.status !== "pending") return json({ success: false, message: `Request is already ${request.status}` }, 400);
      request.status = "rejected";
      request.admin_notes = admin_notes || "Request rejected by admin";
      await request.save();
      await new Notification({
        user_id: request.user_id._id,
        message_type: "DOUBT_REJECTED",
        content: `Your solver request has been rejected. ${admin_notes || "Please contact admin for more information."}`,
      }).save();
      return json({ success: true, message: "Solver request rejected", data: request });
    }

    if (method === "GET" && key === "notifications") {
      if (admin._id === "hardcoded-admin-id") {
        const adminUsers = await User.find({ role: "admin" }).select("_id");
        const adminIds = adminUsers.map((u) => u._id);
        const notifications = await Notification.find({ user_id: { $in: adminIds }, message_type: "SOLVER_REQUEST" }).sort({ createdAt: -1 }).limit(50);
        return json({ success: true, data: notifications });
      }
      const notifications = await Notification.find({ user_id: admin._id, message_type: "SOLVER_REQUEST" }).sort({ createdAt: -1 }).limit(50);
      return json({ success: true, data: notifications });
    }

    if (method === "POST" && path[0] === "notifications" && path[1] && path[2] === "read") {
      const notification = await Notification.findById(path[1]);
      if (!notification) return json({ success: false, message: "Notification not found" }, 404);
      notification.is_read = true;
      await notification.save();
      return json({ success: true, message: "Notification marked as read", data: notification });
    }

    if (method === "GET" && key === "doubt-pack-purchases") {
      const limit = Number(req.nextUrl.searchParams.get("limit") || "50");
      const skip = Number(req.nextUrl.searchParams.get("skip") || "0");
      const purchases = await DoubtPackPurchase.find({})
        .populate("doubt_pack_id", "totalDoubts categories")
        .populate("university_id", "name email")
        .sort({ purchase_date: -1 })
        .limit(limit)
        .skip(skip);
      const total = await DoubtPackPurchase.countDocuments({});
      return json({ success: true, data: purchases, total, limit, skip });
    }

    if (method === "POST" && key === "doubt-pack-purchases") {
      const { university_id, university_name, university_email, doubt_pack_id, doubt_pack_details, amount } = await req.json();
      if (!university_name || !university_email || !doubt_pack_id || !amount) {
        return json({ success: false, message: "Missing required fields" }, 400);
      }
      const doubtPack = await DoubtPack.findById(doubt_pack_id);
      if (!doubtPack) return json({ success: false, message: "Doubt pack not found", doubt_pack_id }, 404);
      let userId: mongoose.Types.ObjectId | null = null;
      if (university_id && mongoose.Types.ObjectId.isValid(university_id)) {
        const userExists = await User.findById(university_id);
        if (userExists) userId = new mongoose.Types.ObjectId(university_id);
      }
      if (!userId) {
        const existingUser = await User.findOne({ email: university_email });
        if (existingUser) userId = existingUser._id;
      }
      const purchaseData: Record<string, unknown> = {
        university_name,
        university_email,
        doubt_pack_id,
        doubt_pack_details: doubt_pack_details || { totalDoubts: doubtPack.totalDoubts, categories: doubtPack.categories },
        amount: parseFloat(String(amount)),
        payment_status: "completed",
      };
      if (userId) purchaseData.university_id = userId;
      const purchase = new DoubtPackPurchase(purchaseData);
      await purchase.save();
      return json({ success: true, message: "Purchase recorded successfully", data: purchase }, 201);
    }

    if (method === "GET" && key === "ratings-feedback") {
      const approved = req.nextUrl.searchParams.get("approved");
      const featured = req.nextUrl.searchParams.get("featured");
      const limit = Number(req.nextUrl.searchParams.get("limit") || "100");
      const skip = Number(req.nextUrl.searchParams.get("skip") || "0");
      const query: Record<string, unknown> = {};
      if (approved !== null && approved !== "") query.is_approved = approved === "true";
      if (featured !== null && featured !== "") query.is_featured = featured === "true";
      if (mongoose.connection.readyState !== 1) {
        return json({ success: false, message: "Database connection unavailable", error: "MongoDB not connected" }, 503);
      }
      const ratings = await RatingFeedback.find(query).sort({ createdAt: -1 }).limit(limit).skip(skip).lean();
      const total = await RatingFeedback.countDocuments({});
      const approvedCount = await RatingFeedback.countDocuments({ is_approved: true });
      const featuredCount = await RatingFeedback.countDocuments({ is_featured: true });
      const averageRating = await RatingFeedback.aggregate([{ $match: { is_approved: true } }, { $group: { _id: null, avgRating: { $avg: "$rating" } } }]);
      return json({
        success: true,
        data: ratings,
        stats: { total, approved: approvedCount, featured: featuredCount, averageRating: averageRating[0]?.avgRating || 0 },
        limit,
        skip,
      });
    }

    if (method === "POST" && path[0] === "ratings-feedback" && path[1] && path[2] === "approve") {
      const { featured } = await req.json();
      const rating = await RatingFeedback.findById(path[1]);
      if (!rating) return json({ success: false, message: "Rating not found" }, 404);
      rating.is_approved = true;
      if (featured !== undefined) rating.is_featured = featured;
      await rating.save();
      return json({ success: true, message: "Rating approved successfully", data: rating });
    }

    if (method === "DELETE" && path[0] === "ratings-feedback" && path[1]) {
      const rating = await RatingFeedback.findById(path[1]);
      if (!rating) return json({ success: false, message: "Rating not found" }, 404);
      await RatingFeedback.findByIdAndDelete(path[1]);
      return json({ success: true, message: "Rating deleted successfully" });
    }

    if (method === "GET" && key === "withdrawals") {
      const status = req.nextUrl.searchParams.get("status");
      const query: Record<string, unknown> = {};
      if (status) query.status = status;
      const withdrawals = await WithdrawalRequest.find(query).populate("user_id", "name email").populate("approved_by", "name email").sort({ createdAt: -1 });
      return json({ success: true, data: withdrawals });
    }

    if (method === "POST" && path[0] === "withdrawals" && path[1] && path[2] === "approve") {
      const { admin_notes } = await req.json();
      const withdrawal = await WithdrawalRequest.findById(path[1]).populate("user_id");
      if (!withdrawal) return json({ success: false, message: "Withdrawal request not found" }, 404);
      if (withdrawal.status !== "pending") return json({ success: false, message: `Withdrawal request is already ${withdrawal.status}` }, 400);
      const wallet = await Wallet.findOne({ user_id: withdrawal.user_id._id });
      if (!wallet) return json({ success: false, message: "Wallet not found" }, 404);
      if (wallet.balance < withdrawal.amount) return json({ success: false, message: `Insufficient balance. Available: ${wallet.balance} coins` }, 400);
      withdrawal.status = "approved";
      const adminId = admin._id || admin.id;
      if (adminId && adminId !== "hardcoded-admin-id" && mongoose.Types.ObjectId.isValid(String(adminId))) {
        withdrawal.approved_by = new mongoose.Types.ObjectId(String(adminId));
      }
      if (admin_notes) withdrawal.admin_notes = admin_notes;
      await withdrawal.save();
      return json({ success: true, message: "Withdrawal request approved", data: withdrawal });
    }

    if (method === "POST" && path[0] === "withdrawals" && path[1] && path[2] === "disburse") {
      const { admin_notes } = await req.json();
      const withdrawal = await WithdrawalRequest.findById(path[1]).populate("user_id");
      if (!withdrawal) return json({ success: false, message: "Withdrawal request not found" }, 404);
      if (withdrawal.status !== "approved") {
        return json({ success: false, message: `Withdrawal request must be approved before disbursement. Current status: ${withdrawal.status}` }, 400);
      }
      const wallet = await Wallet.findOne({ user_id: withdrawal.user_id._id });
      if (!wallet) return json({ success: false, message: "Wallet not found" }, 404);
      if (wallet.balance < withdrawal.amount) return json({ success: false, message: `Insufficient balance. Available: ${wallet.balance} coins` }, 400);
      wallet.balance -= withdrawal.amount;
      await wallet.save();
      withdrawal.status = "disbursed";
      withdrawal.disbursed_at = new Date();
      if (admin_notes) withdrawal.admin_notes = admin_notes;
      await withdrawal.save();
      return json({ success: true, message: "Payment disbursed successfully", data: withdrawal });
    }

    if (method === "POST" && path[0] === "withdrawals" && path[1] && path[2] === "reject") {
      const { admin_notes } = await req.json();
      const withdrawal = await WithdrawalRequest.findById(path[1]);
      if (!withdrawal) return json({ success: false, message: "Withdrawal request not found" }, 404);
      if (withdrawal.status !== "pending") return json({ success: false, message: `Withdrawal request is already ${withdrawal.status}` }, 400);
      withdrawal.status = "rejected";
      const adminId = admin._id || admin.id;
      if (adminId && adminId !== "hardcoded-admin-id" && mongoose.Types.ObjectId.isValid(String(adminId))) {
        withdrawal.approved_by = new mongoose.Types.ObjectId(String(adminId));
      }
      if (admin_notes) withdrawal.admin_notes = admin_notes;
      await withdrawal.save();
      return json({ success: true, message: "Withdrawal request rejected", data: withdrawal });
    }

    return json({ success: false, message: "Not found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Missing bearer token" || message === "Invalid token" || message === "Token expired") {
      return json({ success: false, message: "Admin authentication required" }, 401);
    }
    if (message === "Invalid or inactive user" || message === "Admin privileges required") {
      return json({ success: false, message }, 403);
    }
    return json({ success: false, message: "Server error", error: message }, 500);
  }
};

export const GET = run;
export const POST = run;
export const PUT = run;
export const PATCH = run;
export const DELETE = run;
export const OPTIONS = run;
