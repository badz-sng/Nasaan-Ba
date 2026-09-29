// SDK 57's root export registers remote push listeners and throws in Android Expo Go.
// Import only local APIs; keep these package paths together when upgrading Expo.
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export {
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
  clearLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { getNextTriggerDateAsync } from 'expo-notifications/build/getNextTriggerDateAsync';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export type { NotificationResponse, NotificationRequest, SchedulableNotificationTriggerInput } from 'expo-notifications/build/Notifications.types';
export type { NotificationPermissionsStatus } from 'expo-notifications/build/NotificationPermissions.types';
