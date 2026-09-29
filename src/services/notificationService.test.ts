jest.mock('@/services/localNotifications', () => ({
  setNotificationHandler: jest.fn(), setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(), requestPermissionsAsync: jest.fn(),
  getNextTriggerDateAsync: jest.fn(), scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(), getAllScheduledNotificationsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', WEEKLY: 'weekly', MONTHLY: 'monthly' },
}));
jest.mock('@/database/client', () => ({ getDb: jest.fn() }));
import * as Notifications from '@/services/localNotifications';
import { getDb } from '@/database/client';
import { reminderTrigger, reconcileNotifications, scheduleReminder, withNotificationLock } from './notificationService';
import type { Reminder } from '@/features/reminders/reminder.service';

const row: Reminder = { id: 'reminder-1', itemId: null, locationId: null, title: 'Passport', description: '',
  remindAt: '2030-01-01T00:00:00.000Z', repeatType: 'NONE', status: 'PENDING', notificationId: null,
  createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

it('denied permission cannot schedule a notification and date/recurrence inputs retain local time', async () => {
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: false } as Notifications.NotificationPermissionsStatus);
  await expect(scheduleReminder(row, false)).rejects.toThrow('Allow notifications');
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  const date = new Date(row.remindAt);
  expect(reminderTrigger({ ...row, repeatType: 'WEEKLY' })).toMatchObject({ type: 'weekly', weekday: date.getDay() + 1, hour: date.getHours(), minute: date.getMinutes() });
  expect(reminderTrigger({ ...row, repeatType: 'MONTHLY' })).toMatchObject({ type: 'monthly', day: date.getDate() });
});

it('concurrent reconciliation schedules once and cancels orphaned notifications', async () => {
  const pending = { ...row };
  let scheduled = [{ identifier: 'orphan', content: { data: { reminderId: 'deleted' } } }];
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ granted: true } as Notifications.NotificationPermissionsStatus);
  jest.mocked(Notifications.getNextTriggerDateAsync).mockResolvedValue(Date.parse(row.remindAt));
  jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockImplementation(async () => scheduled as unknown as Notifications.NotificationRequest[]);
  jest.mocked(Notifications.cancelScheduledNotificationAsync).mockImplementation(async (id) => { scheduled = scheduled.filter((n) => n.identifier !== id); });
  jest.mocked(Notifications.scheduleNotificationAsync).mockImplementation(async () => {
    scheduled.push({ identifier: 'new-id', content: { data: { reminderId: pending.id } } }); return 'new-id';
  });
  const db = {
    select: () => ({ from: () => ({ where: () => ({ all: () => [pending] }) }) }),
    update: () => ({ set: (values: Partial<Reminder>) => ({ where: () => ({ run: () => Object.assign(pending, values) }) }) }),
  };
  jest.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
  await Promise.all([reconcileNotifications(), reconcileNotifications()]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('orphan');
  expect(pending.notificationId).toBe('new-id');
  await expect(withNotificationLock(async () => { throw new Error('failed operation'); })).rejects.toThrow('failed operation');
  await expect(withNotificationLock(async () => 'recovered')).resolves.toBe('recovered');
});
