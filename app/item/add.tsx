import { ScrollView, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useCreateItem } from '@/hooks/useItems';
import { useAllLocations } from '@/hooks/useLocations';
import { LocationPicker } from '@/components/LocationPicker';
import { ItemFields, emptyItemDraft } from '@/components/ItemFields';
import { UNKNOWN_LOCATION_NAME } from '@/database/seeders/defaultData';

export default function AddItemScreen() {
  const [draft, setDraft] = useState(emptyItemDraft);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const { createItem, isSubmitting, fieldErrors } = useCreateItem();
  const { locations } = useAllLocations();
  useEffect(() => {
    if (locationId) return;
    const unknown = locations.find((l) => l.name === UNKNOWN_LOCATION_NAME);
    if (unknown) { setLocationId(unknown.id); setLocationLabel(unknown.path); }
  }, [locations, locationId]);

  const handleSave = async () => {
    const result = await createItem({ ...draft, quantity: Number(draft.quantity), locationId,
      categoryId: draft.categoryId ?? undefined, photoUri: draft.photoUri ?? undefined });
    if (result.success) router.back();
    else Alert.alert('Could not save', result.message);
  };
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Add Item</Text>
      <ItemFields value={draft} onChange={setDraft} errors={fieldErrors} disabled={isSubmitting || photoBusy} onPhotoBusyChange={setPhotoBusy} />
      <Text>Location</Text>
      <LocationPicker value={locationId} label={locationLabel} disabled={isSubmitting}
        onChange={(id, path) => { setLocationId(id); setLocationLabel(path); }} error={fieldErrors?.locationId} />
      <Pressable accessibilityRole="button" style={styles.button} onPress={handleSave} disabled={isSubmitting || photoBusy}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Saving...' : 'Save Item'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.back()} disabled={isSubmitting || photoBusy}><Text>Cancel</Text></Pressable>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, paddingBottom: 48, gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  button: { backgroundColor: '#111', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
