import { useState } from 'react';
import { ScrollView, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { backupService } from '@/features/backup/backup.service';
import type { Backup } from '@/features/backup/backup.validation';

export default function BackupScreen() {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Backup | null>(null);
  const [message, setMessage] = useState('');
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await work(); }
    catch (err) { Alert.alert('Backup could not finish', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Link href="/(tabs)/more">Back</Link>
      <Text style={styles.title}>Backup & Restore</Text>
      <Text>Export your inventory, location history, tags, reminders, and photos as a JSON file. Keep the file somewhere safe.</Text>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => run(async () => {
        const file = await backupService.export(); setMessage(`Backup exported: ${file.name}`);
      })}><Text style={styles.buttonText}>Export Backup</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => run(async () => setPending(await backupService.pick()))}>
        <Text style={styles.buttonText}>Choose Backup to Restore</Text>
      </Pressable>
      {pending && <>
        <Text>Backup from {new Date(pending.exported_at).toLocaleString()}: {pending.data.items.length} items, {pending.data.locations.length} locations, {pending.photos.length} photos.</Text>
        <Text>Restoring replaces all current inventory data. Export your current inventory first if you want to keep it.</Text>
        <Pressable disabled={busy} style={styles.button} onPress={() => Alert.alert('Replace current inventory?', 'Your current inventory will be replaced by this backup.', [
          { text: 'Cancel' }, { text: 'Replace & Restore', style: 'destructive', onPress: () => run(async () => {
            const result = await backupService.restore(pending); setPending(null);
            Alert.alert('Inventory restored', result.notificationWarning ? 'Data restored. Open Settings to retry notification scheduling.' : 'Your inventory has been restored.');
            router.replace('/(tabs)/items');
          }) },
        ])}><Text style={styles.buttonText}>Restore This Backup</Text></Pressable>
        <Pressable disabled={busy} onPress={() => setPending(null)}><Text>Cancel</Text></Pressable>
      </>}
      {busy && <ActivityIndicator />}
      {!!message && <Text>{message}</Text>}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, gap: 20 }, title: { fontSize: 24, fontWeight: '700' },
  button: { padding: 16, borderRadius: 8, backgroundColor: '#111' }, buttonText: { color: '#fff' },
});
