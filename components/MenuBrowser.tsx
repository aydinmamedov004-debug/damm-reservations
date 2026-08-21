"use client";

import { useMemo, useState } from "react";
import { MenuItem } from "@/lib/types";
import { formatMenuPrice } from "@/lib/menuFormat";
import { CATEGORY_IMAGES } from "@/lib/images";

export default function MenuBrowser({ menu }: { menu: MenuItem[] }) {
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const m of menu) if (!seen.includes(m.category)) seen.push(m.category);
    return seen;
  }, [menu]);

  const [active, setActive] = useState("All");

  const groups = useMemo(() => {
    const cats = active === "All" ? categories : categories.filter((c) => c === active);
    return cats.map((category) => ({
      category,
      items: menu.filter((m) => m.category === category),
    }));
  }, [menu, categories, active]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        {["All", ...categories].map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={active === c ? "pill-on" : "pill-off"}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-x-14 gap-y-10 sm:grid-cols-2">
        {groups.map(({ category, items }) => (
          <div key={category} className="flex flex-col gap-3">
            <div className="flex items-center gap-3 border-b border-foreground/80 pb-2">
              {CATEGORY_IMAGES[category] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={CATEGORY_IMAGES[category].url}
                  alt={CATEGORY_IMAGES[category].alt}
                  className="h-11 w-11 flex-none rounded-full object-cover"
                />
              )}
              <h3 className="flex-1 text-lg font-serif font-semibold tracking-tight text-foreground">
                {category}
              </h3>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-wider text-muted">
                {category === "Other" || category === "Snacks" || category === "Non alcohol"
                  ? "AZN"
                  : "Glass / Bottle"}
              </span>
            </div>
            {items.map((item) => (
              <div key={item.id} className="flex items-baseline justify-between gap-4 py-0.5">
                <span className="font-sans text-[15px] text-foreground/90">{item.name}</span>
                <span className="flex-1 translate-y-[-4px] border-b border-dotted border-border" />
                <span className="whitespace-nowrap font-sans text-sm text-foreground/70">
                  {formatMenuPrice(item)}
                </span>
              </div>
            ))}
          </div>
        ))}
        {groups.every((g) => g.items.length === 0) && (
          <p className="font-sans text-muted">Nothing in this category yet.</p>
        )}
      </div>
    </div>
  );
}
