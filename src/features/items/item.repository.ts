import { randomUUID } from 'expo-crypto';
import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { items, itemLocations, itemTags, locations, categories } from '@/database/schema';
import type { CreateItemInput, Item, ItemWithLocation } from './item.types';

export class ItemRepository {
  async create(input: CreateItemInput): Promise<Item> {
    const db = getDb();
    const now = new Date().toISOString();
    const itemId = randomUUID();

    // Transaction: item creation + initial location assignment must
    // succeed or fail together. Half-created items (item row exists but
    // no item_locations row) would violate Rule 1 from the spec.
    return db.transaction(async (tx) => {
      const [created] = await tx
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
        .returning();

      await tx.insert(itemLocations).values({
        id: randomUUID(),
        itemId,
        locationId: input.locationId,
        startedAt: now,
        endedAt: null,
        isCurrent: true,
      });

      if (input.tagIds?.length) {
        await tx.insert(itemTags).values(input.tagIds.map((tagId) => ({ itemId, tagId })));
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

    await db.transaction(async (tx) => {
      await tx
        .update(itemLocations)
        .set({ endedAt: now, isCurrent: false })
        .where(and(eq(itemLocations.itemId, itemId), eq(itemLocations.isCurrent, true)));

      await tx.insert(itemLocations).values({
        id: randomUUID(),
        itemId,
        locationId: newLocationId,
        startedAt: now,
        endedAt: null,
        isCurrent: true,
      });

      await tx.update(items).set({ updatedAt: now }).where(eq(items.id, itemId));
    });
  }

  async findById(id: string): Promise<ItemWithLocation | null> {
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
      .where(eq(items.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];
    return { ...row.item, currentLocationPath: row.locationPath, categoryName: row.categoryName } as ItemWithLocation;
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

  async getLocationHistory(itemId: string) {
    const db = getDb();
    return db
      .select({
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
