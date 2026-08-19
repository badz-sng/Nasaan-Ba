import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useCreateItem } from '@/hooks/useItems';

// Minimal form matching spec 3.6: only name + location are required.
// Location picker (LocationPicker component) is stubbed here with a
// text field pending the Locations module — swap once that's built.
export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');
  const { createItem, isSubmitting, fieldErrors } = useCreateItem();

  const handleSave = async () => {
    const result = await createItem({ name, locationId });

    if (result.success) {
      router.back();
      return;
    }

    // Fallback: surface a clear message instead of a silent failure.
    Alert.alert('Hindi na-save', result.message);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Item</Text>

      <Text style={styles.label}>Item name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Passport"
      />
      {fieldErrors?.name && <Text style={styles.error}>{fieldErrors.name}</Text>}

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        value={locationId}
        onChangeText={setLocationId}
        placeholder="(TODO: LocationPicker — select from tree)"
      />
      {fieldErrors?.locationId && <Text style={styles.error}>{fieldErrors.locationId}</Text>}

      <Pressable
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        <Text style={styles.saveButtonText}>{isSubmitting ? 'Sine-save...' : 'Save Item'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 13, color: '#666', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: '#b91c1c', fontSize: 12 },
  saveButton: { backgroundColor: '#111', padding: 14, borderRadius: 8, marginTop: 24, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontWeight: '600' },
});
