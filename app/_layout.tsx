import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase, resetDatabase, DatabaseInitError } from '@/database/client';
import { seedDefaults } from '@/database/seeders/defaultData';

type BootState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

export default function RootLayout() {
  const [boot, setBoot] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        await seedDefaults();
        setBoot({ status: 'ready' });
      } catch (err) {
        const message =
          err instanceof DatabaseInitError
            ? err.message
            : 'The application could not load. Please try again.';
        setBoot({ status: 'error', message });
      }
    })();
  }, []);

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
        <DatabaseErrorScreen message={boot.message} onRetry={() => setBoot({ status: 'loading' })} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
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
          <Pressable style={styles.buttonSecondary} onPress={onRetry}>
            <Text style={styles.buttonSecondaryText}>Try Again</Text>
          </Pressable>
          <Pressable style={styles.buttonDanger} onPress={() => setConfirmingReset(true)}>
            <Text style={styles.buttonDangerText}>Reset Database</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <Text style={styles.warningText}>
            All app data will be deleted. Are you sure?
          </Text>
          <Pressable style={styles.buttonSecondary} onPress={() => setConfirmingReset(false)}>
            <Text style={styles.buttonSecondaryText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.buttonDanger} onPress={handleReset}>
            <Text style={styles.buttonDangerText}>Yes, Reset</Text>
          </Pressable>
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
  buttonSecondary: { padding: 12, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center' },
  buttonSecondaryText: { color: '#333', fontWeight: '500' },
  buttonDanger: { padding: 12, borderRadius: 8, backgroundColor: '#dc2626', alignItems: 'center' },
  buttonDangerText: { color: '#fff', fontWeight: '500' },
});
