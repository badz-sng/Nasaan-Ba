import { randomUUID } from 'expo-crypto';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { tags, itemTags } from '@/database/schema';
import type { CreateTagInput, Tag, TagWithCount } from './tag.types';

export class TagRepository {
  async findAll(): Promise<TagWithCount[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        createdAt: tags.createdAt,
        itemCount: sql<number>`count(${itemTags.itemId})`,
      })
      .from(tags)
      .leftJoin(itemTags, eq(itemTags.tagId, tags.id))
      .groupBy(tags.id)
      .orderBy(tags.name);

    return rows as TagWithCount[];
  }

  async findByName(name: string): Promise<Tag | null> {
    const db = getDb();
    const rows = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
    return rows.length > 0 ? (rows[0] as Tag) : null;
  }

  async create(input: CreateTagInput): Promise<Tag> {
    const db = getDb();
    const now = new Date().toISOString();
    const id = randomUUID();

    const [created] = await db
      .insert(tags)
      .values({
        id,
        name: input.name,
        createdAt: now,
      })
      .returning();

    return created as Tag;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(tags).where(eq(tags.id, id));
  }

  async rename(id: string, name: string): Promise<Tag> {
    const [tag] = await getDb().update(tags).set({ name }).where(eq(tags.id, id)).returning();
    if (!tag) throw new Error('Tag not found');
    return tag as Tag;
  }

  async countItemsUsingTag(id: string): Promise<number> {
    const db = getDb();
    const rows = await db.all<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM item_tags WHERE tag_id = ${id}`
    );
    return rows[0]?.count ?? 0;
  }
}

export const tagRepository = new TagRepository();
