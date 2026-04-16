import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import Solver from "@/src/models/Solver";
import SolverRequest from "@/src/models/SolverRequest";
import Notification from "@/src/models/Notification";
import User from "@/src/models/User";

export const runtime = "nodejs";

const uploadDir = path.join(process.cwd(), "uploads", "solver-requests");
const relPath = (name: string) => `solver-requests/${name}`;

async function persistFile(file: File, label: string) {
  await fs.mkdir(uploadDir, { recursive: true });
  const ext = path.extname(file.name || "") || ".bin";
  const filename = `${label}-${Date.now()}-${randomUUID()}${ext}`;
  const fullPath = path.join(uploadDir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(fullPath, buf);
  return relPath(filename);
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const form = await req.formData();

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phoneNumber = String(form.get("phoneNumber") || "").trim();
    const subjectsRaw = form.get("subjects");
    const subjectsArray =
      typeof subjectsRaw === "string"
        ? (() => {
            try {
              const parsed = JSON.parse(subjectsRaw);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })()
        : [];

    if (!name || !email || !phoneNumber || !subjectsArray.length) {
      return NextResponse.json(
        { success: false, message: "Name, email, phone number, and subjects are required" },
        { status: 400 }
      );
    }

    const existingSolver = await Solver.findOne({ user_id: user.id });
    if (existingSolver) {
      return NextResponse.json({ success: false, message: "You are already registered as a solver" }, { status: 400 });
    }
    const existingRequest = await SolverRequest.findOne({ user_id: user.id, status: "pending" });
    if (existingRequest) {
      return NextResponse.json(
        { success: false, message: "You already have a pending solver request. Please wait for admin approval." },
        { status: 400 }
      );
    }

    const resume = form.get("resume");
    const marksheet = form.get("marksheet");
    const aadhar = form.get("aadhar");
    const pancard = form.get("pancard");
    if (!(resume instanceof File) || !(marksheet instanceof File) || !(aadhar instanceof File) || !(pancard instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Resume, marksheet, aadhar and pancard files are required" },
        { status: 400 }
      );
    }

    const resumePath = await persistFile(resume, "resume");
    const marksheetPath = await persistFile(marksheet, "marksheet");
    const aadharPath = await persistFile(aadhar, "aadhar");
    const pancardPath = await persistFile(pancard, "pancard");

    const newRequest = new SolverRequest({
      user_id: user.id,
      name,
      email: email.toLowerCase(),
      phoneNumber,
      subjects: subjectsArray.map((s: string) => String(s).trim()),
      resume: resumePath,
      marksheet: marksheetPath,
      aadhar: aadharPath,
      pancard: pancardPath,
      status: "pending",
    });
    await newRequest.save();

    const adminUsers = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      adminUsers.map((admin) =>
        new Notification({
          user_id: admin._id,
          message_type: "SOLVER_REQUEST",
          content: `New solver request from ${name} (${email}). Subjects: ${subjectsArray.join(", ")}`,
        }).save()
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: "Solver request submitted successfully! Admin will review your request and get back to you soon.",
        data: { requestId: newRequest._id, status: newRequest.status },
      },
      { status: 201 }
    );
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error during request submission";
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}
