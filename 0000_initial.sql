-- ============================================================
-- Nasaan Ba? — Initial schema migration
-- Run once via runMigrations() in src/database/client.ts
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- (Drizzle-generated CREATE TABLE statements for categories, locations,
--  items, item_locations, tags, item_tags, reminders go here once you
--  run `npm run db:generate`. Kept out of this hand-written file to avoid
--  drift between schema.ts and the SQL — always generate, don't hand-edit
--  the CREATE TABLEs.)

-- ------------------------------------------------------------
-- FTS5 virtual table for search (Rule: search must be fast from MVP,
-- not bolted on later — see architecture discussion)
-- ------------------------------------------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  item_id UNINDEXED,
  name,
  description,
  notes,
  category_name,
  location_path,
  tags
);

-- Keep items_fts in sync on item insert
CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(item_id, name, description, notes, category_name, location_path, tags)
  VALUES (
    new.id,
    new.name,
    coalesce(new.description, ''),
    coalesce(new.notes, ''),
    (SELECT name FROM categories WHERE id = new.category_id),
    '',
    ''
  );
END;

-- Keep items_fts in sync on item update
CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
  DELETE FROM items_fts WHERE item_id = old.id;
  INSERT INTO items_fts(item_id, name, description, notes, category_name, location_path, tags)
  VALUES (
    new.id,
    new.name,
    coalesce(new.description, ''),
    coalesce(new.notes, ''),
    (SELECT name FROM categories WHERE id = new.category_id),
    '',
    ''
  );
END;

-- Keep items_fts in sync on item delete
CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
  DELETE FROM items_fts WHERE item_id = old.id;
END;

-- ------------------------------------------------------------
-- Data integrity guards (spec section 2.11) enforced at the DB layer,
-- not just in the UI — a bug in a screen should not corrupt data.
-- ------------------------------------------------------------

-- Rule 3: No self-parent
CREATE TRIGGER IF NOT EXISTS trg_locations_no_self_parent
BEFORE INSERT ON locations
WHEN new.parent_id = new.id
BEGIN
  SELECT RAISE(ABORT, 'A location cannot be its own parent');
END;

CREATE TRIGGER IF NOT EXISTS trg_locations_no_self_parent_update
BEFORE UPDATE OF parent_id ON locations
WHEN new.parent_id = new.id
BEGIN
  SELECT RAISE(ABORT, 'A location cannot be its own parent');
END;

-- Rule 2: No circular locations — checked in application code
-- (location.service.ts) via ancestor-walk before UPDATE, because SQLite
-- triggers can't easily walk a recursive chain of *pending* changes.
-- This is intentional: the trigger above catches the trivial case for
-- free, the service layer catches the deep case with a clear error
-- message the UI can show the user.

-- Rule 4: Only one current location per item — enforced via a partial
-- unique index rather than a trigger, so it's checked by SQLite itself
-- on every INSERT/UPDATE, not just ones the trigger authors thought of.
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_locations_one_current
ON item_locations(item_id)
WHERE is_current = 1;
