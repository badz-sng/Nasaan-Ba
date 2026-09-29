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
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import type { CategoryWithCount } from '@/features/categories/category.types';
import { Link } from 'expo-router';

export default function CategoriesScreen() {
  const { categories, isLoading, error, refresh } = useCategories();
  const { createCategory, isSubmitting: isCreating } = useCreateCategory();
  const { updateCategory, isSubmitting: isUpdating } = useUpdateCategory();
  const { deleteCategory, isDeleting } = useDeleteCategory();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const isSubmitting = isCreating || isUpdating;

  const resetForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setName('');
    setIcon('');
  };

  const openAddForm = () => {
    setEditingCategory(null);
    setName('');
    setIcon('');
    setShowAddForm(true);
  };

  const openEditForm = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon ?? '');
    setShowAddForm(true);
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedIcon = icon.trim();

    if (editingCategory) {
      const result = await updateCategory(editingCategory.id, {
        name: trimmedName,
        icon: trimmedIcon.length > 0 ? trimmedIcon : null,
      });

      if (result.success) {
        resetForm();
        await refresh();
        return;
      }

      Alert.alert('Could not save', result.message);
      return;
    }

    const result = await createCategory({
      name: trimmedName,
      icon: trimmedIcon.length > 0 ? trimmedIcon : undefined,
    });

    if (result.success) {
      resetForm();
      await refresh();
      return;
    }

    Alert.alert('Could not save', result.message);
  };

  const handleDelete = (category: CategoryWithCount) => {
    Alert.alert('Delete this category?', category.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteCategory(category.id);
          if (result.success) {
            await refresh();
            return;
          }

          Alert.alert('Could not delete', result.message);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Categories</Text>
      <Link href="/(tabs)/more">Back</Link>

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
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              {showAddForm ? (
                <View style={styles.form}>
                  <Text style={styles.formLabel}>
                    {editingCategory ? 'Edit category' : 'New category'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Kitchenware"
                  />
                  <Text style={styles.formLabel}>Icon (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={icon}
                    onChangeText={setIcon}
                    placeholder="📦"
                  />
                  <View style={styles.formActions}>
                    <Pressable style={styles.cancelButton} onPress={resetForm}>
                      <Text>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.saveButtonText}>
                        {isSubmitting
                          ? editingCategory
                            ? 'Updating...'
                            : 'Saving...'
                          : editingCategory
                            ? 'Update'
                            : 'Save'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.addButton} onPress={openAddForm}>
                  <Text style={styles.addButtonText}>+ Add Category</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable style={styles.rowBody} onPress={() => openEditForm(item)}>
                <View style={styles.rowTopLine}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  {item.icon ? <Text style={styles.rowIcon}>{item.icon}</Text> : null}
                </View>
                <Text style={styles.rowCount}>
                  {item.itemCount} {item.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={() => handleDelete(item)}
                disabled={isDeleting}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No categories yet.</Text>
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
    alignItems: 'stretch',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowBody: { flex: 1 },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  rowName: { fontSize: 16, fontWeight: '700', color: '#111' },
  rowIcon: { fontSize: 16 },
  rowCount: { marginTop: 6, color: '#666' },
  deleteButton: {
    alignSelf: 'center',
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
