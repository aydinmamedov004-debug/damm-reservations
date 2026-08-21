import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthed } from "@/lib/auth";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-surface2/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link href="/admin" className="font-serif text-base font-bold text-foreground">
            damm. <span className="font-sans text-xs font-normal text-muted">admin</span>
          </Link>
          <div className="flex items-center gap-5 font-sans text-sm text-muted">
            <Link href="/" className="hidden transition-colors hover:text-accent sm:inline">
              View site
            </Link>
            <AdminLogoutButton />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
