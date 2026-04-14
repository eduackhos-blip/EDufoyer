import mongoose from "mongoose";
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import DoubtPack from "@/src/server/ported-backend/models/DoubtPack.js";

export const runtime = "nodejs";

let razorpay: Razorpay | null = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_R7UFY2mbYmsWuL",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "AcF9r8g62oCaAWKAxRSAfxOQ",
  });
} catch {
  razorpay = null;
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const body = await req.json();
    const { amount, doubt_pack_id, university_name, university_email, university_id } = body ?? {};
    if (!amount || !doubt_pack_id) {
      return NextResponse.json({ success: false, message: "Amount and doubt_pack_id are required" }, { status: 400 });
    }
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { success: false, message: "Database connection unavailable", error: "MongoDB not connected" },
        { status: 503 }
      );
    }
    if (!mongoose.Types.ObjectId.isValid(doubt_pack_id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid doubt pack ID format",
          doubt_pack_id,
          hint: "Doubt pack ID must be a valid MongoDB ObjectId",
        },
        { status: 400 }
      );
    }

    const doubtPack = await DoubtPack.findById(doubt_pack_id);
    if (!doubtPack) {
      return NextResponse.json({ success: false, message: "Doubt pack not found", doubt_pack_id }, { status: 404 });
    }
    if (!razorpay) {
      return NextResponse.json(
        { success: false, message: "Payment gateway not initialized", error: "Razorpay initialization failed" },
        { status: 500 }
      );
    }

    const amountInPaise = Math.round(parseFloat(String(amount)) * 100);
    const shortPackId = String(doubt_pack_id).substring(0, 8);
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `dp_${shortPackId}_${timestamp}`;
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        doubt_pack_id: String(doubt_pack_id),
        university_name: university_name || "University",
        university_email: university_email || "",
        university_id: university_id || "",
        full_receipt: `doubt_pack_${doubt_pack_id}_${Date.now()}`,
      },
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(
      {
        success: true,
        order: { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt },
        key_id: (razorpay as unknown as { key_id?: string }).key_id,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment order";
    return NextResponse.json({ success: false, message: "Failed to create payment order", error: message }, { status: 500 });
  }
}
