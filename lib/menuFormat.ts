import { MenuItem } from "./types";

/** "8.5 / 45", "— / 50", or a flat "15" depending on how the item is priced. */
export function formatMenuPrice(item: Pick<MenuItem, "glassPrice" | "bottlePrice" | "price">): string {
  if (item.bottlePrice != null) {
    const glass = item.glassPrice != null ? item.glassPrice : "—";
    return `${glass} / ${item.bottlePrice}`;
  }
  if (item.price != null) return String(item.price);
  return "—";
}
