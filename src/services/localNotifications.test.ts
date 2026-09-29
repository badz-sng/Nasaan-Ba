jest.mock('expo-notifications', () => {
  throw new Error('Remote push entry is unavailable in Android Expo Go');
});
jest.mock('expo-notifications/build/DevicePushTokenAutoRegistration.fx', () => {
  throw new Error('Remote push auto-registration must not load for local reminders');
});
jest.mock('expo-notifications/build/TokenEmitter', () => {
  throw new Error('Remote push token listeners must not load for local reminders');
});

import * as Notifications from './localNotifications';

it('loads the real local notification APIs without loading remote push registration', () => {
  for (const name of [
    'setNotificationHandler', 'scheduleNotificationAsync', 'cancelScheduledNotificationAsync',
    'getPermissionsAsync', 'requestPermissionsAsync', 'setNotificationChannelAsync',
    'getNextTriggerDateAsync', 'getAllScheduledNotificationsAsync',
    'addNotificationResponseReceivedListener', 'getLastNotificationResponseAsync', 'clearLastNotificationResponseAsync',
  ] as const) expect(typeof Notifications[name]).toBe('function');
  expect(Notifications.SchedulableTriggerInputTypes.DATE).toBeDefined();
});
