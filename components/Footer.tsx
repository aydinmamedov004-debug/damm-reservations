import Link from "next/link";
import { allImageCredits } from "@/lib/images";

export default function Footer() {
  const credits = allImageCredits();
  return (
    <footer className="border-t border-border/70 bg-surface2">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-3">
        <div>
          <div className="font-serif text-lg font-bold text-foreground">damm.</div>
          <p className="mt-2 font-sans text-sm leading-relaxed text-muted">
            Rooftop wine space
            <br />
            İçərişəhər, Bakı
          </p>
        </div>
        <div className="font-sans text-sm text-foreground/80">
          <p className="eyebrow mb-3">Hours</p>
          <p>Every evening 18:00 – 02:00</p>
          <p className="mt-1 text-muted">Weather permitting</p>
        </div>
        <div className="font-sans text-sm text-foreground/80">
          <p className="eyebrow mb-3">Contact</p>
          <a href="tel:+994552304046" className="block transition-colors hover:text-accent">
            +994 55 230 40 46
          </a>
          <a
            href="https://instagram.com/damm.local"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block transition-colors hover:text-accent"
          >
            @damm.local
          </a>
        </div>
      </div>
      <div className="border-t border-border/70 px-6 py-5 text-center font-sans text-xs uppercase tracking-widest text-muted">
        <Link href="/admin" className="hover:text-accent">
          Staff Login
        </Link>
      </div>
      {credits.length > 0 && (
        <div className="border-t border-border/70 px-6 py-3 text-center font-sans text-[11px] normal-case tracking-normal text-muted/70">
          Photos: {credits.join(" · ")}
        </div>
      )}
    </footer>
  );
}
