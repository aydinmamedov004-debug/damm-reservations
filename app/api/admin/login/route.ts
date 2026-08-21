import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const password = body?.password;

  const expected = process.env.ADMIN_PASSWORD || "damm2026";
  if (!password || password !== expected) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const session = await createSession();
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(session.expiresAt),
    path: "/",
  });
  return res;
}
