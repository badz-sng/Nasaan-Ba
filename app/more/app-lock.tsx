import { useState } from 'react';
import { View, Text, Switch, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { setAppLock, useAppLock } from '@/services/appLockService';

export default function AppLockScreen() {
  const enabled = useAppLock((state) => state.enabled);
  const [busy, setBusy] = useState(false);
  const change = async (value: boolean) => {
    setBusy(true);
    try { await setAppLock(value); }
    catch (err) { Alert.alert('Could not change app lock', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <View style={styles.container}>
      <Link href="/(tabs)/more">Back</Link>
      <Text style={styles.title}>App Lock</Text>
      <Text>Require fingerprint, face authentication, or your device passcode when opening or returning to the app.</Text>
      <View style={styles.row}>
        <Text>Enable App Lock</Text>
        <Switch accessibilityLabel="Enable App Lock" value={enabled} disabled={busy} onValueChange={change} />
      </View>
      {busy && <ActivityIndicator />}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, gap: 20 }, title: { fontSize: 24, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
