import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

function NavLink({ href, en, az }: { href: string; en: string; az: string }) {
  return (
    <Link href={href} className="group whitespace-nowrap transition-colors hover:text-accent">
      {en} <span className="text-muted2 group-hover:text-accent/70">· {az}</span>
    </Link>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-xl font-bold tracking-tight text-foreground">
          damm.
        </Link>
        <nav className="hidden items-center gap-6 font-sans text-sm text-foreground/70 lg:flex">
          <NavLink href="/menu#wine" en="Wine list" az="Şərab siyahısı" />
          <NavLink href="/menu#snacks" en="Snacks" az="Qəlyanaltı" />
          <NavLink href="/reserve" en="Reserve" az="Rezervasiya" />
          <NavLink href="/visit" en="Visit" az="Ünvan" />
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/reserve" className="btn-primary hidden !py-2.5 sm:inline-flex">
            Reserve a table
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
