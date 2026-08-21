import { NextRequest, NextResponse } from "next/server";
import { getSeatsBookedForSlot, getSettings } from "@/lib/db";
import { generateTimeSlots } from "@/lib/slots";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required (YYYY-MM-DD)" }, { status: 400 });
  }

  const settings = await getSettings();
  const slots = generateTimeSlots(
    settings.openTime,
    settings.closeTime,
    settings.slotMinutes,
    settings.lastSeatingOffsetMinutes
  );

  const availability = await Promise.all(
    slots.map(async (time) => {
      const booked = await getSeatsBookedForSlot(date, time);
      return {
        time,
        booked,
        remaining: settings.roofOpen ? Math.max(settings.totalSeats - booked, 0) : 0,
        total: settings.totalSeats,
      };
    })
  );

  return NextResponse.json({ date, roofOpen: settings.roofOpen, availability });
}
