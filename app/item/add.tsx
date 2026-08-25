import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useCreateItem } from '@/hooks/useItems';
import { useAllLocations } from '@/hooks/useLocations';
import { LocationPicker } from '@/components/LocationPicker';
import { UNKNOWN_LOCATION_NAME } from '@/database/seeders/defaultData';

export default function AddItemScreen() {
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const { createItem, isSubmitting, fieldErrors } = useCreateItem();
  const { locations } = useAllLocations();

  useEffect(() => {
    if (locationId || locations.length === 0) return;
    const unknown = locations.find((l) => l.name === UNKNOWN_LOCATION_NAME);
    if (unknown) {
      setLocationId(unknown.id);
      setLocationLabel(unknown.path);
    }
  }, [locations, locationId]);

  const handleSave = async () => {
    if (!locationId) {
      Alert.alert('Could not save', 'Choose a location.');
      return;
    }

    const result = await createItem({ name, locationId });

    if (result.success) {
      router.back();
      return;
    }

    Alert.alert('Could not save', result.message);
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
      <LocationPicker
        value={locationId}
        label={locationLabel}
        onChange={(id, path) => {
          setLocationId(id);
          setLocationLabel(path);
        }}
        error={fieldErrors?.locationId}
      />

      <Pressable
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSubmitting}
      >
        <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save Item'}</Text>
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
