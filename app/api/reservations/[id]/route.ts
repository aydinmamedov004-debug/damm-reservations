import { NextRequest, NextResponse } from "next/server";
import { purgeReservation, updateReservation } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import type { ReservationStatus } from "@/lib/types";

const VALID_STATUSES: ReservationStatus[] = ["pending", "confirmed", "seated", "cancelled", "deleted"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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

  if ("status" in patch && !VALID_STATUSES.includes(patch.status as ReservationStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }
  if ("date" in patch && !DATE_RE.test(String(patch.date))) {
    return NextResponse.json({ error: "date must be in YYYY-MM-DD format" }, { status: 400 });
  }
  if ("time" in patch && !TIME_RE.test(String(patch.time))) {
    return NextResponse.json({ error: "time must be in HH:mm 24-hour format" }, { status: 400 });
  }
  if ("partySize" in patch) {
    const size = Number(patch.partySize);
    if (!Number.isFinite(size) || size < 1 || size > 20) {
      return NextResponse.json({ error: "partySize must be between 1 and 20" }, { status: 400 });
    }
    patch.partySize = size;
  }
  if ("notes" in patch && patch.notes !== null && patch.notes !== undefined) {
    patch.notes = String(patch.notes).trim();
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
