// Pure helpers for generating reservation time slots. Safe for client & server.
// Handles the rooftop's overnight hours (e.g. 18:00 -> 02:00).

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotMinutes: number,
  lastSeatingOffsetMinutes: number
): string[] {
  const open = toMinutes(openTime);
  let close = toMinutes(closeTime);
  if (close <= open) close += 1440; // overnight wrap, e.g. 18:00 -> 02:00
  const lastSeating = close - lastSeatingOffsetMinutes;

  const slots: string[] = [];
  for (let t = open; t <= lastSeating; t += slotMinutes) {
    slots.push(toHHMM(t));
  }
  return slots;
}

export function formatSlotLabel(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export interface DateChip {
  iso: string; // YYYY-MM-DD
  dow: string; // "THU"
  day: string; // "21"
  label: string; // "Thu 21 Aug"
}

/** The next `count` days starting today, formatted for the date-chip picker. */
export function upcomingDateChips(count: number, startDate = new Date()): DateChip[] {
  const chips: DateChip[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    chips.push({
      iso,
      dow: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3).toUpperCase(),
      day: String(d.getDate()),
      label: d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
    });
  }
  return chips;
}
