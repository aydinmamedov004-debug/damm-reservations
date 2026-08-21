// Site photography. The hero and image-band shots are real damm. photos
// (supplied directly by the business, saved to public/images/) — everything
// else is free-to-use photography sourced from Wikimedia Commons (public
// domain / CC0 where possible, attribution-only otherwise — never scraped
// from Instagram or paid stock). One representative image per menu category,
// not per SKU — see README for why. Credits for anything requiring
// attribution are listed in the footer.

export interface CreditedImage {
  url: string;
  alt: string;
  credit?: string; // only set when the license requires attribution
}

export const SITE_IMAGES: Record<"hero" | "band" | "visit", CreditedImage> = {
  hero: {
    url: "/images/hero.jpg",
    alt: "Wine glasses on the rooftop at dusk, Baku skyline behind",
  },
  band: {
    url: "/images/band.jpg",
    alt: "Sunset over the rooftop terrace",
  },
  visit: {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Icheri_sheher_01.JPG",
    alt: "İçərişəhər, Baku's Old City",
    credit: "Icheri sheher, Wikimedia Commons (CC BY-SA 3.0)",
  },
};

export const CATEGORY_IMAGES: Record<string, CreditedImage> = {
  Red: {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg",
    alt: "Glass of red wine",
  },
  White: {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg",
    alt: "Glass of white wine",
  },
  "Rosé": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/87/Minervois_rose_wine.jpg",
    alt: "Glass of rosé wine",
    credit: "Jeremy Atkinson, Wikimedia Commons (CC BY 2.0)",
  },
  Other: {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/59/Aperol_Spritz_2014a.jpg",
    alt: "Aperol Spritz",
    credit: "Geolina163, Wikimedia Commons (CC BY-SA 4.0)",
  },
  "Non alcohol": {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Glass_of_lemonade.jpg",
    alt: "Glass of lemonade",
    credit: "Lemur12, Wikimedia Commons (CC BY 3.0)",
  },
  Snacks: {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg",
    alt: "Cheese and charcuterie platter",
  },
};

/** Every image that needs a visible credit line, deduped, for the footer. */
export function allImageCredits(): string[] {
  const all = [...Object.values(SITE_IMAGES), ...Object.values(CATEGORY_IMAGES)];
  return Array.from(new Set(all.filter((i) => i.credit).map((i) => i.credit as string)));
}
