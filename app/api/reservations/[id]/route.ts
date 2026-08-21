import { NextRequest, NextResponse } from "next/server";
import { purgeReservation, updateReservation } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = ["status", "notes", "partySize", "time", "date"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  const updated = await updateReservation(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }
  return NextResponse.json({ reservation: updated });
}

// Permanently purges a reservation — irreversible. The normal "Delete" action
// in the dashboard is a soft delete via PATCH { status: "deleted" } instead,
// so this is only wired up to the confirmed "Delete Permanently" control in Trash.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await purgeReservation(id);
  if (!ok) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
