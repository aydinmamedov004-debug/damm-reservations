import Link from "next/link";
import { getMenu } from "@/lib/db";
import QuickReserveCard from "@/components/QuickReserveCard";
import { SITE_IMAGES, CATEGORY_IMAGES } from "@/lib/images";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const menu = await getMenu();
  const featured = menu.filter((m) => m.featured);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_460px] lg:gap-16 lg:py-24">
        <div className="flex flex-col gap-6">
          <p className="eyebrow">İçərişəhər · Old City, Baku</p>
          <h1 className="text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Wine, above
            <br />
            the Old City.
          </h1>
          <p className="max-w-md font-sans text-base leading-relaxed text-muted">
            A rooftop over the walls of İçərişəhər. Azerbaijani bottles, boards to share, and the
            whole city underneath you until two in the morning.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/reserve" className="btn-primary">
              Reserve a table
            </Link>
            <Link href="/menu" className="btn-outline">
              See the menu
            </Link>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SITE_IMAGES.hero.url}
          alt={SITE_IMAGES.hero.alt}
          className="hidden aspect-[4/5] w-full rounded-card object-cover lg:block"
        />
      </section>

      {/* Info bar */}
      <section className="border-y border-border/70 bg-surface2">
        <div className="mx-auto grid max-w-6xl divide-y divide-border/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex flex-col gap-1.5 px-6 py-6 sm:px-10">
            <p className="eyebrow">Hours</p>
            <p className="font-sans text-foreground">Every evening, 18:00 – 02:00</p>
            <p className="font-sans text-sm text-muted">Hər axşam · hava yaxşı olanda</p>
          </div>
          <div className="flex flex-col gap-1.5 px-6 py-6 sm:px-10">
            <p className="eyebrow">Where</p>
            <p className="font-sans text-foreground">Rooftop, Old City, Baku</p>
            <p className="font-sans text-sm text-muted">İçərişəhər, Bakı</p>
          </div>
          <div className="flex flex-col gap-1.5 px-6 py-6 sm:px-10">
            <p className="eyebrow">Bookings</p>
            <a href="tel:+994552304046" className="font-sans text-foreground hover:text-accent">
              +994 55 230 40 46
            </a>
            <p className="font-sans text-sm text-muted">Öncədən rezervasiya etməyi unutmayın.</p>
          </div>
        </div>
      </section>

      {/* By the glass */}
      {featured.length > 0 && (
        <section id="wine" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <div className="mb-8 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-[30px]">By the glass</h2>
              <span className="font-sans text-sm text-muted">Bu axşam</span>
            </div>
            <Link href="/menu" className="font-sans text-sm text-accent hover:underline">
              Full list →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {featured.map((w) => (
              <div key={w.id} className="card flex flex-col gap-2.5 p-6">
                {CATEGORY_IMAGES[w.category] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={CATEGORY_IMAGES[w.category].url}
                    alt={CATEGORY_IMAGES[w.category].alt}
                    className="mb-1 h-32 w-full rounded-lg object-cover"
                  />
                )}
                <p className="font-sans text-[11px] font-semibold uppercase tracking-wider text-accent">
                  {w.category}
                </p>
                <p className="text-lg font-serif font-semibold tracking-tight text-foreground">
                  {w.name}
                </p>
                <p className="font-sans text-sm leading-relaxed text-muted">{w.description}</p>
                <div className="mt-1 flex gap-4 border-t border-border/70 pt-3.5 font-sans text-sm text-foreground/80">
                  <span>Glass {w.glassPrice != null ? `${w.glassPrice} ₼` : "—"}</span>
                  <span className="text-border">·</span>
                  <span>Bottle {w.bottlePrice} ₼</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Image band — a real photo of the roof at sunset, shown near its
          native portrait crop rather than forced into a wide letterbox */}
      <div className="mx-auto max-w-6xl px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={SITE_IMAGES.band.url}
          alt={SITE_IMAGES.band.alt}
          className="mx-auto aspect-[3/4] w-full max-w-md rounded-card object-cover sm:max-w-lg"
        />
      </div>

      {/* Book ahead */}
      <section id="reserve" className="mx-auto grid max-w-6xl gap-14 px-6 py-16 sm:py-20 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-4">
          <h2 className="text-2xl sm:text-[30px] leading-tight">Book ahead — the roof is small.</h2>
          <p className="font-sans text-base leading-relaxed text-muted">
            Twenty-six seats and a bar. Reservations open two weeks out; if the weather turns we
            call you before service.
          </p>
          <p className="font-sans text-sm text-muted">Öncədən rezervasiya etməyi unutmayın.</p>
        </div>
        <QuickReserveCard />
      </section>
    </>
  );
}
