import { Suspense } from "react";
import ReservationForm from "@/components/ReservationForm";

export const dynamic = "force-dynamic";

export default function ReservePage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-14 sm:py-20">
      <div className="mb-10 flex flex-col gap-2">
        <h1 className="text-4xl sm:text-5xl">Reserve a table</h1>
        <p className="font-sans text-muted">Rezervasiya · everything on one page, confirmed by SMS</p>
      </div>

      <Suspense fallback={<p className="font-sans text-muted">Loading…</p>}>
        <ReservationForm />
      </Suspense>
    </div>
  );
}
