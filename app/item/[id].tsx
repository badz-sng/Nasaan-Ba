import { ActionButton } from '@/components/ActionButton';
import { useEffect, useState } from 'react';
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
import { useLocalSearchParams, router, Link } from 'expo-router';
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

  const { updateItem, isSubmitting, fieldErrors } = useUpdateItem();
  const { archiveItem, isArchiving } = useArchiveItem();
  const { deleteItem, isDeleting } = useDeleteItem();

  const { history, error: historyError, isLoading: isHistoryLoading, refresh: refreshHistory } = useLocationHistory(id);
  const { moveItem, isMoving } = useMoveItem();

  const loadItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemService.getItem(id);
      setItem(result);
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
  };

  useEffect(() => {
    loadItem();
  }, [id]);

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

  if (isLoading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!item) return <Text style={styles.error}>Item not found.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <ActionButton variant="link" accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/items')}><Text>Back</Text></ActionButton>
      {!isEditing ? (
        <>
          <Text style={styles.name}>{item.name}</Text>
          {item.photoUri && <Image accessibilityLabel="Item photo" source={{ uri: item.photoUri }} style={{ width: '100%', height: 220, marginTop: 12 }} resizeMode="contain" />}
          {item.categoryName && <Text style={styles.category}>{item.categoryName}</Text>}
          <Text style={styles.sectionLabel}>CURRENT LOCATION</Text>
          <LocationPicker
            value={item.currentLocationId ?? null}
            disabled={isMoving}
            label={item.currentLocationPath}
            onChange={async (newLocationId) => {
              if (newLocationId === item.currentLocationId) return;
              const result = await moveItem(id, newLocationId);
              if (result.success) {
                await loadItem();
                await refreshHistory();
              } else {
                Alert.alert('Could not move item', result.message);
              }
            }}
          />
          {isMoving && <Text>Moving...</Text>}
          <Text style={styles.sectionLabel}>LOCATION HISTORY</Text>
          {isHistoryLoading ? (
            <ActivityIndicator style={{ marginTop: 8 }} />
          ) : historyError ? (
            <Pressable onPress={refreshHistory}><Text style={styles.error}>{historyError} Tap to retry.</Text></Pressable>
          ) : history.length === 0 ? (
            <Text style={styles.hint}>No history yet.</Text>
          ) : (
            history.map((entry) => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyPath}>
                  {entry.locationPath ?? 'Unknown location'}
                  {entry.isCurrent ? ' (current)' : ''}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(entry.startedAt).toLocaleDateString()}
                  {entry.endedAt ? ` – ${new Date(entry.endedAt).toLocaleDateString()}` : ' – present'}
                </Text>
              </View>
            ))
          )}
          {item.description && <Text style={styles.notes}>{item.description}</Text>}
          <Text style={styles.notes}>Quantity: {item.quantity} {item.unit ?? ''}</Text>
          {item.condition && <Text style={styles.notes}>Condition: {item.condition}</Text>}
          {item.notes && (
            <>
              <Text style={styles.sectionLabel}>NOTES</Text>
              <Text style={styles.notes}>{item.notes}</Text>
            </>
          )}
          <ActionButton variant="primary" style={styles.actionButton} disabled={isMoving || isArchiving || isDeleting} onPress={() => setIsEditing(true)}>
            <Text >Edit</Text>
          </ActionButton>
          <Link href={{ pathname: '/more/reminders', params: { itemId: id } }} asChild><ActionButton variant="secondary" style={{ marginTop: 16 }}>Add Reminder</ActionButton></Link>
          <ActionButton variant="secondary"
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleArchive}
            disabled={isArchiving || isMoving || isDeleting}
          >
            <Text >
              {isArchiving ? 'Archiving...' : 'Archive'}
            </Text>
          </ActionButton>
          <ActionButton variant="danger"
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDelete}
            disabled={isDeleting || isMoving || isArchiving}
          >
            <Text >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </ActionButton>
        </>
      ) : (
        <>
          <ItemFields value={draft} onChange={setDraft} errors={fieldErrors} disabled={isSubmitting || photoBusy} onPhotoBusyChange={setPhotoBusy} />

          <ActionButton variant="primary"
            style={[styles.actionButton, isSubmitting && styles.disabled]}
            onPress={handleSave}
            disabled={isSubmitting || photoBusy}
          >
            <Text >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </ActionButton>
          <ActionButton variant="secondary" style={[styles.actionButton, styles.secondaryButton]} disabled={isSubmitting || photoBusy} onPress={() => { setIsEditing(false); void loadItem(); }}>
            <Text >Cancel</Text>
          </ActionButton>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700' },
  category: { color: '#888', marginTop: 4 },
  sectionLabel: { fontSize: 12, color: '#999', marginTop: 24, letterSpacing: 0.5 },
  location: { fontSize: 16, marginTop: 8 },
  notes: { fontSize: 15, marginTop: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginTop: 8 },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  actionButton: { marginTop: 16 },
  actionButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: {  },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
  dangerButton: {  },
  dangerButtonText: { color: '#b91c1c', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 60 },
  hint: {color: '#999', fontStyle: 'italic', marginTop: 8},
  historyRow: {marginTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  historyPath: {fontSize: 14, fontWeight: '600'},
  historyDate: {fontSize: 12, color: '#999', marginTop: 2}
});
