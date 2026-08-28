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

export default function TagsScreen() {
  const { tags, isLoading, error, refresh } = useTags();
  const { createTag, isSubmitting, fieldErrors } = useCreateTag();
  const { deleteTag, isDeleting } = useDeleteTag();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');

  const resetForm = () => {
    setName('');
    setShowAddForm(false);
  };

  const handleAdd = async () => {
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
                  <Text style={styles.formLabel}>New tag</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Inventory"
                  />
                  {fieldErrors?.name ? <Text style={styles.fieldError}>{fieldErrors.name}</Text> : null}
                  <View style={styles.formActions}>
                    <Pressable style={styles.cancelButton} onPress={resetForm}>
                      <Text>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                      onPress={handleAdd}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.saveButtonText}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.addButton} onPress={() => setShowAddForm(true)}>
                  <Text style={styles.addButtonText}>+ Add Tag</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowCount}>
                  {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>

              <Pressable
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={() => handleDelete(item.id, item.name, item.itemCount)}
                disabled={isDeleting}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
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
  retryText: { color: '#2563eb', fontWeight: '600' },
  listContent: { paddingBottom: 24 },
  headerBlock: { marginBottom: 12 },
  addButton: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
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
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#111',
    alignItems: 'center',
  },
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
  deleteButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  deleteButtonDisabled: { opacity: 0.5 },
  deleteButtonText: { color: '#b91c1c', fontWeight: '700' },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#666' },
});
