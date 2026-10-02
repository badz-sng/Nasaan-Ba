import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { ActionButton, colors } from '@/components/ActionButton';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { Link } from 'expo-router';
import { LocationTree } from '@/components/LocationTree';
import { useLocationTree, useCreateLocation, useDeleteLocation, useUpdateLocation } from '@/hooks/useLocations';
import type { LocationTreeNode } from '@/features/locations/location.types';

export default function LocationsScreen() {
  const { tree, isLoading, error, refresh } = useLocationTree();
  const { createLocation, isSubmitting } = useCreateLocation();
  const { updateLocation, isSubmitting: isUpdating } = useUpdateLocation();
  const [editing, setEditing] = useState<LocationTreeNode | null>(null);
  const { deleteLocation, deleteLocationWithSubtree, fieldErrors } = useDeleteLocation();
  void fieldErrors;
  const [showAddForm, setShowAddForm] = useState(false);
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentLabel, setParentLabel] = useState<string | null>(null);

  const handleAdd = async () => {
    const input = {
      name: newName,
      parentId,
    };
    const result = editing ? await updateLocation(editing.id, input) : await createLocation(input);

    if (result.success) {
      setNewName('');
      setParentId(null);
      setParentLabel(null);
      setShowAddForm(false);
      setEditing(null);
      await refresh();
      return;
    }

    Alert.alert('Could not save', result.message);
  };

  const handleDelete = (node: LocationTreeNode) => {
    Alert.alert('Delete this location?', node.path, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteLocation(node.id);
          if (result.success) {
            await refresh();
            return;
          }

          const deleteFieldErrors = result.fieldErrors;
          if (deleteFieldErrors?.requiresSubtreeConfirmation === 'true') {
            Alert.alert(
              'Delete sub-locations?',
              `This will also delete ${deleteFieldErrors.descendantCount} sub-location(s). Continue?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete All',
                  style: 'destructive',
                  onPress: async () => {
                    const subtreeResult = await deleteLocationWithSubtree(node.id);
                    if (subtreeResult.success) {
                      await refresh();
                      return;
                    }

                    Alert.alert('Could not delete', subtreeResult.message);
                  },
                },
              ]
            );
            return;
          }

          Alert.alert('Could not delete', result.message);
        },
      },
    ]);
  };

  const handleSelectParent = (node: LocationTreeNode) => {
    setParentId(node.id);
    setParentLabel(node.path);
  };

  return (
<SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Locations</Text><Pressable accessibilityRole="button" accessibilityLabel="Add location" disabled={isSubmitting || isUpdating} onPress={() => { setEditing(null); setNewName(''); setParentId(null); setParentLabel(null); setShowAddForm(true); }} style={styles.addIcon}><Text style={styles.plus}>＋</Text></Pressable></View>
      <View style={styles.search}><AppIcon name="search" color={colors.muted} /><TextInput accessibilityLabel="Search locations" placeholder="Search locations..." placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={styles.searchInput} autoCorrect={false} />{!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}><Text style={styles.clearText}>×</Text></Pressable>}</View>

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
        <ScrollView style={styles.treeContainer}>
          <LocationTree nodes={tree} query={query} onDelete={handleDelete} onSelect={(node) => {
            setEditing(node);
            setNewName(node.name);
            setParentId(node.parentId);
            setParentLabel(null);
            setShowAddForm(true);
          }} />
        </ScrollView>
      )}

      {showAddForm && (
        <View style={styles.addForm}>
          <Text>{editing ? `Edit ${editing.name}` : 'New location'}</Text>
          {editing && <Link href={{ pathname: '/more/reminders', params: { locationId: editing.id } }} asChild><ActionButton variant="secondary">Add Reminder for This Location</ActionButton></Link>}
          <Text style={styles.formLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Bedroom Cabinet"
          />
          <Text style={styles.formLabel}>Parent (optional)</Text>
          <Text style={styles.parentHint}>
            {parentLabel ?? (parentId ? 'Current parent (unchanged)' : 'Root level — no parent')}
          </Text>
          <ScrollView style={styles.parentPicker} nestedScrollEnabled>
            <Pressable
              style={styles.parentOption}
              onPress={() => {
                setParentId(null);
                setParentLabel(null);
              }}
            >
              <Text>— Root level —</Text>
            </Pressable>
            <LocationTree nodes={tree} onSelect={handleSelectParent} selectedId={parentId} />
          </ScrollView>
          <View style={styles.formActions}>
            <ActionButton variant="secondary" style={styles.cancelButton} onPress={() => { setShowAddForm(false); setEditing(null); setNewName(''); setParentId(null); setParentLabel(null); }}>
              <Text>Cancel</Text>
            </ActionButton>
            <ActionButton variant="primary"
              style={[styles.saveButton, (isSubmitting || isUpdating) && styles.saveButtonDisabled]}
              onPress={handleAdd}
              disabled={isSubmitting || isUpdating}
            >
              <Text >{isSubmitting || isUpdating ? 'Saving...' : 'Save'}</Text>
            </ActionButton>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 12 },
  addIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, plus: { color: '#FFFFFF', fontSize: 28 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#EEF3F8', marginBottom: 16 }, searchInput: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 14, color: colors.text },
  clear: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, clearText: { fontSize: 24, color: colors.muted },
  loader: { marginTop: 24 },
  errorBox: { alignItems: 'center', marginTop: 24, gap: 8 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  retryText: { color: '#007F76', fontWeight: '600' },
  treeContainer: { flex: 1 },
  addButton: { marginTop: 12 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  addForm: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    maxHeight: '60%',
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
  parentHint: { fontSize: 14, color: '#333', marginTop: 4, marginBottom: 8 },
  parentPicker: { maxHeight: 160, backgroundColor: '#fff', borderRadius: 8 },
  parentOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: { flex: 1 },
  saveButton: { flex: 1 },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
