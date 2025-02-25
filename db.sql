CREATE TABLE items (
  name TEXT PRIMARY KEY,
  category TEXT,
  data BLOB NOT NULL
) WITHOUT ROWID;

CREATE TABLE inventories (
  inventoryId TEXT PRIMARY KEY,
  type TEXT,
  data BLOB NOT NULL
) WITHOUT ROWID;

CREATE TABLE inventory_items (
  uniqueId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  inventoryId TEXT NULL,
  data BLOB NOT NULL
);

CREATE INDEX category ON items(category);
CREATE INDEX type ON inventories(type);
CREATE INDEX inventoryId ON inventory_items(inventoryId);

INSERT INTO items (name, category, data) VALUES
  ('ammo_9', 'ammo', jsonb('{ label: "9mm", weight: 7 }')),
  ('HeavyPistol', 'weapon', jsonb('{ label: "Heavy Pistol", weight: 1100, width: 2, height: 2 }')),
  ('HeavyRifle', 'weapon', jsonb('{ label: "Heavy Rifle", weight: 3300, width: 7, height: 3 }'));
