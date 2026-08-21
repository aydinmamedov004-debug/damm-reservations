import Link from "next/link";
import { getMenu } from "@/lib/db";
import MenuBrowser from "@/components/MenuBrowser";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const allMenu = await getMenu();
  const menu = allMenu.filter((m) => m.available);

  return (
    <div>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 pb-8 pt-14 sm:flex-row sm:items-end sm:justify-between sm:pt-20">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl sm:text-5xl">Drink menu</h1>
          <p className="font-sans text-muted">Şərab siyahısı · prices in AZN, glass / bottle</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-16" id="wine">
        <MenuBrowser menu={menu} />
      </div>

      <div id="snacks" />

      <div className="border-t border-border/70 bg-surface2">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-sans text-sm text-foreground/80">
            Bottles change with what arrives — ask the bar what is open tonight.
          </p>
          <Link href="/reserve" className="btn-primary">
            Reserve a table
          </Link>
        </div>
      </div>
    </div>
  );
}
