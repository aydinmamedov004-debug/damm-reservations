"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MenuItem, Reservation, ReservationStatus, Settings } from "@/lib/types";
import { formatSlotLabel, generateTimeSlots } from "@/lib/slots";
import { formatMenuPrice } from "@/lib/menuFormat";

type Tab = "Tonight" | "Calendar" | "Requests" | "Menu";

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: "bg-accent/10 text-accent border-accent/40",
  confirmed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  seated: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
  deleted: "bg-muted/10 text-muted border-border",
};

interface Toast {
  message: string;
  onUndo: () => void;
}

export default function AdminShell({
  initialReservations,
  initialMenu,
  initialSettings,
  monthlyCount,
  today,
}: {
  initialReservations: Reservation[];
  initialMenu: MenuItem[];
  initialSettings: Settings;
  monthlyCount: number;
  today: string;
}) {
  const [tab, setTab] = useState<Tab>("Tonight");
  const [reservations, setReservations] = useState(initialReservations);
  const [menu, setMenu] = useState(initialMenu);
  const [settings, setSettings] = useState(initialSettings);
  const [monthCount, setMonthCount] = useState(monthlyCount);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function showToast(t: Toast) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 7000);
  }

  async function refreshReservations() {
    const res = await fetch(`/api/reservations`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { reservations: Reservation[] };
      setReservations(data.reservations);
      const ym = today.slice(0, 7);
      setMonthCount(
        data.reservations.filter(
          (r: Reservation) => r.date.startsWith(ym) && r.status !== "cancelled" && r.status !== "deleted"
        ).length
      );
    }
  }

  async function refreshMenu() {
    const res = await fetch("/api/menu", { cache: "no-store" });
    if (res.ok) setMenu(((await res.json()) as { menu: MenuItem[] }).menu);
  }

  const pendingCount = reservations.filter((r) => r.status === "pending").length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "Tonight", label: "Tonight" },
    { key: "Calendar", label: "Calendar" },
    { key: "Requests", label: `Requests${pendingCount ? ` (${pendingCount})` : ""}` },
    { key: "Menu", label: "Menu" },
  ];

  return (
    <div className="pb-16">
      <div className="mb-8 flex gap-2 border-b border-border/70 pb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "rounded-lg bg-accent/10 px-3.5 py-2 font-sans text-sm font-medium text-accent"
                : "rounded-lg px-3.5 py-2 font-sans text-sm text-foreground/70 hover:bg-foreground/5"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "Tonight" && (
        <TonightTab
          reservations={reservations}
          settings={settings}
          monthCount={monthCount}
          today={today}
          refresh={refreshReservations}
          showToast={showToast}
        />
      )}
      {tab === "Calendar" && (
        <CalendarTab reservations={reservations} settings={settings} today={today} />
      )}
      {tab === "Requests" && (
        <RequestsTab reservations={reservations} refresh={refreshReservations} showToast={showToast} />
      )}
      {tab === "Menu" && <MenuTab menu={menu} refresh={refreshMenu} />}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-accent/40 bg-surface px-5 py-3 font-sans text-sm text-foreground shadow-card">
          <span>{toast.message}</span>
          <button onClick={toast.onUndo} className="font-semibold uppercase tracking-wide text-accent hover:underline">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tonight
// ---------------------------------------------------------------------------

type QuickFilter = "today" | "all" | "upcoming" | "past" | "cancelled" | "trash";
const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "trash", label: "Trash" },
];

function TonightTab({
  reservations,
  settings,
  monthCount,
  today,
  refresh,
  showToast,
}: {
  reservations: Reservation[];
  settings: Settings;
  monthCount: number;
  today: string;
  refresh: () => Promise<void>;
  showToast: (t: Toast) => void;
}) {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("today");
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [togglingRoof, setTogglingRoof] = useState(false);
  const [roofOpen, setRoofOpen] = useState(settings.roofOpen);

  const seatsToday = reservations
    .filter((r) => r.date === today && r.status !== "cancelled" && r.status !== "deleted")
    .reduce((sum, r) => sum + r.partySize, 0);
  const bookingsToday = reservations.filter(
    (r) => r.date === today && (r.status === "confirmed" || r.status === "seated")
  ).length;
  const requestsCount = reservations.filter((r) => r.status === "pending").length;

  const filtered = useMemo(() => {
    let list = reservations;
    switch (quickFilter) {
      case "today":
        list = list.filter((r) => r.date === today && r.status !== "deleted");
        break;
      case "all":
        list = list.filter((r) => r.status !== "deleted");
        break;
      case "upcoming":
        list = list.filter((r) => r.date >= today && r.status !== "deleted" && r.status !== "cancelled");
        break;
      case "past":
        list = list.filter((r) => r.date < today && r.status !== "deleted");
        break;
      case "cancelled":
        list = list.filter((r) => r.status === "cancelled");
        break;
      case "trash":
        list = list.filter((r) => r.status === "deleted");
        break;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.confirmationCode?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [reservations, quickFilter, search, today]);

  async function patchReservation(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json().catch(() => ({}))) as { reservation?: Reservation };
    return res.ok ? (data.reservation ?? null) : null;
  }

  async function updateStatus(id: string, status: ReservationStatus) {
    setBusyId(id);
    await patchReservation(id, { status });
    await refresh();
    setBusyId(null);
  }

  async function cancelReservation(r: Reservation) {
    setBusyId(r.id);
    const updated = await patchReservation(r.id, { status: "cancelled" });
    await refresh();
    setBusyId(null);
    if (updated) {
      showToast({
        message: `Cancelled ${r.name}'s reservation.`,
        onUndo: () => restore(r.id, updated.previousStatus ?? "confirmed"),
      });
    }
  }

  async function softDelete(r: Reservation) {
    setBusyId(r.id);
    const updated = await patchReservation(r.id, { status: "deleted" });
    await refresh();
    setBusyId(null);
    if (updated) {
      showToast({
        message: `Deleted ${r.name}'s reservation.`,
        onUndo: () => restore(r.id, updated.previousStatus ?? "confirmed"),
      });
    }
  }

  async function restore(id: string, targetStatus: ReservationStatus) {
    setBusyId(id);
    await patchReservation(id, { status: targetStatus });
    await refresh();
    setBusyId(null);
  }

  async function purgeForever(r: Reservation) {
    if (!confirm(`Permanently delete ${r.name}'s reservation? This cannot be undone.`)) return;
    setBusyId(r.id);
    await fetch(`/api/reservations/${r.id}`, { method: "DELETE" });
    await refresh();
    setBusyId(null);
  }

  async function toggleRoof() {
    setTogglingRoof(true);
    const next = !roofOpen;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roofOpen: next }),
    });
    if (res.ok) setRoofOpen(next);
    setTogglingRoof(false);
  }

  const goalPct = Math.min(100, Math.round((monthCount / settings.monthlyBookingGoal) * 100));

  const grouped = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of filtered) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard k="Covers" v={String(seatsToday)} sub={`of ${settings.totalSeats} seats today`} />
        <StatCard k="Bookings" v={String(bookingsToday)} sub="confirmed tonight" />
        <StatCard k="Requests" v={String(requestsCount)} sub="awaiting a reply" />
        <StatCard k="This month" v={`${monthCount}/${settings.monthlyBookingGoal}`} sub={`${goalPct}% of launch goal`} bar={goalPct} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map((f) => (
              <button key={f.key} onClick={() => setQuickFilter(f.key)} className={quickFilter === f.key ? "chip-on" : "chip-off"}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <input
              className="input w-56"
              placeholder="Search name, phone, code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="btn-primary" onClick={() => setShowAddForm((v) => !v)}>
                {showAddForm ? "Close" : "+ Walk-in"}
              </button>
            </div>
          </div>

          {showAddForm && (
            <AddReservationForm
              defaultDate={today}
              onCreated={async () => {
                setShowAddForm(false);
                await refresh();
              }}
            />
          )}

          <div className="space-y-6">
            {grouped.map(([date, rows]) => (
              <div key={date}>
                <p className="mb-2 font-sans text-xs font-semibold uppercase tracking-widest text-muted">
                  {new Date(`${date}T00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  {date === today && <span className="ml-2 text-accent">Today</span>}
                </p>
                <div className="card overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left font-sans text-sm">
                    <thead>
                      <tr className="border-b border-border/70 text-[11px] uppercase tracking-widest text-muted">
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Guest</th>
                        <th className="px-4 py-3">Pax</th>
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b border-border/40 last:border-0">
                          <td className="px-4 py-3 font-serif font-semibold text-foreground">{formatSlotLabel(r.time)}</td>
                          <td className="px-4 py-3 text-foreground">
                            <div>{r.name}</div>
                            <div className="text-xs text-muted2">{r.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-muted">{r.partySize}</td>
                          <td className="px-4 py-3 text-xs text-accent">{r.confirmationCode}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${STATUS_STYLES[r.status]}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.status === "cancelled" || r.status === "deleted" ? (
                                <ActionBtn busy={busyId === r.id} onClick={() => restore(r.id, r.previousStatus ?? "confirmed")} tone="emerald">
                                  Restore
                                </ActionBtn>
                              ) : (
                                <>
                                  {r.status !== "confirmed" && (
                                    <ActionBtn busy={busyId === r.id} onClick={() => updateStatus(r.id, "confirmed")} tone="emerald">
                                      Confirm
                                    </ActionBtn>
                                  )}
                                  {r.status !== "seated" && (
                                    <ActionBtn busy={busyId === r.id} onClick={() => updateStatus(r.id, "seated")} tone="sky">
                                      Seat
                                    </ActionBtn>
                                  )}
                                  <ActionBtn busy={busyId === r.id} onClick={() => cancelReservation(r)} tone="accent">
                                    Cancel
                                  </ActionBtn>
                                </>
                              )}
                              {r.status === "deleted" ? (
                                <ActionBtn busy={busyId === r.id} onClick={() => purgeForever(r)} tone="rose">
                                  Delete Forever
                                </ActionBtn>
                              ) : (
                                <ActionBtn busy={busyId === r.id} onClick={() => softDelete(r)} tone="rose">
                                  Delete
                                </ActionBtn>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {grouped.length === 0 && <div className="card px-5 py-10 text-center text-muted">No reservations match this view.</div>}
          </div>
        </div>

        <div className="card flex flex-col gap-3 p-5">
          <p className="eyebrow">Weather call</p>
          <p className="font-sans text-sm text-foreground/80">
            {roofOpen
              ? "damm. is open for booking tonight."
              : "Closed tonight — online booking is paused and guests see a closed notice."}
          </p>
          <button onClick={toggleRoof} disabled={togglingRoof} className="btn-outline">
            {togglingRoof ? "Updating…" : roofOpen ? "Close tonight (weather)" : "Reopen"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ k, v, sub, bar }: { k: string; v: string; sub: string; bar?: number }) {
  return (
    <div className="card p-5">
      <p className="eyebrow mb-1.5">{k}</p>
      <p className="text-2xl font-serif font-semibold text-foreground">{v}</p>
      {bar !== undefined && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
          <div className="h-full bg-accent transition-all" style={{ width: `${bar}%` }} />
        </div>
      )}
      <p className="mt-1.5 font-sans text-xs text-muted">{sub}</p>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  busy,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  tone: "emerald" | "sky" | "accent" | "rose";
}) {
  const toneClasses = {
    emerald: "border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
    sky: "border-sky-500/30 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300",
    accent: "border-accent/40 text-accent hover:bg-accent/10",
    rose: "border-rose-500/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300",
  }[tone];
  return (
    <button disabled={busy} onClick={onClick} className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${toneClasses}`}>
      {children}
    </button>
  );
}

function AddReservationForm({ defaultDate, onCreated }: { defaultDate: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !phone || !date || !time) {
      setError("Name, phone, date and time are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, date, time, partySize, notes }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not create reservation.");
        return;
      }
      onCreated();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
      <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input type="number" min={1} max={20} className="input" value={partySize} onChange={(e) => setPartySize(Number(e.target.value))} />
      <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
      <input className="input sm:col-span-2 lg:col-span-2" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      {error && <p className="col-span-full font-sans text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <div className="col-span-full flex items-center gap-3">
        <button type="submit" className="btn-solid" disabled={submitting}>
          {submitting ? "Adding…" : "Add walk-in"}
        </button>
        <p className="font-sans text-xs text-muted">Admin bookings bypass the online capacity limit.</p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

function RequestsTab({
  reservations,
  refresh,
  showToast,
}: {
  reservations: Reservation[];
  refresh: () => Promise<void>;
  showToast: (t: Toast) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const requests = reservations
    .filter((r) => r.status === "pending")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  async function accept(r: Reservation) {
    setBusyId(r.id);
    await fetch(`/api/reservations/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    await refresh();
    setBusyId(null);
  }

  async function decline(r: Reservation) {
    setBusyId(r.id);
    const res = await fetch(`/api/reservations/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    const data = (await res.json().catch(() => ({}))) as { reservation?: Reservation };
    await refresh();
    setBusyId(null);
    if (res.ok) {
      showToast({
        message: `Declined ${r.name}'s request.`,
        onUndo: async () => {
          await fetch(`/api/reservations/${r.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: data.reservation?.previousStatus ?? "pending" }),
          });
          await refresh();
        },
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl text-foreground">Requests</h2>
        <p className="font-sans text-sm text-muted">{requests.length} waiting</p>
      </div>
      {requests.length === 0 && (
        <div className="card border-dashed px-10 py-14 text-center font-sans text-sm text-muted2">
          Nothing waiting. New online reservations land here first.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {requests.map((r) => (
          <div key={r.id} className="card flex flex-col gap-2.5 p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-base font-semibold text-foreground">{r.name}</p>
              <p className="font-sans text-xs text-muted">
                {new Date(`${r.date}T00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                {formatSlotLabel(r.time)}
              </p>
            </div>
            <p className="font-sans text-sm text-muted">
              {r.partySize} guests
              {r.notes ? ` · ${r.notes}` : ""}
            </p>
            <p className="font-sans text-sm text-foreground/80">{r.phone}</p>
            <div className="mt-1 flex gap-2">
              <button disabled={busyId === r.id} onClick={() => accept(r)} className="btn-primary !py-2 flex-1">
                Accept
              </button>
              <button disabled={busyId === r.id} onClick={() => decline(r)} className="btn-outline !py-2 flex-1">
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

function CalendarTab({ reservations, settings, today }: { reservations: Reservation[]; settings: Settings; today: string }) {
  const days = useMemo(() => {
    const out: { iso: string; dow: string; day: string }[] = [];
    const start = new Date(`${today}T00:00`);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      out.push({ iso, dow: d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(), day: String(d.getDate()) });
    }
    return out;
  }, [today]);

  const times = useMemo(
    () => generateTimeSlots(settings.openTime, settings.closeTime, settings.slotMinutes, settings.lastSeatingOffsetMinutes),
    [settings]
  );
  const capacity = settings.totalSeats;

  const live = reservations.filter((r) => r.status !== "cancelled" && r.status !== "deleted");

  function bookedAt(iso: string, time: string) {
    return live.filter((r) => r.date === iso && r.time === time).reduce((sum, r) => sum + r.partySize, 0);
  }

  const weekCovers = live.filter((r) => days.some((d) => d.iso === r.date)).reduce((sum, r) => sum + r.partySize, 0);
  const weekCapacity = capacity * times.length * 7;
  const weekPct = weekCapacity > 0 ? Math.round((weekCovers / weekCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl text-foreground">Next 7 nights</h2>
          <p className="font-sans text-sm text-muted">{capacity} seats per slot · rooftop only</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="bg-surface2">
              <th className="px-3 py-3" />
              {days.map((d) => (
                <th key={d.iso} className="border-l border-border/60 px-3 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{d.dow}</div>
                  <div className="font-serif text-base font-semibold text-foreground">{d.day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((t) => (
              <tr key={t} className="border-t border-border/40">
                <td className="px-3 py-2.5 font-serif text-xs font-semibold text-foreground/80">{formatSlotLabel(t)}</td>
                {days.map((d) => {
                  const v = bookedAt(d.iso, t);
                  const full = v >= capacity;
                  return (
                    <td key={d.iso} className="border-l border-border/40 px-3 py-2.5">
                      <div className={`font-sans text-xs ${full ? "text-accent font-semibold" : "text-foreground/70"}`}>
                        {v}/{capacity}
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface2">
                        <div
                          className={`h-full ${full ? "bg-accent" : "bg-accent/50"}`}
                          style={{ width: `${Math.min(100, Math.round((v / capacity) * 100))}%` }}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow mb-2">Capacity</p>
          <p className="font-sans text-sm text-foreground/80">
            {settings.totalSeats} seats, rooftop only. Slots every {settings.slotMinutes} min.
          </p>
        </div>
        <div className="card p-5">
          <p className="eyebrow mb-2">This week</p>
          <p className="font-sans text-sm text-foreground/80">
            {weekCovers} covers booked · {weekPct}% of capacity.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

function MenuTab({ menu, refresh }: { menu: MenuItem[]; refresh: () => Promise<void> }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const m of menu) if (!seen.includes(m.category)) seen.push(m.category);
    return seen;
  }, [menu]);

  async function toggleAvailable(item: MenuItem) {
    setBusyId(item.id);
    await fetch(`/api/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    await refresh();
    setBusyId(null);
  }

  async function removeItem(id: string) {
    if (!confirm("Remove this menu item?")) return;
    setBusyId(id);
    await fetch(`/api/menu/${id}`, { method: "DELETE" });
    await refresh();
    setBusyId(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl text-foreground">Menu editor</h2>
          <p className="font-sans text-sm text-muted">{menu.length} items · turning an item off hides it from the public list immediately.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? "Close" : "+ Add item"}
        </button>
      </div>

      {showAddForm && (
        <AddMenuItemForm
          categories={categories}
          onCreated={async () => {
            setShowAddForm(false);
            await refresh();
          }}
        />
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-border/70 text-[11px] uppercase tracking-widest text-muted">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">On list</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {menu.map((item) => (
              <tr key={item.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3 text-foreground">{item.name}</td>
                <td className="px-4 py-3 text-muted">{item.category}</td>
                <td className="px-4 py-3 text-foreground/80">{formatMenuPrice(item)} {item.currency}</td>
                <td className="px-4 py-3">
                  <button
                    disabled={busyId === item.id}
                    onClick={() => toggleAvailable(item)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      item.available ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "border-border text-muted"
                    }`}
                  >
                    {item.available ? "On" : "Off"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={busyId === item.id}
                    onClick={() => removeItem(item.id)}
                    className="rounded-md border border-rose-500/30 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AddMenuItemForm({ categories, onCreated }: { categories: string[]; onCreated: () => void }) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [customCategory, setCustomCategory] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceMode, setPriceMode] = useState<"wine" | "flat">("wine");
  const [glassPrice, setGlassPrice] = useState("");
  const [bottlePrice, setBottlePrice] = useState("");
  const [flatPrice, setFlatPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const finalCategory = category === "__new__" ? customCategory : category;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!finalCategory || !name) {
      setError("Category and name are required.");
      return;
    }
    if (priceMode === "wine" && !bottlePrice) {
      setError("Bottle price is required for wine-style pricing.");
      return;
    }
    if (priceMode === "flat" && !flatPrice) {
      setError("Price is required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: finalCategory,
          name,
          description,
          currency: "AZN",
          ...(priceMode === "wine"
            ? { glassPrice: glassPrice || null, bottlePrice: Number(bottlePrice) }
            : { price: Number(flatPrice) }),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not add item.");
        return;
      }
      onCreated();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value="__new__">+ New category…</option>
      </select>
      {category === "__new__" && (
        <input className="input" placeholder="New category name" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
      )}
      <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />

      <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
        <button type="button" onClick={() => setPriceMode("wine")} className={priceMode === "wine" ? "chip-on" : "chip-off"}>
          Glass / Bottle
        </button>
        <button type="button" onClick={() => setPriceMode("flat")} className={priceMode === "flat" ? "chip-on" : "chip-off"}>
          Flat price
        </button>
      </div>

      {priceMode === "wine" ? (
        <>
          <input className="input" placeholder="Glass price (blank = —)" value={glassPrice} onChange={(e) => setGlassPrice(e.target.value)} />
          <input className="input" placeholder="Bottle price" value={bottlePrice} onChange={(e) => setBottlePrice(e.target.value)} />
        </>
      ) : (
        <input className="input" placeholder="Price" value={flatPrice} onChange={(e) => setFlatPrice(e.target.value)} />
      )}

      <input
        className="input sm:col-span-2 lg:col-span-3"
        placeholder="Tasting note (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {error && <p className="col-span-full font-sans text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <div className="col-span-full">
        <button type="submit" className="btn-solid" disabled={submitting}>
          {submitting ? "Adding…" : "Add item"}
        </button>
      </div>
    </form>
  );
}
