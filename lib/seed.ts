// NOT imported by lib/db.ts anymore — since the Cloudflare D1 migration,
// seed data lives in migrations/0001_init.sql (generated from this exact
// list). Kept here as the readable source of truth for that data; if you
// add/change menu items going forward, either use /admin → Menu (writes
// straight to D1) or add a new migration — editing this file alone no
// longer affects a running app.
import { Database, MenuItem } from "./types";
import { CATEGORY_IMAGES } from "./images";

let n = 0;
const id = () => `m${++n}`;

function wine(
  category: string,
  name: string,
  glassPrice: number | null,
  bottlePrice: number,
  opts: { description?: string; featured?: boolean } = {}
): MenuItem {
  return {
    id: id(),
    category,
    name,
    glassPrice,
    bottlePrice,
    currency: "AZN",
    available: true,
    imageUrl: CATEGORY_IMAGES[category]?.url,
    ...opts,
  };
}

function flat(category: string, name: string, price: number): MenuItem {
  return {
    id: id(),
    category,
    name,
    price,
    currency: "AZN",
    available: true,
    imageUrl: CATEGORY_IMAGES[category]?.url,
  };
}

// The real damm. list — Azerbaijani wine houses (Chabiant, Savalan, Göygöl,
// İvanovka Bağları 1954) plus a short "Other" and non-alcoholic list, and
// snacks/boards. Prices in AZN, glass / bottle where the wine is poured by
// the glass (a "—" glass price means bottle-only).
const menu: MenuItem[] = [
  // Red
  wine("Red", "Chabiant Red Semi Dry", 8.5, 45),
  wine("Red", "Chabiant Red Dry", 8.5, 45),
  wine("Red", "Chabiant Red Semi Sweet", 8.5, 45),
  wine("Red", "Savalan Red Semi Dry", null, 50),
  wine("Red", "Savalan Red Dry", null, 50),
  wine("Red", "Savalan Red Semi Sweet", null, 50),
  wine("Red", "İvanovka Bağları 1954 Red Dry", null, 45),
  wine("Red", "İvanovka Bağları 1954 Red Semi Sweet", null, 45),
  wine("Red", "Göygöl Red Semi Dry", 8, 40),
  wine("Red", "Göygöl Red Dry", 8, 40),
  wine("Red", "Göygöl Red Semi Sweet", 8, 40),
  wine("Red", "Chabiant Madrasa Red Dry", null, 50),
  wine("Red", "Savalan Syrah Red Dry", null, 50, {
    description: "Dark fruit, soft tannin — the bottle we open most",
    featured: true,
  }),

  // White
  wine("White", "Chabiant White Semi Dry", 8.5, 45),
  wine("White", "Chabiant White Dry", 8.5, 45),
  wine("White", "Chabiant White Semi Sweet", 8.5, 45),
  wine("White", "Savalan White Semi Dry", null, 50),
  wine("White", "Savalan White Dry", null, 50),
  wine("White", "Savalan White Semi Sweet", null, 50),
  wine("White", "Göygöl White Semi Dry", 8, 40),
  wine("White", "Göygöl White Dry", 8, 40),
  wine("White", "Göygöl White Semi Sweet", 8, 40),
  wine("White", "Chabiant Bayan Shira Dry", null, 50),
  wine("White", "Savalan Moscato Semi Dry", 9, 50),
  wine("White", "Dilbazi Bayan Shira Semi Dry", 10, 50, {
    description: "Semi dry, local grape, cold and citric",
    featured: true,
  }),
  wine("White", "Prosecco Astoria Casa Diletta White", 12, 60, {
    description: "For the first hour of the sunset",
    featured: true,
  }),

  // Rosé
  wine("Rosé", "Chabiant Rose Dry", 8.5, 45),
  wine("Rosé", "Savalan Rose Dry", null, 50),
  wine("Rosé", "Chabiant Madrasa Rose Dry", null, 50),

  // Other
  wine("Other", "Ağsu Nar", 8, 40),
  wine("Other", "Chabiant Pomegranate", null, 45),
  flat("Other", "Aperol Spritz", 15),

  // Non alcohol
  flat("Non alcohol", "Mango Lime lemonade", 12),
  flat("Non alcohol", "Strawberry Lemonade", 12),
  flat("Non alcohol", "Still water", 4),
  flat("Non alcohol", "Sparkling water", 5),

  // Snacks
  flat("Snacks", "Wine Snack Sticks", 8),
  flat("Snacks", "Trio Wine Snacks", 9),
  flat("Snacks", "Bruschettas", 14),
  flat("Snacks", "Wine Board", 30),
  flat("Snacks", "Cheese Board", 20),
  flat("Snacks", "Edamame", 9),
  flat("Snacks", "Humus", 10),
  flat("Snacks", "Aperitivo Set", 14),
  flat("Snacks", "Olive with Cheese", 10),
  flat("Snacks", "Olive", 5),
  flat("Snacks", "Almond", 9),
];

export const seedDatabase: Database = {
  settings: {
    totalSeats: 26,
    openTime: "18:00",
    closeTime: "02:00",
    slotMinutes: 30,
    lastSeatingOffsetMinutes: 90, // last seating 00:30
    monthlyBookingGoal: 500,
    roofOpen: true,
  },
  sessions: [],
  reservations: [],
  menu,
};
