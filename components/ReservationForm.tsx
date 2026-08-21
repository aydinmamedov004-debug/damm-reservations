"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatSlotLabel, upcomingDateChips } from "@/lib/slots";

interface SlotAvailability {
  time: string;
  remaining: number;
  total: number;
}

interface FieldErrors {
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  email?: string;
}

function validate(fields: {
  date: string | undefined;
  time: string;
  name: string;
  phone: string;
  email: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.date) errors.date = "Please choose a date.";
  if (!fields.time) errors.time = "Please choose a time.";

  const name = fields.name.trim();
  if (!name) errors.name = "Please enter your name.";
  else if (name.length < 2) errors.name = "That name looks too short — please enter your full name.";

  const digits = fields.phone.replace(/\D/g, "");
  if (!digits) errors.phone = "Please enter your phone number.";
  else if (digits.length < 7) errors.phone = "That phone number looks too short.";
  else if (digits.length > 15) errors.phone = "That phone number looks too long.";

  if (fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}

export default function ReservationForm() {
  const params = useSearchParams();
  const dates = useMemo(() => upcomingDateChips(6), []);

  const initialDateIdx = useMemo(() => {
    const wanted = params.get("date");
    const idx = wanted ? dates.findIndex((d) => d.iso === wanted) : -1;
    return idx >= 0 ? idx : 0;
  }, [params, dates]);

  const [dateIdx, setDateIdx] = useState(initialDateIdx);
  const [time, setTime] = useState(params.get("time") || "");
  const [party, setParty] = useState(Number(params.get("party")) || 2);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [roofOpen, setRoofOpen] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    confirmationCode: string;
    date: string;
    time: string;
    partySize: number;
  } | null>(null);

  const selectedDate = dates[dateIdx];

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    fetch(`/api/availability?date=${selectedDate.iso}`)
      .then((r) => r.json() as Promise<{ availability?: SlotAvailability[]; roofOpen?: boolean }>)
      .then((data) => {
        setSlots(data.availability ?? []);
        setRoofOpen(data.roofOpen ?? true);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const selectedSlot = useMemo(() => slots.find((s) => s.time === time), [slots, time]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const errors = validate({ date: selectedDate?.iso, time, name, phone, email });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          date: selectedDate.iso,
          time,
          partySize: party,
          notes,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        reservation?: { confirmationCode: string; date: string; time: string; partySize: number };
      };
      if (!res.ok || !data.reservation) {
        setServerError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setConfirmation({
        confirmationCode: data.reservation.confirmationCode,
        date: data.reservation.date,
        time: data.reservation.time,
        partySize: data.reservation.partySize,
      });
    } catch {
      setServerError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="hidden lg:block" />
        <div className="card p-7 text-center">
          <p className="eyebrow mb-2">Request sent</p>
          <h3 className="text-xl text-foreground">See you at damm.</h3>
          <p className="mt-3 font-sans text-sm text-muted">
            {new Date(`${confirmation.date}T${confirmation.time}`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            · {formatSlotLabel(confirmation.time)} · {confirmation.partySize}{" "}
            {confirmation.partySize === 1 ? "guest" : "guests"}
          </p>
          <p className="mt-5 font-sans text-[11px] uppercase tracking-widest text-muted">
            Confirmation code
          </p>
          <p className="mt-1 font-serif text-xl font-semibold tracking-wide text-accent">
            {confirmation.confirmationCode}
          </p>
          <p className="mt-2 font-sans text-xs text-muted">
            Easier to give us over the phone than a booking number.
          </p>
          <p className="mt-5 rounded-lg bg-accent/[0.06] p-3.5 font-sans text-xs leading-relaxed text-foreground/80">
            We confirm within the hour. The roof closes in bad weather — we call to rebook.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        {/* Date */}
        <div className="flex flex-col gap-3">
          <p className="label">Date / Tarix</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {dates.map((d, i) => (
              <button
                type="button"
                key={d.iso}
                onClick={() => {
                  setDateIdx(i);
                  setFieldErrors((f) => ({ ...f, date: undefined }));
                }}
                className={`flex flex-col items-center gap-1 rounded-lg border py-3 text-center transition-colors ${
                  i === dateIdx
                    ? "border-accent bg-accent/10"
                    : "border-border bg-surface hover:border-accent/50"
                }`}
              >
                <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {d.dow}
                </span>
                <span
                  className={`font-serif text-lg font-semibold ${i === dateIdx ? "text-accent" : "text-foreground"}`}
                >
                  {d.day}
                </span>
              </button>
            ))}
          </div>
        </div>

        {!roofOpen && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-sans text-sm text-rose-700 dark:text-rose-300">
            damm. is closed tonight — weather call. Please check back tomorrow or call us at{" "}
            <a href="tel:+994552304046" className="underline">
              +994 55 230 40 46
            </a>
            .
          </div>
        )}

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Time */}
          <div className="flex flex-col gap-3">
            <p className="label">Time / Vaxt</p>
            <div className="flex flex-wrap gap-2">
              {loadingSlots && <p className="font-sans text-sm text-muted">Loading…</p>}
              {!loadingSlots &&
                roofOpen &&
                slots.map((s) => {
                  const full = s.remaining <= 0;
                  const selected = time === s.time;
                  return (
                    <button
                      type="button"
                      key={s.time}
                      disabled={full}
                      onClick={() => {
                        setTime(s.time);
                        setFieldErrors((f) => ({ ...f, time: undefined }));
                      }}
                      className={`rounded-lg border px-4 py-2.5 font-sans text-sm transition-colors ${
                        full
                          ? "cursor-not-allowed border-border/50 text-muted2"
                          : selected
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-surface text-foreground hover:border-accent/50"
                      }`}
                    >
                      {formatSlotLabel(s.time)}
                    </button>
                  );
                })}
            </div>
            {roofOpen && <p className="font-sans text-xs text-muted2">Faded times are full tonight.</p>}
            {fieldErrors.time && (
              <p className="font-sans text-xs font-medium text-rose-600 dark:text-rose-400">{fieldErrors.time}</p>
            )}
          </div>

          {/* Guests */}
          <div className="flex flex-col gap-3">
            <p className="label">Guests / Qonaqlar</p>
            <div className="input flex items-center justify-between">
              <button
                type="button"
                aria-label="Fewer guests"
                onClick={() => setParty((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground hover:border-accent"
              >
                –
              </button>
              <span className="font-serif text-lg font-semibold">{party}</span>
              <button
                type="button"
                aria-label="More guests"
                onClick={() => setParty((p) => Math.min(12, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-foreground hover:border-accent"
              >
                +
              </button>
            </div>
            <p className="font-sans text-xs text-muted2">Twenty-six seats and a bar, rooftop only.</p>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <p className="label">Your details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <input
                className={`input ${fieldErrors.name ? "border-rose-500" : ""}`}
                placeholder="Name / Ad"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors((f) => ({ ...f, name: undefined }));
                }}
              />
              {fieldErrors.name && (
                <p className="mt-1.5 font-sans text-xs font-medium text-rose-600 dark:text-rose-400">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <input
                className={`input ${fieldErrors.phone ? "border-rose-500" : ""}`}
                placeholder="Phone / Telefon"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setFieldErrors((f) => ({ ...f, phone: undefined }));
                }}
              />
              {fieldErrors.phone && (
                <p className="mt-1.5 font-sans text-xs font-medium text-rose-600 dark:text-rose-400">
                  {fieldErrors.phone}
                </p>
              )}
            </div>
          </div>
          <div>
            <input
              className={`input ${fieldErrors.email ? "border-rose-500" : ""}`}
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
            />
            {fieldErrors.email && (
              <p className="mt-1.5 font-sans text-xs font-medium text-rose-600 dark:text-rose-400">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <textarea
            className="input min-h-[88px] resize-y"
            placeholder="Occasion, allergies, anything we should know"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-4">
        <div className="card flex flex-col gap-4 bg-accent/[0.03] p-6">
          <p className="eyebrow">Your table</p>
          <div className="flex flex-col gap-2.5 font-sans text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Date</span>
              <span className="text-foreground">{selectedDate?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Time</span>
              <span className="text-foreground">{time ? formatSlotLabel(time) : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Guests</span>
              <span className="text-foreground">{party}</span>
            </div>
            {selectedSlot && time && (
              <div className="flex justify-between">
                <span className="text-muted">Seats left</span>
                <span className="text-foreground">{selectedSlot.remaining}</span>
              </div>
            )}
          </div>
          <p className="border-t border-border/70 pt-3.5 font-sans text-xs leading-relaxed text-muted">
            The roof closes in bad weather — we call to rebook.
          </p>
          {serverError && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 font-sans text-sm text-rose-700 dark:text-rose-300">
              {serverError}
            </p>
          )}
          <button type="submit" className="btn-solid w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Request this table"}
          </button>
        </div>
      </div>
    </form>
  );
}
