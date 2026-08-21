import { SITE_IMAGES } from "@/lib/images";

export default function VisitPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <div className="mb-10 flex flex-col gap-2">
        <h1 className="text-4xl sm:text-5xl">Visit</h1>
        <p className="font-sans text-muted">Əlaqə · İçərişəhər, Bakı</p>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={SITE_IMAGES.visit.url}
        alt={SITE_IMAGES.visit.alt}
        className="mb-10 aspect-[16/7] w-full rounded-card object-cover"
      />

      <div className="card divide-y divide-border/70">
        <div className="flex flex-col gap-1 p-6">
          <p className="eyebrow">Address</p>
          <p className="font-sans text-foreground">
            Old City (İçərişəhər), Baku — rooftop, entrance through the courtyard
          </p>
        </div>
        <div className="flex flex-col gap-1 p-6">
          <p className="eyebrow">Hours</p>
          <p className="font-sans text-foreground">Every evening 18:00 – 02:00</p>
          <p className="font-sans text-sm text-muted">Rooftop opens when the weather allows</p>
        </div>
        <div className="flex flex-col gap-1 p-6">
          <p className="eyebrow">Contact</p>
          <a href="tel:+994552304046" className="font-sans text-foreground hover:text-accent">
            +994 55 230 40 46
          </a>
          <a
            href="https://instagram.com/damm.local"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-accent hover:underline"
          >
            @damm.local
          </a>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <a
          href="https://maps.app.goo.gl/yhuHDc6bayAkDthaA?g_st=ic"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1"
        >
          Open in Maps
        </a>
        <a href="tel:+994552304046" className="btn-outline flex-1">
          Call
        </a>
      </div>
    </div>
  );
}
