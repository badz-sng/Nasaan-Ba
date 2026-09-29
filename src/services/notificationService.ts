import * as Notifications from '@/services/localNotifications';
import { Platform } from 'react-native';
import { eq } from 'drizzle-orm';
import { getDb } from '@/database/client';
import { reminders } from '@/database/schema';
import type { Reminder } from '@/features/reminders/reminder.service';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

// Serialize OS scheduling and DB updates so foreground reconciliation cannot race a save.
let notificationWork: Promise<void> = Promise.resolve();
export function withNotificationLock<T>(work: () => Promise<T>): Promise<T> {
  const next = notificationWork.then(work);
  notificationWork = next.then(() => undefined, () => undefined);
  return next;
}

export function reminderTrigger(row: Pick<Reminder, 'remindAt' | 'repeatType'>): Notifications.SchedulableNotificationTriggerInput {
  const date = new Date(row.remindAt);
  const common = { channelId: 'reminders', hour: date.getHours(), minute: date.getMinutes() };
  switch (row.repeatType) {
    case 'DAILY': return { ...common, type: Notifications.SchedulableTriggerInputTypes.DAILY };
    case 'WEEKLY': return { ...common, type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: date.getDay() + 1 };
    case 'MONTHLY': return { ...common, type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: date.getDate() };
    default: return { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'reminders' };
  }
}

export async function scheduleReminder(row: Reminder, requestPermission: boolean): Promise<{ id: string; remindAt: string }> {
  if (Platform.OS === 'web') throw new Error('Local notifications require Android or iOS.');
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: Notifications.AndroidImportance.HIGH });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Allow notifications in device settings to schedule reminders.');
  const trigger = reminderTrigger(row);
  const next = await Notifications.getNextTriggerDateAsync(trigger);
  if (!next) throw new Error('This reminder has no upcoming notification time. Choose another date.');
  const id = await Notifications.scheduleNotificationAsync({
    content: { title: row.title, body: row.description || 'Your inventory reminder is due.', sound: 'default',
      data: { reminderId: row.id, itemId: row.itemId } }, trigger,
  });
  return { id, remindAt: new Date(next).toISOString() };
}

export async function cancelReminder(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id);
}

export function reconcileNotifications(): Promise<void> {
  return withNotificationLock(reconcile);
}

async function reconcile(): Promise<void> {
  if (Platform.OS === 'web') return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  const db = getDb();
  const pending = db.select().from(reminders).where(eq(reminders.status, 'PENDING')).all();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const known = new Set(pending.map((r) => r.notificationId).filter(Boolean));
  // Remove notifications orphaned by item/location deletion or a restore.
  for (const notification of scheduled) {
    if (notification.content.data?.reminderId && !known.has(notification.identifier)) await cancelReminder(notification.identifier);
  }
  const scheduledIds = new Set(scheduled.map((n) => n.identifier));
  for (const row of pending) {
    if (row.notificationId && scheduledIds.has(row.notificationId)) continue;
    if (row.repeatType === 'NONE' && new Date(row.remindAt).getTime() <= Date.now()) continue;
    const result = await scheduleReminder(row, false);
    db.update(reminders).set({ notificationId: result.id, remindAt: result.remindAt }).where(eq(reminders.id, row.id)).run();
  }
}
