import { ActionButton } from '@/components/ActionButton';
import { useCallback, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, Link } from 'expo-router';
import { reminderService, localDateTime, parseLocalDateTime, type Reminder } from '@/features/reminders/reminder.service';

export default function RemindersScreen() {
  const params = useLocalSearchParams<{ itemId?: string; locationId?: string }>();
  const [rows, setRows] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [showForm, setShowForm] = useState(!!params.itemId || !!params.locationId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(localDateTime(new Date(Date.now() + 3600000).toISOString()));
  const [repeatType, setRepeatType] = useState('NONE');
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRows(await reminderService.getAll()); }
    catch { setError('Could not load reminders. Tap to retry.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const action = async (work: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await work(); await refresh(); }
    catch (err) { Alert.alert('Could not update reminders', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  };
  const reset = () => { setEditing(null); setTitle(''); setDescription(''); setRepeatType('NONE'); setTime(localDateTime(new Date(Date.now() + 3600000).toISOString())); setShowForm(false); };
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Link href="/(tabs)/more" asChild><ActionButton variant="link">‹ Back</ActionButton></Link>
      <Text style={styles.title}>Reminders</Text>
      <ActionButton variant="primary" accessibilityRole="button" disabled={busy} onPress={() => { reset(); setShowForm(true); }}><Text>+ Add Reminder</Text></ActionButton>
      {showForm && <View style={styles.form}>
        <Text>{editing ? 'Edit reminder' : 'New reminder'}</Text>
        <TextInput accessibilityLabel="Reminder title" placeholder="Title" style={styles.input} value={title} onChangeText={setTitle} editable={!busy} />
        <TextInput accessibilityLabel="Reminder description" placeholder="Notes (optional)" style={styles.input} value={description} onChangeText={setDescription} editable={!busy} multiline />
        <Text>Local date and time (YYYY-MM-DD HH:mm)</Text>
        <TextInput accessibilityLabel="Reminder date and time" style={styles.input} value={time} onChangeText={setTime} editable={!busy} />
        <View style={styles.row}>{['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'].map((repeat) => (
          <Pressable accessibilityRole="button" accessibilityState={{ selected: repeatType === repeat }} style={[styles.chip, repeatType === repeat && styles.selected]} key={repeat} disabled={busy} onPress={() => setRepeatType(repeat)}><Text>{repeat}</Text></Pressable>
        ))}</View>
        {repeatType !== 'NONE' && <Text>Repeating reminders start at the next matching time. Monthly reminders on the 29th-31st skip months without that day.</Text>}
        {(editing?.itemId || params.itemId) && <Text>Linked to this item.</Text>}
        {(editing?.locationId || params.locationId) && <Text>Linked to this location.</Text>}
        <ActionButton variant="primary" accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => action(async () => {
          await reminderService.save({ title, description, remindAt: parseLocalDateTime(time), repeatType,
            itemId: editing ? editing.itemId : params.itemId ?? null, locationId: editing ? editing.locationId : params.locationId ?? null }, editing?.id);
          reset();
        })}><Text >{busy ? 'Saving...' : 'Save Reminder'}</Text></ActionButton>
        <ActionButton variant="secondary" accessibilityRole="button" disabled={busy} onPress={reset}><Text>Cancel</Text></ActionButton>
      </View>}
      {loading && <ActivityIndicator />}
      {error && <Pressable onPress={refresh}><Text style={{ color: '#b91c1c' }}>{error}</Text></Pressable>}
      {!loading && !error && rows.length === 0 && <Text>No reminders yet.</Text>}
      {rows.map((row) => <View key={row.id} style={styles.form}>
        <Text style={{ fontWeight: '600' }}>{row.title}</Text>
        <Text>{new Date(row.remindAt).toLocaleString()} / {row.repeatType} / {row.status}</Text>
        {row.description && <Text>{row.description}</Text>}
        {row.itemId && <Link href={{ pathname: '/item/[id]', params: { id: row.itemId } }} asChild><ActionButton variant="link">View Item  ›</ActionButton></Link>}
        <View style={styles.row}>
          <ActionButton variant="secondary" disabled={busy} onPress={() => { setEditing(row); setTitle(row.title); setDescription(row.description ?? ''); setTime(localDateTime(row.remindAt)); setRepeatType(row.repeatType); setShowForm(true); }}><Text>Edit</Text></ActionButton>
          {row.status === 'PENDING' && <>
            <ActionButton variant="primary" disabled={busy} onPress={() => action(() => reminderService.setStatus(row.id, 'COMPLETED'))}><Text>Complete</Text></ActionButton>
            <ActionButton variant="secondary" disabled={busy} onPress={() => action(() => reminderService.setStatus(row.id, 'CANCELLED'))}><Text>Cancel</Text></ActionButton>
          </>}
          <ActionButton variant="danger" disabled={busy} onPress={() => Alert.alert('Delete reminder?', row.title, [{ text: 'Keep' }, { text: 'Delete', style: 'destructive', onPress: () => action(() => reminderService.delete(row.id)) }])}><Text >Delete</Text></ActionButton>
        </View>
      </View>)}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, paddingBottom: 48, gap: 16 }, title: { fontSize: 24, fontWeight: '700' },
  form: { padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 12, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 }, chip: { padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  selected: { backgroundColor: '#dbeafe' }, button: {  },
});
