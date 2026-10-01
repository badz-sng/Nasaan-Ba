import { ActionButton } from '@/components/ActionButton';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase, resetDatabase, DatabaseInitError } from '@/database/client';
import { seedDefaults } from '@/database/seeders/defaultData';
import { initializeAppLock } from '@/services/appLockService';
import { AppLockGate } from '@/components/AppLockGate';
import { reconcileNotifications } from '@/services/notificationService';
import * as Notifications from '@/services/localNotifications';
import { router } from 'expo-router';
import { AppState } from 'react-native';

type BootState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

export default function RootLayout() {
  const [boot, setBoot] = useState<BootState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await seedDefaults();
        await initializeAppLock();
        setBoot({ status: 'ready' });
        void reconcileNotifications().catch(() => undefined);
      } catch (err) {
        const message =
          err instanceof DatabaseInitError
            ? err.message
            : 'The application could not load. Please try again.';
        setBoot({ status: 'error', message });
      }
    })();
  }, [attempt]);

  useEffect(() => {
    if (boot.status !== 'ready') return;
    const openNotification = (response: Notifications.NotificationResponse) => {
      const itemId = response.notification.request.content.data?.itemId;
      if (typeof itemId === 'string') router.push({ pathname: '/item/[id]', params: { id: itemId } });
      else router.push('/more/reminders');
      void Notifications.clearLastNotificationResponseAsync();
    };
    const listener = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) openNotification(response);
    }).catch(() => undefined);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reconcileNotifications().catch(() => undefined);
    });
    return () => { listener.remove(); foreground.remove(); };
  }, [boot.status]);

  if (boot.status === 'loading') {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Preparing Nasaan ba?...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (boot.status === 'error') {
    return (
      <SafeAreaProvider>
        <DatabaseErrorScreen message={boot.message} onRetry={() => { setBoot({ status: 'loading' }); setAttempt((v) => v + 1); }} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppLockGate><Stack screenOptions={{ headerShown: false }} /></AppLockGate>
    </SafeAreaProvider>
  );
}

/** Recovery UI for a corrupted/unopenable database — the fallback case
 * called out in the architecture discussion, not an afterthought. */
function DatabaseErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const handleReset = async () => {
    await resetDatabase();
    onRetry();
  };

  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>There is a database problem</Text>
      <Text style={styles.errorMessage}>{message}</Text>

      {!confirmingReset ? (
        <View style={styles.buttonRow}>
          <ActionButton variant="secondary" style={styles.buttonSecondary} onPress={onRetry}>
            <Text >Try Again</Text>
          </ActionButton>
          <ActionButton variant="danger" style={styles.buttonDanger} onPress={() => setConfirmingReset(true)}>
            <Text >Reset Database</Text>
          </ActionButton>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <Text style={styles.warningText}>
            All app data will be deleted. Are you sure?
          </Text>
          <ActionButton variant="secondary" style={styles.buttonSecondary} onPress={() => setConfirmingReset(false)}>
            <Text >Cancel</Text>
          </ActionButton>
          <ActionButton variant="danger" style={styles.buttonDanger} onPress={handleReset}>
            <Text >Yes, Reset</Text>
          </ActionButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  loadingText: { marginTop: 12, color: '#666' },
  errorTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  errorMessage: { color: '#666', textAlign: 'center' },
  warningText: { color: '#b91c1c', textAlign: 'center', marginBottom: 8 },
  buttonRow: { gap: 8, marginTop: 16, width: '100%' },
  buttonSecondary: {  },
  buttonSecondaryText: { color: '#333', fontWeight: '500' },
  buttonDanger: {  },
  buttonDangerText: { color: '#fff', fontWeight: '500' },
});
