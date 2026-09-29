import { randomUUID } from 'expo-crypto';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { items, itemLocations, itemTags, locations, categories } from '@/database/schema';
import type {
  CreateItemInput,
  FindAllItemsOptions,
  Item,
  ItemWithLocation,
  UpdateItemInput,
} from './item.types';
import type { LocationHistoryEntry } from './item.types';

export class ItemRepository {
  async create(input: CreateItemInput): Promise<Item> {
    const db = getDb();
    const now = new Date().toISOString();
    const itemId = randomUUID();

    // Transaction: item creation + initial location assignment must
    // succeed or fail together. Half-created items (item row exists but
    // no item_locations row) would violate Rule 1 from the spec.
    return db.transaction((tx) => {
      const [created] = tx
        .insert(items)
        .values({
          id: itemId,
          name: input.name,
          description: input.description ?? null,
          categoryId: input.categoryId ?? null,
          quantity: input.quantity ?? 1,
          unit: input.unit ?? null,
          condition: input.condition ?? null,
          status: 'active',
          photoUri: input.photoUri ?? null,
          notes: input.notes ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning().all();

      tx.insert(itemLocations).values({
        id: randomUUID(),
        itemId,
        locationId: input.locationId,
        startedAt: now,
        endedAt: null,
        isCurrent: true,
      }).run();

      if (input.tagIds?.length) {
        tx.insert(itemTags).values(input.tagIds.map((tagId) => ({ itemId, tagId }))).run();
      }

      return created as Item;
    });
  }

  /**
   * Moves an item to a new location: closes the current item_locations
   * row (sets ended_at + is_current=false) and opens a new one. Must be
   * a transaction — if the app crashes mid-operation without one, you
   * either lose history or end up with two "current" rows, which the
   * unique partial index would then reject on the second insert anyway,
   * leaving the item in a broken state.
   */
  async moveToLocation(itemId: string, newLocationId: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();

    db.transaction((tx) => {
      const item = tx.select().from(items).where(eq(items.id, itemId)).get();
      if (!item) throw new Error('Item not found');
      const current = tx.select().from(itemLocations)
        .where(and(eq(itemLocations.itemId, itemId), eq(itemLocations.isCurrent, true))).get();
      if (current?.locationId === newLocationId) return;
      tx
        .update(itemLocations)
        .set({ endedAt: now, isCurrent: false })
        .where(and(eq(itemLocations.itemId, itemId), eq(itemLocations.isCurrent, true))).run();

      tx.insert(itemLocations).values({
        id: randomUUID(),
        itemId,
        locationId: newLocationId,
        startedAt: now,
        endedAt: null,
        isCurrent: true,
      }).run();

      tx.update(items).set({ updatedAt: now }).where(eq(items.id, itemId)).run();
    });
  }

  async findById(id: string): Promise<ItemWithLocation | null> {
    const db = getDb();
    const rows = await db
      .select({
        item: items,
        locationId: itemLocations.locationId,
        locationPath: locations.path,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(
        itemLocations,
        and(eq(itemLocations.itemId, items.id), eq(itemLocations.isCurrent, true))
      )
      .leftJoin(locations, eq(locations.id, itemLocations.locationId))
      .leftJoin(categories, eq(categories.id, items.categoryId))
      .where(eq(items.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];
    const assignedTags = await db.select({ tagId: itemTags.tagId }).from(itemTags).where(eq(itemTags.itemId, id));
    return { ...row.item, currentLocationId: row.locationId, tagIds: assignedTags.map((t) => t.tagId), currentLocationPath: row.locationPath, categoryName: row.categoryName } as ItemWithLocation;
  }

  async findAll(options: FindAllItemsOptions = {}): Promise<ItemWithLocation[]> {
    const db = getDb();
    const { offset = 0, limit = 20, categoryId, tagId, status = 'active' } = options;

    const conditions = [eq(items.status, status)];
    if (categoryId) conditions.push(eq(items.categoryId, categoryId));

    let itemIdsFromTag: string[] | null = null;
    if (tagId) {
      const tagged = await db
        .select({ itemId: itemTags.itemId })
        .from(itemTags)
        .where(eq(itemTags.tagId, tagId));
      itemIdsFromTag = tagged.map((t) => t.itemId);
      if (itemIdsFromTag.length === 0) return [];
      conditions.push(inArray(items.id, itemIdsFromTag));
    }

    const rows = await db
      .select({
        item: items,
        locationPath: locations.path,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(
        itemLocations,
        and(eq(itemLocations.itemId, items.id), eq(itemLocations.isCurrent, true))
      )
      .leftJoin(locations, eq(locations.id, itemLocations.locationId))
      .leftJoin(categories, eq(categories.id, items.categoryId))
      .where(and(...conditions))
      .orderBy(sql`${items.updatedAt} DESC`)
      .limit(limit)
      .offset(offset);

    return rows.map(
      (r) =>
        ({
          ...r.item,
          currentLocationPath: r.locationPath,
          categoryName: r.categoryName,
        }) as ItemWithLocation
    );
  }

  async update(id: string, input: UpdateItemInput): Promise<Item> {
    const db = getDb();
    const now = new Date().toISOString();

    return db.transaction((tx) => {
      const [updated] = tx
        .update(items)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
          ...(input.quantity !== undefined && { quantity: input.quantity }),
          ...(input.unit !== undefined && { unit: input.unit }),
          ...(input.condition !== undefined && { condition: input.condition }),
          ...(input.photoUri !== undefined && { photoUri: input.photoUri }),
          ...(input.notes !== undefined && { notes: input.notes }),
          updatedAt: now,
        })
        .where(eq(items.id, id))
        .returning().all();
      if (!updated) throw new Error('Item not found');

      if (input.tagIds !== undefined) {
        tx.delete(itemTags).where(eq(itemTags.itemId, id)).run();
        if (input.tagIds.length > 0) {
          tx.insert(itemTags).values(input.tagIds.map((tagId) => ({ itemId: id, tagId }))).run();
        }
      }

      return updated as Item;
    });
  }

  async archive(id: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.update(items).set({ status: 'archived', updatedAt: now }).where(eq(items.id, id));
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(items).where(eq(items.id, id));
  }

  /** Recently added items for the Home screen. Excludes archived by default
   * per Rule 5 in the spec. */
  async findRecent(limit = 10): Promise<ItemWithLocation[]> {
    const db = getDb();
    const rows = await db
      .select({
        item: items,
        locationPath: locations.path,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(
        itemLocations,
        and(eq(itemLocations.itemId, items.id), eq(itemLocations.isCurrent, true))
      )
      .leftJoin(locations, eq(locations.id, itemLocations.locationId))
      .leftJoin(categories, eq(categories.id, items.categoryId))
      .where(eq(items.status, 'active'))
      .orderBy(sql`${items.createdAt} DESC`)
      .limit(limit);

    return rows.map((r) => ({ ...r.item, currentLocationPath: r.locationPath, categoryName: r.categoryName } as ItemWithLocation));
  }

  async getLocationHistory(itemId: string): Promise<LocationHistoryEntry[]> {
    const db = getDb();
    return db
      .select({
        id: itemLocations.id,
        locationId: itemLocations.locationId,
        locationName: locations.name,
        locationPath: locations.path,
        startedAt: itemLocations.startedAt,
        endedAt: itemLocations.endedAt,
        isCurrent: itemLocations.isCurrent,
      })
      .from(itemLocations)
      .leftJoin(locations, eq(locations.id, itemLocations.locationId))
      .where(eq(itemLocations.itemId, itemId))
      .orderBy(sql`${itemLocations.startedAt} DESC`);
  }
}

export const itemRepository = new ItemRepository();
