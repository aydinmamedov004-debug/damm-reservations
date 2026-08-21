import { NextRequest, NextResponse } from "next/server";
import { createReservation, getReservations, getSeatsBookedForSlot, getSettings } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const date = req.nextUrl.searchParams.get("date");
  const all = await getReservations();
  const reservations = date ? all.filter((r) => r.date === date) : all;
  return NextResponse.json({ reservations });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, phone, email, date, time, partySize, notes } = body;

  if (!name || !phone || !date || !time || !partySize) {
    return NextResponse.json(
      { error: "name, phone, date, time and partySize are required" },
      { status: 400 }
    );
  }
  const dateStr = String(date);
  const timeStr = String(time);

  const trimmedName = String(name).trim();
  if (trimmedName.length < 2) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }

  const phoneDigits = String(phone).replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const size = Number(partySize);
  if (!Number.isFinite(size) || size < 1 || size > 20) {
    return NextResponse.json({ error: "partySize must be between 1 and 20" }, { status: 400 });
  }

  // Reject bookings in the past
  const requested = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(requested.getTime())) {
    return NextResponse.json({ error: "Invalid date/time" }, { status: 400 });
  }
  if (requested.getTime() < Date.now() - 5 * 60 * 1000) {
    return NextResponse.json({ error: "Cannot reserve a time in the past" }, { status: 400 });
  }

  const adminRequest = await isAdminAuthed();
  const settings = await getSettings();

  if (!settings.roofOpen && !adminRequest) {
    return NextResponse.json(
      { error: "damm. is closed tonight (weather call) — please check back or call us." },
      { status: 409 }
    );
  }

  const booked = await getSeatsBookedForSlot(dateStr, timeStr);
  if (booked + size > settings.totalSeats && !adminRequest) {
    return NextResponse.json(
      {
        error: `That time is fully booked (only ${Math.max(
          settings.totalSeats - booked,
          0
        )} seat(s) left). Please choose another time.`,
      },
      { status: 409 }
    );
  }

  const reservation = await createReservation({
    name: trimmedName,
    phone: String(phone).trim(),
    email: email ? String(email).trim() : undefined,
    date: dateStr,
    time: timeStr,
    partySize: size,
    notes: notes ? String(notes).trim() : undefined,
    source: adminRequest ? "admin" : "customer",
  });

  return NextResponse.json({ reservation }, { status: 201 });
}
