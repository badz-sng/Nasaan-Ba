import { sql } from 'drizzle-orm';
import { getDb } from '@/database/client';

export interface SearchResult {
  itemId: string;
  name: string;
  snippet: string;
  categoryName: string | null;
  locationPath: string | null;
}

/** Escape FTS5 special characters in user input. */
function escapeFtsQuery(raw: string): string {
  return raw
    .trim()
    .replace(/["*]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `"${term}"*`)
    .join(' ');
}

export class SearchRepository {
  async search(rawQuery: string, limit = 50): Promise<SearchResult[]> {
    const query = escapeFtsQuery(rawQuery);
    if (!query) return [];

    const db = getDb();
    const rows = await db.all<{
      item_id: string;
      name: string;
      snippet: string;
      category_name: string | null;
      location_path: string | null;
    }>(sql`
      SELECT
        f.item_id,
        f.name,
        snippet(items_fts, 1, '**', '**', '...', 32) AS snippet,
        f.category_name,
        f.location_path
      FROM items_fts f
      INNER JOIN items i ON i.id = f.item_id
      WHERE items_fts MATCH ${query}
        AND i.status = 'active'
      ORDER BY rank
      LIMIT ${limit}
    `);

    return rows.map((r) => ({
      itemId: r.item_id,
      name: r.name,
      snippet: r.snippet,
      categoryName: r.category_name,
      locationPath: r.location_path,
    }));
  }
}

export const searchRepository = new SearchRepository();
