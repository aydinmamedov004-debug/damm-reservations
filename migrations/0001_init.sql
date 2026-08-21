-- Initial schema for damm. reservations — mirrors lib/types.ts.
-- Apply locally with:  npx wrangler d1 migrations apply damm-reservations-db --local
-- Apply in prod with:  npx wrangler d1 migrations apply damm-reservations-db --remote

CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  confirmation_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date TEXT NOT NULL,           -- YYYY-MM-DD
  time TEXT NOT NULL,           -- HH:mm
  party_size INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL,         -- pending | confirmed | seated | cancelled | deleted
  previous_status TEXT,
  source TEXT NOT NULL,         -- customer | admin
  created_at TEXT NOT NULL
);

CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date_time ON reservations(date, time);

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  glass_price REAL,
  bottle_price REAL,
  price REAL,
  currency TEXT NOT NULL DEFAULT 'AZN',
  available INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_menu_items_category ON menu_items(category);

-- Single-row settings table (id is always 1).
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_seats INTEGER NOT NULL,
  open_time TEXT NOT NULL,
  close_time TEXT NOT NULL,
  slot_minutes INTEGER NOT NULL,
  last_seating_offset_minutes INTEGER NOT NULL,
  monthly_booking_goal INTEGER NOT NULL,
  roof_open INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ---------- Seed data ----------

INSERT INTO settings (id, total_seats, open_time, close_time, slot_minutes, last_seating_offset_minutes, monthly_booking_goal, roof_open)
VALUES (1, 26, '18:00', '02:00', 30, 90, 500, 1);

INSERT INTO menu_items (id, category, name, description, glass_price, bottle_price, price, currency, available, featured, image_url, sort_order) VALUES
('m1', 'Red', 'Chabiant Red Semi Dry', NULL, 8.5, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 0),
('m2', 'Red', 'Chabiant Red Dry', NULL, 8.5, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 1),
('m3', 'Red', 'Chabiant Red Semi Sweet', NULL, 8.5, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 2),
('m4', 'Red', 'Savalan Red Semi Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 3),
('m5', 'Red', 'Savalan Red Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 4),
('m6', 'Red', 'Savalan Red Semi Sweet', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 5),
('m7', 'Red', 'İvanovka Bağları 1954 Red Dry', NULL, NULL, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 6),
('m8', 'Red', 'İvanovka Bağları 1954 Red Semi Sweet', NULL, NULL, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 7),
('m9', 'Red', 'Göygöl Red Semi Dry', NULL, 8, 40, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 8),
('m10', 'Red', 'Göygöl Red Dry', NULL, 8, 40, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 9),
('m11', 'Red', 'Göygöl Red Semi Sweet', NULL, 8, 40, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 10),
('m12', 'Red', 'Chabiant Madrasa Red Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 11),
('m13', 'Red', 'Savalan Syrah Red Dry', 'Dark fruit, soft tannin — the bottle we open most', NULL, 50, NULL, 'AZN', 1, 1, 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Glass_of_red_wine.jpg', 12),
('m14', 'White', 'Chabiant White Semi Dry', NULL, 8.5, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 13),
('m15', 'White', 'Chabiant White Dry', NULL, 8.5, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 14),
('m16', 'White', 'Chabiant White Semi Sweet', NULL, 8.5, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 15),
('m17', 'White', 'Savalan White Semi Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 16),
('m18', 'White', 'Savalan White Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 17),
('m19', 'White', 'Savalan White Semi Sweet', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 18),
('m20', 'White', 'Göygöl White Semi Dry', NULL, 8, 40, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 19),
('m21', 'White', 'Göygöl White Dry', NULL, 8, 40, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 20),
('m22', 'White', 'Göygöl White Semi Sweet', NULL, 8, 40, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 21),
('m23', 'White', 'Chabiant Bayan Shira Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 22),
('m24', 'White', 'Savalan Moscato Semi Dry', NULL, 9, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 23),
('m25', 'White', 'Dilbazi Bayan Shira Semi Dry', 'Semi dry, local grape, cold and citric', 10, 50, NULL, 'AZN', 1, 1, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 24),
('m26', 'White', 'Prosecco Astoria Casa Diletta White', 'For the first hour of the sunset', 12, 60, NULL, 'AZN', 1, 1, 'https://upload.wikimedia.org/wikipedia/commons/6/67/Glass_wine_white_background.jpg', 25),
('m27', 'Rosé', 'Chabiant Rose Dry', NULL, 8.5, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/8/87/Minervois_rose_wine.jpg', 26),
('m28', 'Rosé', 'Savalan Rose Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/8/87/Minervois_rose_wine.jpg', 27),
('m29', 'Rosé', 'Chabiant Madrasa Rose Dry', NULL, NULL, 50, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/8/87/Minervois_rose_wine.jpg', 28),
('m30', 'Other', 'Ağsu Nar', NULL, 8, 40, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/5/59/Aperol_Spritz_2014a.jpg', 29),
('m31', 'Other', 'Chabiant Pomegranate', NULL, NULL, 45, NULL, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/5/59/Aperol_Spritz_2014a.jpg', 30),
('m32', 'Other', 'Aperol Spritz', NULL, NULL, NULL, 15, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/5/59/Aperol_Spritz_2014a.jpg', 31),
('m33', 'Non alcohol', 'Mango Lime lemonade', NULL, NULL, NULL, 12, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Glass_of_lemonade.jpg', 32),
('m34', 'Non alcohol', 'Strawberry Lemonade', NULL, NULL, NULL, 12, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Glass_of_lemonade.jpg', 33),
('m35', 'Non alcohol', 'Still water', NULL, NULL, NULL, 4, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Glass_of_lemonade.jpg', 34),
('m36', 'Non alcohol', 'Sparkling water', NULL, NULL, NULL, 5, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Glass_of_lemonade.jpg', 35),
('m37', 'Snacks', 'Wine Snack Sticks', NULL, NULL, NULL, 8, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 36),
('m38', 'Snacks', 'Trio Wine Snacks', NULL, NULL, NULL, 9, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 37),
('m39', 'Snacks', 'Bruschettas', NULL, NULL, NULL, 14, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 38),
('m40', 'Snacks', 'Wine Board', NULL, NULL, NULL, 30, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 39),
('m41', 'Snacks', 'Cheese Board', NULL, NULL, NULL, 20, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 40),
('m42', 'Snacks', 'Edamame', NULL, NULL, NULL, 9, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 41),
('m43', 'Snacks', 'Humus', NULL, NULL, NULL, 10, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 42),
('m44', 'Snacks', 'Aperitivo Set', NULL, NULL, NULL, 14, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 43),
('m45', 'Snacks', 'Olive with Cheese', NULL, NULL, NULL, 10, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 44),
('m46', 'Snacks', 'Olive', NULL, NULL, NULL, 5, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 45),
('m47', 'Snacks', 'Almond', NULL, NULL, NULL, 9, 'AZN', 1, 0, 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Summer_Cheese_Platter_%28Unsplash%29.jpg', 46);
