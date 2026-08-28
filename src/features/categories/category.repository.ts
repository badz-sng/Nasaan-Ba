import { randomUUID } from 'expo-crypto';
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { categories, items } from '@/database/schema';
import type {
  Category,
  CategoryWithCount,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './category.types';

export class CategoryRepository {
  async findAll(): Promise<CategoryWithCount[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        itemCount: sql<number>`count(${items.id})`.as('itemCount'),
      })
      .from(categories)
      .leftJoin(items, eq(items.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(categories.name);

    return rows as CategoryWithCount[];
  }

  async findById(id: string): Promise<Category | null> {
    const db = getDb();
    const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return rows.length > 0 ? (rows[0] as Category) : null;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const db = getDb();
    const now = new Date().toISOString();
    const id = randomUUID();

    const [created] = await db
      .insert(categories)
      .values({
        id,
        name: input.name,
        icon: input.icon ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return created as Category;
  }

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const db = getDb();
    const now = new Date().toISOString();

    const [updated] = await db
      .update(categories)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.icon !== undefined && { icon: input.icon }),
        updatedAt: now,
      })
      .where(eq(categories.id, id))
      .returning();

    return updated as Category;
  }

  async delete(id: string): Promise<void> {
    const db = getDb();
    await db.delete(categories).where(eq(categories.id, id));
  }

  async countItemsUsingCategory(id: string): Promise<number> {
    const db = getDb();
    const rows = await db.all<{ count: number }>(
      sql`SELECT COUNT(*) as count FROM items WHERE category_id = ${id}`
    );
    return rows[0]?.count ?? 0;
  }
}

export const categoryRepository = new CategoryRepository();
