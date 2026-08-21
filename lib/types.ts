export type ReservationStatus = "pending" | "confirmed" | "seated" | "cancelled" | "deleted";

export interface Reservation {
  id: string;
  confirmationCode: string; // memorable, e.g. "GOLDEN-TERRACE-07"
  name: string;
  phone: string;
  email?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  partySize: number;
  notes?: string;
  status: ReservationStatus;
  /** Status held before the most recent status change — lets "Restore" undo a cancel or delete. */
  previousStatus?: ReservationStatus;
  source: "customer" | "admin";
  createdAt: string;
}

export interface MenuItem {
  id: string;
  category: string; // "Red" | "White" | "Rosé" | "Other" | "Non alcohol" | "Snacks"
  name: string;
  description?: string; // tasting note — shown on featured/"By the glass" cards
  /** Wine-style pricing. Absent glassPrice renders as "—" (bottle-only pour). */
  glassPrice?: number | null;
  bottlePrice?: number | null;
  /** Flat pricing for snacks, non-alcoholic drinks, cocktails (no glass/bottle split). */
  price?: number | null;
  currency: string;
  available: boolean;
  /** Shown in the homepage "By the glass" highlight strip. */
  featured?: boolean;
  /** Representative photo for this item's category (shared across items in the category). */
  imageUrl?: string;
}

export interface Settings {
  /** damm. is rooftop-only — one seating, one capacity number. */
  totalSeats: number;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  slotMinutes: number;
  lastSeatingOffsetMinutes: number; // minutes before closeTime for last reservation
  monthlyBookingGoal: number;
  /** The nightly "weather call" — when false, the roof is closed and booking is paused. */
  roofOpen: boolean;
}

export interface Session {
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface Database {
  reservations: Reservation[];
  menu: MenuItem[];
  settings: Settings;
  sessions: Session[];
}
