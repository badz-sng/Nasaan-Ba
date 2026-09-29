import { randomUUID } from 'expo-crypto';
import { eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { locations } from '@/database/schema';
import type { CreateLocationInput, Location, UpdateLocationInput } from './location.types';

export class LocationRepository {
  async findAll(): Promise<Location[]> {
    const db = getDb();
    const rows = await db.select().from(locations).orderBy(locations.path);
    return rows as Location[];
  }

  async findById(id: string): Promise<Location | null> {
    const db = getDb();
    const rows = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    return rows.length > 0 ? (rows[0] as Location) : null;
  }

  async findRoots(): Promise<Location[]> {
    const db = getDb();
    const rows = await db
      .select()
      .from(locations)
      .where(isNull(locations.parentId))
      .orderBy(locations.name);
    return rows as Location[];
  }

  async create(input: CreateLocationInput): Promise<Location> {
    const db = getDb();
    const now = new Date().toISOString();
    const id = randomUUID();

    let path = input.name;
    let depth = 0;

    if (input.parentId) {
      const parent = await this.findById(input.parentId);
      if (!parent) throw new Error('Parent location not found');
      path = `${parent.path}/${input.name}`;
      depth = parent.depth + 1;
    }

    const [created] = await db
      .insert(locations)
      .values({
        id,
        parentId: input.parentId ?? null,
        name: input.name,
        type: input.type ?? null,
        description: input.description ?? null,
        path,
        depth,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created as Location;
  }

  async update(id: string, input: UpdateLocationInput): Promise<Location> {
    const db = getDb();
    const existing = await this.findById(id);
    if (!existing) throw new Error('Location not found');

    const now = new Date().toISOString();
    const newName = input.name ?? existing.name;
    const newParentId = input.parentId !== undefined ? input.parentId : existing.parentId;

    const parentChanged = newParentId !== existing.parentId;
    const nameChanged = newName !== existing.name;

    if (parentChanged || nameChanged) {
      let newPath = newName;
      let newDepth = 0;

      if (newParentId) {
        const parent = await this.findById(newParentId);
        if (!parent) throw new Error('Parent location not found');
        newPath = `${parent.path}/${newName}`;
        newDepth = parent.depth + 1;
      }

      const oldPath = existing.path;

      db.transaction((tx) => {
        const descendants = tx.all<{ id: string; path: string; depth: number }>(sql`
          WITH RECURSIVE subtree(id) AS (
            SELECT id FROM locations WHERE parent_id = ${id}
            UNION ALL SELECT l.id FROM locations l JOIN subtree s ON l.parent_id = s.id
          ) SELECT id, path, depth FROM locations WHERE id IN (SELECT id FROM subtree)
        `);
        tx
          .update(locations)
          .set({
            name: newName,
            parentId: newParentId,
            path: newPath,
            depth: newDepth,
            type: input.type !== undefined ? input.type : existing.type,
            description: input.description !== undefined ? input.description : existing.description,
            updatedAt: now,
          })
          .where(eq(locations.id, id)).run();

        if (oldPath !== newPath || newDepth !== existing.depth) {
          for (const desc of descendants) {
            if (desc.id === id) continue;
            const suffix = desc.path.slice(oldPath.length);
            const updatedPath = newPath + suffix;
            const depthDelta = newDepth - existing.depth;
            tx
              .update(locations)
              .set({
                path: updatedPath,
                depth: desc.depth + depthDelta,
                updatedAt: now,
              })
              .where(eq(locations.id, desc.id)).run();
          }
        } else if (input.type !== undefined || input.description !== undefined) {
          tx
            .update(locations)
            .set({
              type: input.type !== undefined ? input.type : existing.type,
              description: input.description !== undefined ? input.description : existing.description,
              updatedAt: now,
            })
            .where(eq(locations.id, id)).run();
        }
      });
    } else {
      await db
        .update(locations)
        .set({
          type: input.type !== undefined ? input.type : existing.type,
          description: input.description !== undefined ? input.description : existing.description,
          updatedAt: now,
        })
        .where(eq(locations.id, id));
    }

    const updated = await this.findById(id);
    if (!updated) throw new Error('Location not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(locations).where(eq(locations.id, id));
  }

  /** Walk up the parent chain from `startId`; returns true if `ancestorId`
   *  appears anywhere in the chain (used to block circular moves). */
  async isAncestor(ancestorId: string, startId: string): Promise<boolean> {
    let currentId: string | null = startId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === ancestorId) return true;
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const loc = await this.findById(currentId);
      if (!loc) break;
      currentId = loc.parentId;
    }

    return false;
  }

  async countItemsAtLocation(locationId: string): Promise<number> {
    const db = getDb();
    const rows = await db.all<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM item_locations WHERE location_id = ${locationId} AND is_current = 1`
    );
    return rows[0]?.count ?? 0;
  }
}

export const locationRepository = new LocationRepository();
