import { useCallback, useState } from 'react';
import { ScrollView, Text, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import * as Notifications from '@/services/localNotifications';
import { reconcileNotifications } from '@/services/notificationService';

export default function SettingsScreen() {
  const [permission, setPermission] = useState('Checking...');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try { const result = await Notifications.getPermissionsAsync(); setPermission(result.granted ? 'Allowed' : 'Not allowed'); }
    catch { setPermission('Unavailable on this device'); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const schedule = async () => {
    setBusy(true);
    try {
      const result = await Notifications.requestPermissionsAsync();
      await refresh();
      if (!result.granted) { Alert.alert('Notifications are disabled', 'Allow notifications in your device settings.', [{ text: 'Cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }]); return; }
      await reconcileNotifications(); Alert.alert('Reminders checked', 'Upcoming reminders are scheduled.');
    } catch (err) { Alert.alert('Could not schedule reminders', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, gap: 24 }}>
      <Link href="/(tabs)/more">Back</Link>
      <Text style={{ fontSize: 24, fontWeight: '700' }}>Settings</Text>
      <Text>Notifications: {permission}</Text>
      <Pressable accessibilityRole="button" disabled={busy} onPress={schedule}><Text>Enable / Retry Reminder Notifications</Text></Pressable>
      {busy && <ActivityIndicator />}
      <Link href="/more/app-lock">App Lock</Link>
      <Link href="/more/backup">Backup & Restore</Link>
      <Text>Your inventory and photos are stored on this device. Export a backup before switching devices.</Text>
    </ScrollView>
  );
}
