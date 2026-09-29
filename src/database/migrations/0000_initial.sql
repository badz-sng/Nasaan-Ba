PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp),
  updated_at TEXT NOT NULL DEFAULT (current_timestamp)
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  path TEXT NOT NULL,
  depth INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (current_timestamp),
  updated_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT,
  condition TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  photo_uri TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp),
  updated_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);

CREATE TABLE IF NOT EXISTS item_locations (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  started_at TEXT NOT NULL DEFAULT (current_timestamp),
  ended_at TEXT,
  is_current INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_item_locations_item_id ON item_locations(item_id);
CREATE INDEX IF NOT EXISTS idx_item_locations_location_id ON item_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_item_locations_is_current ON item_locations(is_current);
CREATE UNIQUE INDEX IF NOT EXISTS idx_item_locations_one_current
  ON item_locations(item_id) WHERE is_current = 1;

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (current_timestamp)
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  location_id TEXT REFERENCES locations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  remind_at TEXT NOT NULL,
  repeat_type TEXT NOT NULL DEFAULT 'NONE',
  status TEXT NOT NULL DEFAULT 'PENDING',
  notification_id TEXT,
  created_at TEXT NOT NULL DEFAULT (current_timestamp),
  updated_at TEXT NOT NULL DEFAULT (current_timestamp)
);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  item_id UNINDEXED,
  name,
  description,
  notes,
  category_name,
  location_path,
  tags,
  content=''
);

CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(item_id, name, description, notes, category_name, location_path, tags)
  VALUES (new.id, new.name, coalesce(new.description, ''), coalesce(new.notes, ''),
    (SELECT name FROM categories WHERE id = new.category_id), '', '');
END;

CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
  DELETE FROM items_fts WHERE item_id = old.id;
  INSERT INTO items_fts(item_id, name, description, notes, category_name, location_path, tags)
  VALUES (new.id, new.name, coalesce(new.description, ''), coalesce(new.notes, ''),
    (SELECT name FROM categories WHERE id = new.category_id), '', '');
END;

CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
  DELETE FROM items_fts WHERE item_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_locations_no_self_parent
BEFORE INSERT ON locations WHEN new.parent_id = new.id BEGIN
  SELECT RAISE(ABORT, 'A location cannot be its own parent');
END;

CREATE TRIGGER IF NOT EXISTS trg_locations_no_self_parent_update
BEFORE UPDATE OF parent_id ON locations WHEN new.parent_id = new.id BEGIN
  SELECT RAISE(ABORT, 'A location cannot be its own parent');
END;
