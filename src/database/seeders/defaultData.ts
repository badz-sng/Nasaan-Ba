import { randomUUID } from 'expo-crypto';
import { eq } from 'drizzle-orm';
import { categories, locations } from '../schema';
import { getDb } from '../client';

export const UNKNOWN_LOCATION_NAME = 'Unknown / Not Stored';

const DEFAULT_CATEGORIES = [
  { name: 'Documents', icon: 'file-text' },
  { name: 'Electronics', icon: 'cpu' },
  { name: 'Clothing', icon: 'shirt' },
  { name: 'Kitchen', icon: 'utensils' },
  { name: 'Tools', icon: 'wrench' },
  { name: 'Food', icon: 'apple' },
  { name: 'Accessories', icon: 'watch' },
  { name: 'Others', icon: 'box' },
];

/**
 * Idempotent seed — safe to call on every app boot. Only inserts if the
 * table is empty, so re-running it (e.g. after a backup restore) doesn't
 * duplicate data.
 */
export async function seedDefaults(): Promise<void> {
  const db = getDb();

  try {
    db.transaction((tx) => {
      const existingCategories = tx.select().from(categories).get();
      if (!existingCategories) {
        tx.insert(categories).values(
          DEFAULT_CATEGORIES.map((c) => ({ id: randomUUID(), ...c }))
        ).run();
      }

      const existingUnknown = tx
        .select()
        .from(locations)
        .where(eq(locations.name, UNKNOWN_LOCATION_NAME))
        .get();

      if (!existingUnknown) {
        // Rule 1 (spec 2.11): every active item needs a current location.
        // This system location is the fallback so "no location yet" is
        // still a valid, queryable state instead of a null that every
        // screen has to special-case.
        tx.insert(locations).values({
          id: randomUUID(),
          parentId: null,
          name: UNKNOWN_LOCATION_NAME,
          type: 'OTHER',
          path: UNKNOWN_LOCATION_NAME,
          depth: 0,
        }).run();
      }
    });
  } catch (err) {
    // Seeding is not fatal — the app can still run with an empty state,
    // it'll just look a bit bare. Log and continue rather than blocking boot.
    console.warn('[seedDefaults] failed, continuing without defaults:', err);
  }
}
