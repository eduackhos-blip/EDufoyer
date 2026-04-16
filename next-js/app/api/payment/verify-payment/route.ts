import crypto from "crypto";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import DoubtPackPurchase from "@/src/models/DoubtPackPurchase";
import DoubtPack from "@/src/models/DoubtPack";
import User from "@/src/models/User";
import Notification from "@/src/models/Notification";
import UniversityDoubtBalance from "@/src/models/UniversityDoubtBalance";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = body ?? {};
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, message: "Payment verification data is missing" }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "AcF9r8g62oCaAWKAxRSAfxOQ";
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed - Invalid signature" },
        { status: 400 }
      );
    }

    const { doubt_pack_id, university_name, university_email, university_id, amount } = orderData || {};
    const doubtPack = await DoubtPack.findById(doubt_pack_id);
    if (!doubtPack) {
      return NextResponse.json({ success: false, message: "Doubt pack not found" }, { status: 404 });
    }

    let userId: mongoose.Types.ObjectId | null = null;
    if (university_id && mongoose.Types.ObjectId.isValid(university_id)) {
      const userExists = await User.findById(university_id);
      if (userExists) userId = new mongoose.Types.ObjectId(university_id);
    }
    if (!userId && university_email) {
      const existingUser = await User.findOne({ email: university_email });
      if (existingUser) userId = existingUser._id;
    }

    const purchaseData: Record<string, unknown> = {
      university_name: university_name || "University",
      university_email: university_email || "",
      doubt_pack_id,
      doubt_pack_details: { totalDoubts: doubtPack.totalDoubts, categories: doubtPack.categories },
      amount: parseFloat(String(amount)),
      currency: "INR",
      payment_status: "completed",
      razorpay_order_id,
      razorpay_payment_id,
    };
    if (userId) purchaseData.university_id = userId;
    const purchase = new DoubtPackPurchase(purchaseData);
    await purchase.save();

    let universityBalance = await UniversityDoubtBalance.findOne({ university_email: String(university_email).toLowerCase() });
    if (!universityBalance) {
      universityBalance = new UniversityDoubtBalance({
        university_id: userId,
        university_email: String(university_email).toLowerCase(),
        university_name: university_name || "University",
        doubtBuckets: { small: 0, medium: 0, large: 0 },
      });
    }
    if (doubtPack.categories && Array.isArray(doubtPack.categories)) {
      const buckets = (universityBalance as { doubtBuckets: { small: number; medium: number; large: number } }).doubtBuckets;
      doubtPack.categories.forEach((category: { name?: string; count?: number }) => {
        const categoryName = category.name?.toLowerCase();
        const count = category.count || 0;
        if (categoryName === "small" || categoryName === "s") buckets.small += count;
        else if (categoryName === "medium" || categoryName === "m") buckets.medium += count;
        else if (categoryName === "large" || categoryName === "l") buckets.large += count;
      });
    }
    if (userId && !universityBalance.university_id) universityBalance.university_id = userId;
    await universityBalance.save();

    const adminUsers = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      adminUsers.map((admin) =>
        new Notification({
          user_id: admin._id,
          message_type: "DOUBT_PACK_PURCHASED",
          content: `${university_name || "University"} (${university_email || "N/A"}) purchased a doubt pack worth ₹${amount}. Pack: ${doubtPack.totalDoubts} doubts. Payment ID: ${razorpay_payment_id}`,
        }).save()
      )
    );

    return NextResponse.json(
      { success: true, message: "Payment verified and purchase recorded successfully", data: purchase },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return NextResponse.json({ success: false, message: "Failed to verify payment", error: message }, { status: 500 });
  }
}
