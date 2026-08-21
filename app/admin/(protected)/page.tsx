import { getReservations, getMonthlyBookingCount, getSettings, getMenu } from "@/lib/db";
import AdminShell from "@/components/AdminShell";

export const dynamic = "force-dynamic";

function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export default async function AdminPage() {
  const today = todayISO();
  const [reservations, menu, settings, monthlyCount] = await Promise.all([
    getReservations(),
    getMenu(),
    getSettings(),
    getMonthlyBookingCount(today.slice(0, 7)),
  ]);

  return (
    <AdminShell
      initialReservations={reservations}
      initialMenu={menu}
      initialSettings={settings}
      monthlyCount={monthlyCount}
      today={today}
    />
  );
}
