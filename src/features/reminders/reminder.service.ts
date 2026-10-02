import { z } from 'zod';
import { randomUUID } from 'expo-crypto';
import { eq, desc, and, asc } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { reminders } from '@/database/schema';
import { scheduleReminder, cancelReminder, withNotificationLock } from '@/services/notificationService';

export type Reminder = typeof reminders.$inferSelect;
export const reminderSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(200),
  description: z.string().trim().max(2000).default(''),
  remindAt: z.iso.datetime(),
  repeatType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY']).default('NONE'),
  itemId: z.string().uuid().nullable().default(null),
  locationId: z.string().uuid().nullable().default(null),
}).refine((v) => new Date(v.remindAt).getTime() > Date.now(), { message: 'Choose a future time.', path: ['remindAt'] });

export function parseLocalDateTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('Use YYYY-MM-DD HH:mm, for example 2026-10-01 09:00.');
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) {
    throw new Error('Enter a valid date and time.');
  }
  return date.toISOString();
}

export function localDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const reminderService = {
  async getForItem(itemId: string): Promise<Reminder[]> {
    return getDb().select().from(reminders).where(and(eq(reminders.itemId, itemId), eq(reminders.status, 'PENDING'))).orderBy(asc(reminders.remindAt));
  },
  async getAll(): Promise<Reminder[]> {
    return getDb().select().from(reminders).orderBy(desc(reminders.remindAt));
  },
  async save(input: unknown, id?: string): Promise<void> {
    return withNotificationLock(async () => {
      const parsed = reminderSchema.safeParse(input);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const db = getDb();
      const old = id ? db.select().from(reminders).where(eq(reminders.id, id)).get() : undefined;
      if (id && !old) throw new Error('Reminder not found.');
      const now = new Date().toISOString();
      const row: Reminder = { ...parsed.data, id: id ?? randomUUID(), createdAt: old?.createdAt ?? now,
        updatedAt: now, status: 'PENDING', notificationId: null };
      const scheduled = await scheduleReminder(row, true);
      row.notificationId = scheduled.id;
      row.remindAt = scheduled.remindAt;
      try {
        if (id) db.update(reminders).set(row).where(eq(reminders.id, id)).run();
        else db.insert(reminders).values(row).run();
      } catch {
        await cancelReminder(row.notificationId);
        throw new Error('Could not save the reminder. The linked item or location may have been deleted.');
      }
      if (old?.notificationId) await cancelReminder(old.notificationId).catch(() => undefined);
    });
  },
  async setStatus(id: string, status: 'COMPLETED' | 'CANCELLED'): Promise<void> {
    return withNotificationLock(async () => {
      const db = getDb();
      const row = db.select().from(reminders).where(eq(reminders.id, id)).get();
      if (!row) throw new Error('Reminder not found.');
      await cancelReminder(row.notificationId);
      db.update(reminders).set({ status, notificationId: null, updatedAt: new Date().toISOString() }).where(eq(reminders.id, id)).run();
    });
  },
  async delete(id: string): Promise<void> {
    return withNotificationLock(async () => {
      const db = getDb();
      const row = db.select().from(reminders).where(eq(reminders.id, id)).get();
      if (!row) return;
      await cancelReminder(row.notificationId);
      db.delete(reminders).where(eq(reminders.id, id)).run();
    });
  },
};
