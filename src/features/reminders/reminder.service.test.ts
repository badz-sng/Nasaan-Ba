jest.mock('@/database/client', () => ({ getDb: jest.fn() }));
jest.mock('@/services/notificationService', () => ({ scheduleReminder: jest.fn(), cancelReminder: jest.fn(), withNotificationLock: (work: () => Promise<unknown>) => work() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));
import { parseLocalDateTime, reminderSchema, localDateTime, reminderService } from './reminder.service';
import { getDb } from '@/database/client';
import { scheduleReminder, cancelReminder } from '@/services/notificationService';

it('validates local dates without silently rolling into the next month', () => {
  expect(() => parseLocalDateTime('2028-02-30 09:00')).toThrow('valid date');
  expect(() => parseLocalDateTime('2028-01-01 25:00')).toThrow('valid date');
  expect(localDateTime(parseLocalDateTime('2028-02-29 09:00'))).toBe('2028-02-29 09:00');
  expect(reminderSchema.safeParse({ title: 'Check passport', remindAt: '2000-01-01T00:00:00.000Z' }).success).toBe(false);
});

it('does not save when scheduling fails and cancels a new notification if the DB write fails', async () => {
  const run = jest.fn();
  jest.mocked(getDb).mockReturnValue({ insert: () => ({ values: () => ({ run }) }) } as unknown as ReturnType<typeof getDb>);
  const input = { title: 'Passport', remindAt: '2030-01-01T00:00:00.000Z' };
  jest.mocked(scheduleReminder).mockRejectedValue(new Error('Permission denied'));
  await expect(reminderService.save(input)).rejects.toThrow('Permission denied');
  expect(run).not.toHaveBeenCalled();
  jest.mocked(scheduleReminder).mockResolvedValue({ id: 'notification-1', remindAt: input.remindAt });
  run.mockImplementation(() => { throw new Error('FK failed'); });
  await expect(reminderService.save(input)).rejects.toThrow('Could not save');
  expect(cancelReminder).toHaveBeenCalledWith('notification-1');
});
