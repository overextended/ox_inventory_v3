CREATE TABLE
  IF NOT EXISTS items (name TEXT PRIMARY KEY, category TEXT, data BLOB NOT NULL) WITHOUT ROWID;

CREATE TABLE
  IF NOT EXISTS inventory_items (
    uniqueId INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    inventoryId TEXT NULL,
    data BLOB NOT NULL,
    lastModified DATETIME DEFAULT CURRENT_TIMESTAMP
  );

CREATE INDEX IF NOT EXISTS category ON items (category);

CREATE INDEX IF NOT EXISTS inventoryId ON inventory_items (inventoryId);

CREATE TRIGGER IF NOT EXISTS set_lastModified BEFORE
UPDATE ON inventory_items FOR EACH ROW BEGIN
UPDATE inventory_items
SET
  lastModified=strftime ('%s', 'now')
WHERE
  uniqueId=OLD.uniqueId;

END;
