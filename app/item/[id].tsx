import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { LinkPressable } from '@/components/LinkPressable';
import { reminderService } from '@/features/reminders/reminder.service';
import { ActionButton, colors } from '@/components/ActionButton';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Link, useFocusEffect } from 'expo-router';
import { itemService } from '@/features/items/item.service';
import { useUpdateItem, useArchiveItem, useDeleteItem, useLocationHistory, useMoveItem } from '@/hooks/useItems';
import type { ItemWithLocation } from '@/features/items/item.types';
import { LocationPicker } from '@/components/LocationPicker';
import { ItemFields, emptyItemDraft, type ItemDraft } from '@/components/ItemFields';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemWithLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyItemDraft);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [movePicker, setMovePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reminderLabel, setReminderLabel] = useState('None');

  const { updateItem, isSubmitting, fieldErrors } = useUpdateItem();
  const { archiveItem, isArchiving } = useArchiveItem();
  const { deleteItem, isDeleting } = useDeleteItem();

  const { history, error: historyError, isLoading: isHistoryLoading, refresh: refreshHistory } = useLocationHistory(id);
  const { moveItem, isMoving } = useMoveItem();

  const loadItem = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemService.getItem(id);
      setItem(result);
      setPhotoFailed(false);
      try {
        const pending = await reminderService.getForItem(id);
        setReminderLabel(pending.length ? new Date(pending[0].remindAt).toLocaleDateString() : 'None');
      } catch { setReminderLabel('Unavailable'); }
      if (result) {
        setDraft({ name: result.name, description: result.description ?? '', quantity: String(result.quantity),
          unit: result.unit ?? '', condition: result.condition ?? '', notes: result.notes ?? '',
          categoryId: result.categoryId, tagIds: result.tagIds ?? [], photoUri: result.photoUri });
      }
    } catch {
      setError('Could not load the item.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void loadItem(); }, [loadItem]));

  const handleSave = async () => {
    const result = await updateItem(id, { ...draft, quantity: Number(draft.quantity) });
    if (result.success) {
      setIsEditing(false);
      await loadItem();
      return;
    }
    Alert.alert('Could not update', result.message);
  };

  const handleArchive = () => {
    Alert.alert('Archive this item?', item?.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          const result = await archiveItem(id);
          if (result.success) {
            router.back();
          } else {
            Alert.alert('Could not archive', result.message);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete this item?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteItem(id);
          if (result.success) {
            router.back();
          } else {
            Alert.alert('Could not delete', result.message);
          }
        },
      },
    ]);
  };

  const busy = isLoading || isMoving || isArchiving || isDeleting || isSubmitting || photoBusy;
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/items');
  const showMenu = () => Alert.alert(item?.name ?? 'Item', 'Item actions', [
    { text: 'Location history', onPress: () => setShowHistory(true) },
    { text: 'Add reminder', onPress: () => router.push({ pathname: '/more/reminders', params: { itemId: id } }) },
    { text: 'Archive', onPress: handleArchive },
    { text: 'Delete', style: 'destructive', onPress: handleDelete },
    { text: 'Cancel', style: 'cancel' },
  ]);

  if (isLoading && !item) return <SafeAreaView style={styles.center}><ActivityIndicator color={colors.primaryDark} /><Text>Loading item...</Text></SafeAreaView>;
  if (error || !item) return <SafeAreaView style={styles.center}><Text accessibilityRole="alert" style={styles.error}>{error ?? 'Item not found.'}</Text><ActionButton onPress={loadItem}>Try Again</ActionButton><ActionButton variant="link" onPress={goBack}>Back</ActionButton></SafeAreaView>;

  return <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {isEditing ? <>
        <Text accessibilityRole="header" style={styles.name}>Edit Item</Text>
        <ItemFields value={draft} onChange={setDraft} errors={fieldErrors} disabled={busy} onPhotoBusyChange={setPhotoBusy} />
      </> : <>
        <View style={styles.hero}>
          {item.photoUri && !photoFailed ? <Image accessibilityLabel={`${item.name} photo`} source={{ uri: item.photoUri }} resizeMode="cover" style={styles.photo} onError={() => setPhotoFailed(true)} /> :
            <View style={[styles.photo, styles.placeholder]}><AppIcon name="items" color={colors.primaryDark} /><Text style={styles.caption}>No photo</Text></View>}
          <Pressable accessibilityRole="button" accessibilityLabel="Back to items" disabled={busy} onPress={goBack} style={[styles.photoButton, styles.back]}><Text style={styles.backGlyph}>‹</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Item actions" disabled={busy} onPress={showMenu} style={[styles.photoButton, styles.menu]}><Text style={styles.backGlyph}>⋮</Text></Pressable>
        </View>
        <View style={styles.nameRow}><Text accessibilityRole="header" style={styles.name}>{item.name}</Text><ActionButton variant="secondary" disabled={busy} onPress={() => setIsEditing(true)}>✎ Edit</ActionButton></View>
        <View style={styles.chips}>{item.categoryName && <Text style={[styles.chip, styles.category]}>{item.categoryName}</Text>}{item.tags?.map(tag => <Text style={styles.chip} key={tag.id}>{tag.name}</Text>)}</View>
        <LocationPicker value={item.currentLocationId ?? null} label={item.currentLocationPath} disabled={busy} visible={movePicker} onVisibleChange={setMovePicker}
          renderTrigger={(open) => <Pressable accessibilityRole="button" accessibilityLabel="Change item location" disabled={busy} onPress={open} style={styles.locationCard}>
            <AppIcon name="locations" color={colors.primaryDark} /><View style={styles.locationBody}><Text style={styles.cardTitle}>Location</Text><Text style={styles.caption}>{item.currentLocationPath?.replace(/\//g, ' › ') ?? 'Unknown location'}</Text></View><Text style={styles.chevron}>›</Text>
          </Pressable>}
          onChange={async (newLocationId) => {
            if (newLocationId === item.currentLocationId) return;
            const result = await moveItem(id, newLocationId);
            if (result.success) { await loadItem(); await refreshHistory(); }
            else Alert.alert('Could not move item', result.message);
          }} />
        <View style={styles.infoGrid}>
          <InfoCard icon="items" label="Quantity"><Text style={styles.value}>{item.quantity} {item.unit ?? ''}</Text></InfoCard>
          <InfoCard icon="condition" label="Condition"><Text style={[styles.value, item.condition?.toLowerCase() === 'good' && styles.good]}>{item.condition || 'Not set'}</Text></InfoCard>
          <InfoCard icon="calendar" label="Date Added"><Text style={styles.value}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text></InfoCard>
          <Link href={{ pathname: '/more/reminders', params: { itemId: id } }} asChild><LinkPressable style={styles.infoCard} accessibilityLabel="Manage item reminders"><AppIcon name="reminders" color={colors.muted} /><View style={styles.infoBody}><Text style={styles.caption}>Reminder</Text><Text style={styles.value}>{reminderLabel}</Text></View></LinkPressable></Link>
        </View>
        {!!item.description && <View style={styles.notesCard}><Text style={styles.cardTitle}>Description</Text><Text style={styles.notes}>{item.description}</Text></View>}
        <View style={styles.notesCard}><View style={styles.notesHeading}><AppIcon name="notes" color={colors.muted} /><Text style={styles.cardTitle}>Notes</Text></View><Text style={styles.notes}>{item.notes || 'No notes yet.'}</Text></View>
        {showHistory && <View style={styles.notesCard}>
          <View style={styles.nameRow}><Text style={styles.cardTitle}>Location History</Text><ActionButton variant="link" onPress={() => setShowHistory(false)}>Hide</ActionButton></View>
          {isHistoryLoading ? <ActivityIndicator color={colors.primaryDark} /> : historyError ? <ActionButton variant="link" onPress={refreshHistory}>{historyError} Tap to retry.</ActionButton> : history.length === 0 ? <Text style={styles.caption}>No history yet.</Text> : history.map(entry => <View key={entry.id} style={styles.historyRow}><Text style={styles.value}>{entry.locationPath ?? 'Unknown location'}{entry.isCurrent ? ' (current)' : ''}</Text><Text style={styles.caption}>{new Date(entry.startedAt).toLocaleDateString()} – {entry.endedAt ? new Date(entry.endedAt).toLocaleDateString() : 'present'}</Text></View>)}
        </View>}
      </>}
    </ScrollView>
    <View style={styles.footer}>{isEditing ? <>
      <ActionButton variant="secondary" style={styles.footerButton} disabled={busy} onPress={() => { setIsEditing(false); void loadItem(); }}>Cancel</ActionButton>
      <ActionButton style={styles.footerButton} disabled={busy} onPress={handleSave}>{isSubmitting ? 'Saving...' : 'Save Item'}</ActionButton>
    </> : <>
      <ActionButton variant="secondary" style={styles.footerButton} disabled={busy || isLoading} onPress={() => setMovePicker(true)}>{isMoving ? 'Moving...' : '⌖ Move'}</ActionButton>
      <ActionButton style={styles.footerButton} disabled={busy || isLoading} onPress={() => setIsEditing(true)}>✎ Edit</ActionButton>
    </>}</View>
  </SafeAreaView>;
}

function InfoCard({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return <View style={styles.infoCard}><AppIcon name={icon} color={colors.muted} /><View style={styles.infoBody}><Text style={styles.caption}>{label}</Text>{children}</View></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 12 },
  hero: { borderRadius: 12, overflow: 'hidden' }, photo: { width: '100%', aspectRatio: 1.3, backgroundColor: '#E8F7F5' }, placeholder: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  photoButton: { position: 'absolute', top: 8, width: 44, height: 44, backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, back: { left: 8 }, menu: { right: 8 }, backGlyph: { fontSize: 30, color: colors.text },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, name: { flex: 1, fontSize: 24, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { fontSize: 12, color: colors.muted, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EEF3F8', borderRadius: 10 }, category: { color: '#0369A1', backgroundColor: '#E0F2FE' },
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, backgroundColor: '#E8F7F5', minHeight: 72 }, locationBody: { flex: 1, gap: 4 }, chevron: { fontSize: 24, color: colors.muted },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }, infoCard: { width: '48%', minHeight: 88, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, infoBody: { flex: 1, gap: 6 },
  caption: { fontSize: 13, color: colors.muted }, value: { fontSize: 14, fontWeight: '600', color: colors.text }, good: { backgroundColor: '#D1FAE5', color: '#047857', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  notesCard: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12, gap: 8 }, notesHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text }, notes: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: colors.background }, footerButton: { flex: 1, minHeight: 52 },
  error: { color: '#B91C1C', textAlign: 'center' }, historyRow: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 12, gap: 6 },
});
