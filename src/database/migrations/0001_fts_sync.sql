-- Keeps items_fts location_path and tags in sync when item_locations
-- or item_tags change.

CREATE TRIGGER IF NOT EXISTS item_locations_ai_fts AFTER INSERT ON item_locations
WHEN new.is_current = 1 BEGIN
  UPDATE items_fts SET location_path = (
    SELECT path FROM locations WHERE id = new.location_id
  ) WHERE item_id = new.item_id;
END;

CREATE TRIGGER IF NOT EXISTS item_locations_au_fts AFTER UPDATE ON item_locations
WHEN new.is_current = 1 BEGIN
  UPDATE items_fts SET location_path = (
    SELECT path FROM locations WHERE id = new.location_id
  ) WHERE item_id = new.item_id;
END;

CREATE TRIGGER IF NOT EXISTS item_tags_ai_fts AFTER INSERT ON item_tags BEGIN
  UPDATE items_fts SET tags = (
    SELECT group_concat(t.name, ' ')
    FROM item_tags it
    JOIN tags t ON t.id = it.tag_id
    WHERE it.item_id = new.item_id
  ) WHERE item_id = new.item_id;
END;

CREATE TRIGGER IF NOT EXISTS item_tags_ad_fts AFTER DELETE ON item_tags BEGIN
  UPDATE items_fts SET tags = coalesce((
    SELECT group_concat(t.name, ' ')
    FROM item_tags it
    JOIN tags t ON t.id = it.tag_id
    WHERE it.item_id = old.item_id
  ), '') WHERE item_id = old.item_id;
END;

CREATE TRIGGER IF NOT EXISTS locations_au_fts_path AFTER UPDATE OF path ON locations BEGIN
  UPDATE items_fts SET location_path = new.path
  WHERE item_id IN (
    SELECT il.item_id FROM item_locations il
    WHERE il.location_id = new.id AND il.is_current = 1
  );
END;

-- Backfill location_path for items created before these triggers existed.
UPDATE items_fts SET location_path = coalesce((
  SELECT l.path FROM item_locations il
  JOIN locations l ON l.id = il.location_id
  WHERE il.item_id = items_fts.item_id AND il.is_current = 1
), '');
