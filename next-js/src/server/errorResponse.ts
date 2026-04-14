import { NextResponse } from "next/server";

export const authErrorResponse = (error: unknown) => {
  const message = error instanceof Error ? error.message : "Server error";
  if (message === "Missing bearer token" || message === "Invalid token" || message === "Token expired") {
    return NextResponse.json({ success: false, message: "Access token required" }, { status: 401 });
  }
  if (message === "Invalid or inactive user") {
    return NextResponse.json({ success: false, message }, { status: 401 });
  }
  return null;
};
