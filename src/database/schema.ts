import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Schema notes (deviations from the original spec, and why):
 *
 * 1. IDs are TEXT (UUID) generated in JS, not INTEGER AUTOINCREMENT.
 *    Reason: local-first apps eventually want to sync/merge across devices
 *    (your own roadmap has "Multi-device sync" in v3.0). Autoincrement
 *    integer IDs collide across devices; UUIDs don't. Cheap to do now,
 *    expensive to retrofit later.
 *
 * 2. locations gets a `depth` and `path` denormalized column.
 *    Reason: WITH RECURSIVE CTEs work, but they run on every render of
 *    every list row if you're not careful. Denormalizing the materialized
 *    path (e.g. "home/bedroom/cabinet") lets you render breadcrumbs with
 *    zero extra queries, at the cost of updating descendants when a node
 *    is moved (rare operation, handled in location.service.ts).
 *
 * 3. items_fts is a real FTS5 virtual table wired via triggers, not a
 *    "later" optimization. Search is the core value prop of this app —
 *    it should be fast from commit #1.
 */

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

export const locations = sqliteTable(
  'locations',
  {
    id: text('id').primaryKey(),
    parentId: text('parent_id').references((): any => locations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type'), // HOUSE | FLOOR | ROOM | AREA | FURNITURE | DRAWER | CABINET | CONTAINER | OTHER
    description: text('description'),
    // Denormalized for fast breadcrumb rendering — see note #2 above.
    path: text('path').notNull(), // e.g. "Home/Bedroom/Cabinet"
    depth: integer('depth').notNull().default(0),
    createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
    updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
  },
  (table) => ({
    parentIdx: index('idx_locations_parent_id').on(table.parentId),
    nameIdx: index('idx_locations_name').on(table.name),
  })
);

export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    unit: text('unit'),
    condition: text('condition'),
    status: text('status').notNull().default('active'), // active | archived | lost | consumed | disposed | lent
    photoUri: text('photo_uri'),
    notes: text('notes'),
    createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
    updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
  },
  (table) => ({
    nameIdx: index('idx_items_name').on(table.name),
    categoryIdx: index('idx_items_category_id').on(table.categoryId),
    statusIdx: index('idx_items_status').on(table.status),
  })
);

export const itemLocations = sqliteTable(
  'item_locations',
  {
    id: text('id').primaryKey(),
    itemId: text('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    locationId: text('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    startedAt: text('started_at').notNull().default(sql`(current_timestamp)`),
    endedAt: text('ended_at'),
    isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => ({
    itemIdx: index('idx_item_locations_item_id').on(table.itemId),
    locationIdx: index('idx_item_locations_location_id').on(table.locationId),
    currentIdx: index('idx_item_locations_is_current').on(table.isCurrent),
  })
);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export const itemTags = sqliteTable(
  'item_tags',
  {
    itemId: text('item_id')
      .notNull()
      .references(() => items.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.itemId, table.tagId] }),
    itemIdx: index('idx_item_tags_item_id').on(table.itemId),
    tagIdx: index('idx_item_tags_tag_id').on(table.tagId),
  })
);

export const reminders = sqliteTable(
  'reminders',
  {
    id: text('id').primaryKey(),
    itemId: text('item_id').references(() => items.id, { onDelete: 'cascade' }),
    locationId: text('location_id').references(() => locations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    remindAt: text('remind_at').notNull(),
    repeatType: text('repeat_type').notNull().default('NONE'), // NONE | DAILY | WEEKLY | MONTHLY
    status: text('status').notNull().default('PENDING'), // PENDING | COMPLETED | CANCELLED
    notificationId: text('notification_id'), // ID returned by expo-notifications, needed to cancel/reschedule
    createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
    updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
  },
  (table) => ({
    remindAtIdx: index('idx_reminders_remind_at').on(table.remindAt),
    statusIdx: index('idx_reminders_status').on(table.status),
  })
);

// FTS5 virtual table + triggers are raw SQL (Drizzle doesn't model virtual
// tables) — see src/database/migrations/0000_initial.sql for the actual
// CREATE VIRTUAL TABLE + trigger statements that keep this in sync.
