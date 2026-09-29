import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { PhotoPicker } from '@/components/PhotoPicker';

export interface ItemDraft {
  name: string;
  description: string;
  quantity: string;
  unit: string;
  condition: string;
  notes: string;
  categoryId: string | null;
  tagIds: string[];
  photoUri: string | null;
}
export const emptyItemDraft: ItemDraft = {
  name: '', description: '', quantity: '1', unit: '', condition: '', notes: '',
  categoryId: null, tagIds: [], photoUri: null,
};

export function ItemFields({ value, onChange, errors, disabled, onPhotoBusyChange }: {
  value: ItemDraft;
  onChange: (value: ItemDraft) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  onPhotoBusyChange?: (busy: boolean) => void;
}) {
  const categories = useCategories();
  const tags = useTags();
  return (
    <View style={{ gap: 8 }}>
      <PhotoPicker value={value.photoUri} disabled={disabled} onBusyChange={onPhotoBusyChange} onChange={(photoUri) => onChange({ ...value, photoUri })} />
      {(['name', 'description', 'quantity', 'unit', 'condition', 'notes'] as const).map((field) => (
        <View key={field}>
          <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
          <TextInput accessibilityLabel={field} editable={!disabled} style={styles.input} value={value[field]}
            multiline={field === 'notes' || field === 'description'} keyboardType={field === 'quantity' ? 'number-pad' : 'default'}
            onChangeText={(text) => onChange({ ...value, [field]: text })} />
          {errors?.[field] && <Text style={styles.error}>{errors[field]}</Text>}
        </View>
      ))}
      <Text style={styles.label}>Category (optional)</Text>
      {categories.isLoading && <ActivityIndicator />}
      {categories.error && <Pressable onPress={categories.refresh}><Text style={styles.error}>{categories.error} Tap to retry.</Text></Pressable>}
      <View style={styles.row}>
        {[{ id: null, name: 'None' }, ...categories.categories].map((category) => (
          <Pressable key={category.id ?? 'none'} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: value.categoryId === category.id }}
            style={[styles.chip, value.categoryId === category.id && styles.selected]} onPress={() => onChange({ ...value, categoryId: category.id })}>
            <Text>{category.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Tags (optional)</Text>
      {tags.isLoading && <ActivityIndicator />}
      {tags.error && <Pressable onPress={tags.refresh}><Text style={styles.error}>{tags.error} Tap to retry.</Text></Pressable>}
      {!tags.isLoading && !tags.error && tags.tags.length === 0 && <Text>Create tags from More / Tags.</Text>}
      <View style={styles.row}>
        {tags.tags.map((tag) => (
          <Pressable key={tag.id} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: value.tagIds.includes(tag.id) }}
            style={[styles.chip, value.tagIds.includes(tag.id) && styles.selected]} onPress={() => onChange({ ...value,
              tagIds: value.tagIds.includes(tag.id) ? value.tagIds.filter((id) => id !== tag.id) : [...value.tagIds, tag.id],
            })}><Text>{tag.name}</Text></Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontSize: 13, color: '#555', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 10, borderRadius: 16, borderWidth: 1, borderColor: '#ddd' },
  selected: { backgroundColor: '#dbeafe', borderColor: '#2563eb' },
  error: { color: '#b91c1c' },
});
