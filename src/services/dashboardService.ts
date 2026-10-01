import { sql } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { items, locations, categories, reminders } from '@/database/schema';

export interface DashboardSummary { items: number; locations: number; categories: number; reminders: number }

export function getDashboardSummary(): DashboardSummary {
  return getDb().get<DashboardSummary>(sql`SELECT
    (SELECT count(*) FROM ${items} WHERE ${items.status} = 'active') AS items,
    (SELECT count(*) FROM ${locations}) AS locations,
    (SELECT count(*) FROM ${categories}) AS categories,
    (SELECT count(*) FROM ${reminders} WHERE ${reminders.status} = 'PENDING') AS reminders`);
}
