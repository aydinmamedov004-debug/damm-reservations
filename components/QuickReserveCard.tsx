"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { upcomingDateChips, formatSlotLabel } from "@/lib/slots";

const COMMON_SLOTS = ["18:00", "19:00", "20:00", "21:00", "22:00"];

export default function QuickReserveCard() {
  const router = useRouter();
  const dates = useMemo(() => upcomingDateChips(6), []);
  const [dateIdx, setDateIdx] = useState(0);
  const [party, setParty] = useState(2);
  const [time, setTime] = useState("20:00");

  const selected = dates[dateIdx];

  function checkAvailability() {
    const params = new URLSearchParams({
      date: selected.iso,
      party: String(party),
      time,
    });
    router.push(`/reserve?${params.toString()}`);
  }

  return (
    <div className="card flex flex-col gap-4 bg-accent/[0.03] p-6">
      <p className="eyebrow">Quick reservation</p>
      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          className="input flex items-center justify-between text-left"
          onClick={() => setDateIdx((i) => (i + 1) % dates.length)}
        >
          {selected.label}
        </button>
        <div className="input flex items-center justify-between">
          <button
            type="button"
            aria-label="Fewer guests"
            className="text-foreground/70 hover:text-accent"
            onClick={() => setParty((p) => Math.max(1, p - 1))}
          >
            –
          </button>
          <span>{party} guests</span>
          <button
            type="button"
            aria-label="More guests"
            className="text-foreground/70 hover:text-accent"
            onClick={() => setParty((p) => Math.min(12, p + 1))}
          >
            +
          </button>
        </div>
        <select
          className="input"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        >
          {COMMON_SLOTS.map((t) => (
            <option key={t} value={t}>
              {formatSlotLabel(t)}
            </option>
          ))}
        </select>
      </div>
      <button type="button" onClick={checkAvailability} className="btn-primary w-full">
        Check availability
      </button>
    </div>
  );
}
