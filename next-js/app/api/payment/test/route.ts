import Razorpay from "razorpay";
import { NextResponse } from "next/server";

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

export async function GET() {
  return NextResponse.json(
    {
      success: true,
      razorpayInitialized: !!razorpay,
      razorpayKeyId: (razorpay as unknown as { key_id?: string })?.key_id || "NOT SET",
      message: razorpay ? "Razorpay is initialized" : "Razorpay initialization failed",
    },
    { status: 200 }
  );
}
