import { ScreenHeader } from '@/components/ScreenHeader';
import { ActionButton } from '@/components/ActionButton';
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
      <ScreenHeader title="Add Item" fallback="/(tabs)/items" disabled={isSubmitting || photoBusy} />
      <ItemFields value={draft} onChange={setDraft} errors={fieldErrors} disabled={isSubmitting || photoBusy} onPhotoBusyChange={setPhotoBusy} />
      <Text>Location</Text>
      <LocationPicker value={locationId} label={locationLabel} disabled={isSubmitting}
        onChange={(id, path) => { setLocationId(id); setLocationLabel(path); }} error={fieldErrors?.locationId} />
      <ActionButton variant="primary" accessibilityRole="button" style={styles.button} onPress={handleSave} disabled={isSubmitting || photoBusy}>
        <Text >{isSubmitting ? 'Saving...' : 'Save Item'}</Text>
      </ActionButton>
      <ActionButton variant="secondary" accessibilityRole="button" onPress={() => router.back()} disabled={isSubmitting || photoBusy}><Text>Cancel</Text></ActionButton>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, paddingBottom: 48, gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  button: {  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
