import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ settings: await getSettings() });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = ["roofOpen", "totalSeats", "monthlyBookingGoal"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  const settings = await updateSettings(patch);
  return NextResponse.json({ settings });
}
