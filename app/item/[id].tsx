import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { itemService } from '@/features/items/item.service';
import { useUpdateItem, useArchiveItem, useDeleteItem } from '@/hooks/useItems';
import type { ItemWithLocation } from '@/features/items/item.types';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemWithLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { updateItem, isSubmitting, fieldErrors } = useUpdateItem();
  const { archiveItem, isArchiving } = useArchiveItem();
  const { deleteItem, isDeleting } = useDeleteItem();

  const loadItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemService.getItem(id);
      setItem(result);
      if (result) {
        setEditName(result.name);
        setEditNotes(result.notes ?? '');
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
    const result = await updateItem(id, { name: editName, notes: editNotes || undefined });
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
    <ScrollView style={styles.container}>
      {!isEditing ? (
        <>
          <Text style={styles.name}>{item.name}</Text>
          {item.categoryName && <Text style={styles.category}>{item.categoryName}</Text>}
          <Text style={styles.sectionLabel}>CURRENT LOCATION</Text>
          <Text style={styles.location}>Location: {item.currentLocationPath ?? 'No location'}</Text>
          {item.notes && (
            <>
              <Text style={styles.sectionLabel}>NOTES</Text>
              <Text style={styles.notes}>{item.notes}</Text>
            </>
          )}

          <Pressable style={styles.actionButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.actionButtonText}>Edit</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleArchive}
            disabled={isArchiving}
          >
            <Text style={styles.secondaryButtonText}>
              {isArchiving ? 'Archiving...' : 'Archive'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Text style={styles.dangerButtonText}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>ITEM NAME</Text>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} />
          {fieldErrors?.name && <Text style={styles.error}>{fieldErrors.name}</Text>}

          <Text style={styles.sectionLabel}>NOTES</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
          />

          <Pressable
            style={[styles.actionButton, isSubmitting && styles.disabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <Text style={styles.actionButtonText}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.secondaryButton]} onPress={() => setIsEditing(false)}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
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
  actionButton: { backgroundColor: '#111', padding: 14, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: { backgroundColor: '#eee' },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
  dangerButton: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  dangerButtonText: { color: '#b91c1c', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 60 },
});
