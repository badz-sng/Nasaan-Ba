-- Replace the contentless index: these sync triggers need readable, mutable rows.
DROP TRIGGER IF EXISTS items_ai;
DROP TRIGGER IF EXISTS items_au;
DROP TRIGGER IF EXISTS items_ad;
DROP TRIGGER IF EXISTS item_locations_ai_fts;
DROP TRIGGER IF EXISTS item_locations_au_fts;
DROP TRIGGER IF EXISTS item_tags_ai_fts;
DROP TRIGGER IF EXISTS item_tags_ad_fts;
DROP TRIGGER IF EXISTS locations_au_fts_path;
DROP TABLE IF EXISTS items_fts;
CREATE VIRTUAL TABLE items_fts USING fts5(
  item_id UNINDEXED, name, description, notes, category_name, location_path, tags
);
CREATE VIEW item_search_data AS
SELECT i.id AS item_id, i.name, coalesce(i.description, '') AS description,
  coalesce(i.notes, '') AS notes, coalesce(c.name, '') AS category_name,
  coalesce(l.path, '') AS location_path,
  coalesce((SELECT group_concat(t.name, ' ') FROM item_tags it
    JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id), '') AS tags
FROM items i
LEFT JOIN categories c ON c.id = i.category_id
LEFT JOIN item_locations il ON il.item_id = i.id AND il.is_current = 1
LEFT JOIN locations l ON l.id = il.location_id;
INSERT INTO items_fts SELECT * FROM item_search_data;

CREATE TRIGGER items_ai AFTER INSERT ON items BEGIN
  DELETE FROM items_fts WHERE item_id = new.id;
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id = new.id;
END;

CREATE TRIGGER items_au AFTER UPDATE ON items BEGIN
  DELETE FROM items_fts WHERE item_id = new.id;
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id = new.id;
END;

CREATE TRIGGER items_ad AFTER DELETE ON items BEGIN
  DELETE FROM items_fts WHERE item_id = old.id;
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id = old.id;
END;

CREATE TRIGGER item_locations_ai_fts AFTER INSERT ON item_locations BEGIN
  DELETE FROM items_fts WHERE item_id = new.item_id;
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id = new.item_id;
END;

CREATE TRIGGER item_locations_au_fts AFTER UPDATE ON item_locations BEGIN
  DELETE FROM items_fts WHERE item_id IN (old.item_id, new.item_id);
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id IN (old.item_id, new.item_id);
END;

CREATE TRIGGER item_locations_ad_fts AFTER DELETE ON item_locations BEGIN
  DELETE FROM items_fts WHERE item_id = old.item_id;
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id = old.item_id;
END;

CREATE TRIGGER item_tags_ai_fts AFTER INSERT ON item_tags BEGIN
  DELETE FROM items_fts WHERE item_id = new.item_id;
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id = new.item_id;
END;

CREATE TRIGGER item_tags_ad_fts AFTER DELETE ON item_tags BEGIN
  DELETE FROM items_fts WHERE item_id = old.item_id;
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id = old.item_id;
END;

CREATE TRIGGER locations_au_fts_path AFTER UPDATE OF path ON locations BEGIN
  DELETE FROM items_fts WHERE item_id IN (SELECT item_id FROM item_locations WHERE location_id = new.id AND is_current = 1);
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id IN (SELECT item_id FROM item_locations WHERE location_id = new.id AND is_current = 1);
END;

CREATE TRIGGER categories_au_fts AFTER UPDATE OF name ON categories BEGIN
  DELETE FROM items_fts WHERE item_id IN (SELECT id FROM items WHERE category_id = new.id);
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id IN (SELECT id FROM items WHERE category_id = new.id);
END;

CREATE TRIGGER tags_au_fts AFTER UPDATE OF name ON tags BEGIN
  DELETE FROM items_fts WHERE item_id IN (SELECT item_id FROM item_tags WHERE tag_id = new.id);
  INSERT INTO items_fts SELECT * FROM item_search_data WHERE item_id IN (SELECT item_id FROM item_tags WHERE tag_id = new.id);
END;
