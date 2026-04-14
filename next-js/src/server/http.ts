import { NextResponse } from "next/server";

export const ok = (data: unknown, init?: ResponseInit) =>
  NextResponse.json(data, {
    status: 200,
    ...(init ?? {}),
  });

export const created = (data: unknown) =>
  NextResponse.json(data, {
    status: 201,
  });

export const fail = (status: number, message: string, extra?: Record<string, unknown>) =>
  NextResponse.json(
    {
      success: false,
      message,
      ...(extra ?? {}),
    },
    { status }
  );
