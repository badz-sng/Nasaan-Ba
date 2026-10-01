import { ActionButton } from '@/components/ActionButton';
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useCreateTag, useDeleteTag, useTags } from '@/hooks/useTags';
import { tagService } from '@/features/tags/tag.service';
import { Link } from 'expo-router';

export default function TagsScreen() {
  const { tags, isLoading, error, refresh } = useTags();
  const { createTag, isSubmitting, fieldErrors, clearFieldErrors } = useCreateTag();
  const { deleteTag, isDeleting } = useDeleteTag();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const resetForm = () => {
    setName('');
    setEditingId(null);
    setShowAddForm(false);
    clearFieldErrors();
  };

  const handleAdd = async () => {
    if (editingId) {
      setRenaming(true);
      try { await tagService.renameTag(editingId, { name }); resetForm(); await refresh(); }
      catch (err) { Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.'); }
      finally { setRenaming(false); }
      return;
    }
    const result = await createTag({ name });

    if (result.success) {
      resetForm();
      await refresh();
      return;
    }

    Alert.alert('Could not save', result.message);
  };

  const handleDelete = (tagId: string, tagName: string, itemCount: number) => {
    Alert.alert(
      'Delete this tag?',
      itemCount > 0 ? `Remove this tag? It's used by ${itemCount} item(s).` : tagName,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteTag(tagId);
            if (result.success) {
              await refresh();
              return;
            }

            Alert.alert('Could not delete', result.message);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Link href="/(tabs)/more" asChild><ActionButton variant="link">‹ Back</ActionButton></Link>
      <Text style={styles.title}>Tags</Text>

      {isLoading && <ActivityIndicator style={styles.loader} />}

      {!isLoading && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !error && (
        <FlatList
          data={tags}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {showAddForm ? (
                <View style={styles.form}>
                  <Text style={styles.formLabel}>{editingId ? 'Rename tag' : 'New tag'}</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Inventory"
                  />
                  {fieldErrors?.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}
                  <View style={styles.formActions}>
                    <ActionButton variant="secondary" style={styles.cancelButton} onPress={resetForm}>
                      <Text>Cancel</Text>
                    </ActionButton>
                    <ActionButton variant="primary"
                      style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                      onPress={handleAdd}
                      disabled={isSubmitting || renaming}
                    >
                      <Text >
                        {isSubmitting || renaming ? 'Saving...' : 'Save'}
                      </Text>
                    </ActionButton>
                  </View>
                </View>
              ) : (
                <ActionButton variant="primary" style={styles.addButton} onPress={() => setShowAddForm(true)}>
                  <Text >+ Add Tag</Text>
                </ActionButton>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable accessibilityRole="button" accessibilityLabel={`Rename ${item.name}`} style={styles.rowBody} onPress={() => { setEditingId(item.id); setName(item.name); setShowAddForm(true); }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowCount}>
                  {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </Pressable>

              <ActionButton variant="danger"
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={() => handleDelete(item.id, item.name, item.itemCount)}
                disabled={isDeleting}
              >
                <Text >Delete</Text>
              </ActionButton>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tags yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  loader: { marginTop: 24 },
  errorBox: { alignItems: 'center', marginTop: 24, gap: 8 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  retryText: { color: '#007F76', fontWeight: '600' },
  listContent: { paddingBottom: 24 },
  headerBlock: { marginBottom: 12 },
  addButton: {  },
  addButtonText: { color: '#fff', fontWeight: '600' },
  form: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  formLabel: { fontSize: 13, color: '#666', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  fieldError: { color: '#b91c1c', marginTop: 6 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1 },
  saveButton: { flex: 1 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowBody: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '700', color: '#111' },
  rowCount: { marginTop: 6, color: '#666' },
  deleteButton: {  },
  deleteButtonDisabled: { opacity: 0.5 },
  deleteButtonText: { color: '#b91c1c', fontWeight: '700' },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#666' },
});
