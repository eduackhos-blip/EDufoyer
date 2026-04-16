import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import UniversityDoubtBalance from "@/src/models/UniversityDoubtBalance";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const universityEmail = req.nextUrl.searchParams.get("university_email");

    if (!universityEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "University email is required",
        },
        { status: 400 }
      );
    }

    let balance = await UniversityDoubtBalance.findOne({
      university_email: universityEmail.toLowerCase(),
    }).lean();

    if (!balance) {
      const newBalance = new UniversityDoubtBalance({
        university_email: universityEmail.toLowerCase(),
        university_name: "University",
        doubtBuckets: {
          small: 0,
          medium: 0,
          large: 0,
        },
      });
      await newBalance.save();
      balance = newBalance.toObject();
    }

    const small = Number(balance.doubtBuckets?.small) || 0;
    const medium = Number(balance.doubtBuckets?.medium) || 0;
    const large = Number(balance.doubtBuckets?.large) || 0;
    const totalAvailable = Number(balance.totalAvailable) || small + medium + large;

    return NextResponse.json(
      {
        success: true,
        data: {
          doubtBuckets: {
            small,
            medium,
            large,
          },
          totalAvailableDoubts: totalAvailable,
          totalAvailable,
          university_email: balance.university_email,
          university_name: balance.university_name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get doubt balance";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get doubt balance",
        error: message,
      },
      { status: 500 }
    );
  }
}
