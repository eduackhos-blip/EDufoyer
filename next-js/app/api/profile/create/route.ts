import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import { getAuthenticatedUser } from "@/src/server/currentUser";
import cache from "@/src/server/utils/cache.js";
import { z } from "zod";
import Profile from "@/src/models/Profile.js";
import Solver from "@/src/models/Solver.js";
import User from "@/src/models/User.js";

export const runtime = "nodejs";

const profileSchema = z.object({
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  strongSubject: z.string().min(1, "Subject is required"),
  universityName: z.string().min(1, "University name is required"),
  course: z.string().min(1, "Course is required"),
});

async function createProfile(formData: any, userId: string) {
  const validatedFields = profileSchema.safeParse({
    mobileNumber: formData.mobileNumber,
    strongSubject: formData.strongSubject,
    universityName: formData.universityName,
    course: formData.course,
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await Profile.create({
      mobileNumber: validatedFields.data.mobileNumber,
      strongSubject: validatedFields.data.strongSubject,
      universityName: validatedFields.data.universityName,
      course: validatedFields.data.course,
      userId: userId,
    });

    await User.findByIdAndUpdate(userId, {
      onBoarding: true,
      updatedAt: new Date(),
    });

    await Solver.create({
      user_id: userId,
      specialities: [validatedFields.data.strongSubject.toLowerCase()],
    });

    return { success: true };
  } catch (error) {
    return {
      error: { form: "Failed to save your profile. Please try again." },
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = await createProfile(body, user.id);

    if (result.success) {
      cache.delete(`profile:${user.id}`);
      return NextResponse.json({ success: true, message: "Profile created successfully" }, { status: 201 });
    }

    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    if (message === "Missing bearer token" || message === "Invalid token" || message === "Token expired") {
      return NextResponse.json({ success: false, message: "Access token required" }, { status: 401 });
    }
    if (message === "Invalid or inactive user") {
      return NextResponse.json({ success: false, message: message }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
