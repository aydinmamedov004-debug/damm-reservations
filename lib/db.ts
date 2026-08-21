import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";
import { Reservation, MenuItem, Session, Settings } from "./types";
import { generateConfirmationCode } from "./confirmationCode";

async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB as unknown as D1Database;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const LIVE_STATUSES = "('pending','confirmed','seated')";

// ---------- Row <-> domain-object mapping ----------

interface ReservationRow {
  id: string;
  confirmation_code: string;
  name: string;
  phone: string;
  email: string | null;
  date: string;
  time: string;
  party_size: number;
  notes: string | null;
  status: string;
  previous_status: string | null;
  source: string;
  created_at: string;
}

function rowToReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    confirmationCode: row.confirmation_code,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    date: row.date,
    time: row.time,
    partySize: row.party_size,
    notes: row.notes ?? undefined,
    status: row.status as Reservation["status"],
    previousStatus: (row.previous_status as Reservation["status"] | null) ?? undefined,
    source: row.source as Reservation["source"],
    createdAt: row.created_at,
  };
}

interface MenuItemRow {
  id: string;
  category: string;
  name: string;
  description: string | null;
  glass_price: number | null;
  bottle_price: number | null;
  price: number | null;
  currency: string;
  available: number;
  featured: number;
  image_url: string | null;
}

function rowToMenuItem(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description ?? undefined,
    glassPrice: row.glass_price ?? undefined,
    bottlePrice: row.bottle_price ?? undefined,
    price: row.price ?? undefined,
    currency: row.currency,
    available: !!row.available,
    featured: !!row.featured,
    imageUrl: row.image_url ?? undefined,
  };
}

interface SettingsRow {
  total_seats: number;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  last_seating_offset_minutes: number;
  monthly_booking_goal: number;
  roof_open: number;
}

function rowToSettings(row: SettingsRow): Settings {
  return {
    totalSeats: row.total_seats,
    openTime: row.open_time,
    closeTime: row.close_time,
    slotMinutes: row.slot_minutes,
    lastSeatingOffsetMinutes: row.last_seating_offset_minutes,
    monthlyBookingGoal: row.monthly_booking_goal,
    roofOpen: !!row.roof_open,
  };
}

// ---------- Reservations ----------

export async function getReservations(): Promise<Reservation[]> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM reservations ORDER BY date, time")
    .all<ReservationRow>();
  return results.map(rowToReservation);
}

export async function getReservationsForDate(date: string): Promise<Reservation[]> {
  const db = await getDb();
  const { results } = await db
    .prepare(`SELECT * FROM reservations WHERE date = ?1 AND status IN ${LIVE_STATUSES} ORDER BY time`)
    .bind(date)
    .all<ReservationRow>();
  return results.map(rowToReservation);
}

export async function getSeatsBookedForSlot(date: string, time: string): Promise<number> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(party_size), 0) as total FROM reservations WHERE date = ?1 AND time = ?2 AND status IN ${LIVE_STATUSES}`
    )
    .bind(date, time)
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function createReservation(
  input: Omit<Reservation, "id" | "confirmationCode" | "status" | "createdAt">
): Promise<Reservation> {
  const db = await getDb();
  const { results: codeRows } = await db
    .prepare("SELECT confirmation_code FROM reservations")
    .all<{ confirmation_code: string }>();
  const existingCodes = new Set(codeRows.map((r) => r.confirmation_code));

  const reservation: Reservation = {
    ...input,
    id: genId("res"),
    confirmationCode: generateConfirmationCode(existingCodes),
    status: input.source === "admin" ? "confirmed" : "pending",
    createdAt: new Date().toISOString(),
  };

  await db
    .prepare(
      `INSERT INTO reservations
        (id, confirmation_code, name, phone, email, date, time, party_size, notes, status, previous_status, source, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`
    )
    .bind(
      reservation.id,
      reservation.confirmationCode,
      reservation.name,
      reservation.phone,
      reservation.email ?? null,
      reservation.date,
      reservation.time,
      reservation.partySize,
      reservation.notes ?? null,
      reservation.status,
      null,
      reservation.source,
      reservation.createdAt
    )
    .run();

  return reservation;
}

export async function updateReservation(
  id: string,
  patch: Partial<Pick<Reservation, "status" | "notes" | "partySize" | "time" | "date">>
): Promise<Reservation | null> {
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM reservations WHERE id = ?1").bind(id).first<ReservationRow>();
  if (!row) return null;

  const current = rowToReservation(row);
  // Whenever status actually changes, remember what it was so a later
  // "Restore" (undo cancel / undo delete) can put it back.
  const previousStatus =
    patch.status && patch.status !== current.status ? current.status : current.previousStatus;
  const merged: Reservation = { ...current, ...patch, previousStatus };

  await db
    .prepare(
      `UPDATE reservations
       SET status = ?1, notes = ?2, party_size = ?3, time = ?4, date = ?5, previous_status = ?6
       WHERE id = ?7`
    )
    .bind(
      merged.status,
      merged.notes ?? null,
      merged.partySize,
      merged.time,
      merged.date,
      merged.previousStatus ?? null,
      id
    )
    .run();

  return merged;
}

/** Hard, irreversible removal — only for permanently purging the trash. */
export async function purgeReservation(id: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.prepare("DELETE FROM reservations WHERE id = ?1").bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

export async function getMonthlyBookingCount(yearMonth: string): Promise<number> {
  // yearMonth: "YYYY-MM"
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COUNT(*) as count FROM reservations WHERE date LIKE ?1 AND status IN ${LIVE_STATUSES}`
    )
    .bind(`${yearMonth}%`)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

// ---------- Menu ----------

export async function getMenu(): Promise<MenuItem[]> {
  const db = await getDb();
  const { results } = await db
    .prepare("SELECT * FROM menu_items ORDER BY sort_order")
    .all<MenuItemRow>();
  return results.map(rowToMenuItem);
}

export async function createMenuItem(input: Omit<MenuItem, "id">): Promise<MenuItem> {
  const db = await getDb();
  const item: MenuItem = { ...input, id: genId("menu") };
  const maxRow = await db
    .prepare("SELECT COALESCE(MAX(sort_order), -1) as m FROM menu_items")
    .first<{ m: number }>();
  const sortOrder = (maxRow?.m ?? -1) + 1;

  await db
    .prepare(
      `INSERT INTO menu_items
        (id, category, name, description, glass_price, bottle_price, price, currency, available, featured, image_url, sort_order)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
    )
    .bind(
      item.id,
      item.category,
      item.name,
      item.description ?? null,
      item.glassPrice ?? null,
      item.bottlePrice ?? null,
      item.price ?? null,
      item.currency,
      item.available ? 1 : 0,
      item.featured ? 1 : 0,
      item.imageUrl ?? null,
      sortOrder
    )
    .run();

  return item;
}

export async function updateMenuItem(
  id: string,
  patch: Partial<Omit<MenuItem, "id">>
): Promise<MenuItem | null> {
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM menu_items WHERE id = ?1").bind(id).first<MenuItemRow>();
  if (!row) return null;

  const merged: MenuItem = { ...rowToMenuItem(row), ...patch };

  await db
    .prepare(
      `UPDATE menu_items
       SET category = ?1, name = ?2, description = ?3, glass_price = ?4, bottle_price = ?5,
           price = ?6, currency = ?7, available = ?8, featured = ?9, image_url = ?10
       WHERE id = ?11`
    )
    .bind(
      merged.category,
      merged.name,
      merged.description ?? null,
      merged.glassPrice ?? null,
      merged.bottlePrice ?? null,
      merged.price ?? null,
      merged.currency,
      merged.available ? 1 : 0,
      merged.featured ? 1 : 0,
      merged.imageUrl ?? null,
      id
    )
    .run();

  return merged;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const db = await getDb();
  const res = await db.prepare("DELETE FROM menu_items WHERE id = ?1").bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}

// ---------- Settings ----------

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const row = await db.prepare("SELECT * FROM settings WHERE id = 1").first<SettingsRow>();
  if (!row) {
    throw new Error("Settings row missing — did you run the D1 migration (0001_init.sql)?");
  }
  return rowToSettings(row);
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = await getDb();
  const current = await getSettings();
  const merged: Settings = { ...current, ...patch };

  await db
    .prepare(
      `UPDATE settings
       SET total_seats = ?1, open_time = ?2, close_time = ?3, slot_minutes = ?4,
           last_seating_offset_minutes = ?5, monthly_booking_goal = ?6, roof_open = ?7
       WHERE id = 1`
    )
    .bind(
      merged.totalSeats,
      merged.openTime,
      merged.closeTime,
      merged.slotMinutes,
      merged.lastSeatingOffsetMinutes,
      merged.monthlyBookingGoal,
      merged.roofOpen ? 1 : 0
    )
    .run();

  return merged;
}

// ---------- Sessions (admin auth) ----------

export async function createSession(): Promise<Session> {
  const db = await getDb();
  const now = new Date();
  const expires = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8h
  const session: Session = {
    token: genId("sess") + genId("tok"),
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  // prune expired
  await db.prepare("DELETE FROM sessions WHERE expires_at < ?1").bind(now.toISOString()).run();
  await db
    .prepare("INSERT INTO sessions (token, created_at, expires_at) VALUES (?1, ?2, ?3)")
    .bind(session.token, session.createdAt, session.expiresAt)
    .run();

  return session;
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const db = await getDb();
  const row = await db
    .prepare("SELECT 1 FROM sessions WHERE token = ?1 AND expires_at > ?2")
    .bind(token, new Date().toISOString())
    .first();
  return !!row;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await getDb();
  await db.prepare("DELETE FROM sessions WHERE token = ?1").bind(token).run();
}
