import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { itemService } from '@/features/items/item.service';
import type { ItemWithLocation } from '@/features/items/item.types';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemWithLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await itemService.getItem(id);
        if (!cancelled) setItem(result);
      } catch {
        if (!cancelled) setError('Hindi ma-load ang item.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) return <ActivityIndicator style={styles.center} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!item) return <Text style={styles.error}>Hindi nahanap ang item.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{item.name}</Text>
      {item.categoryName && <Text style={styles.category}>{item.categoryName}</Text>}
      <Text style={styles.sectionLabel}>CURRENT LOCATION</Text>
      <Text style={styles.location}>📍 {item.currentLocationPath ?? 'Walang lokasyon'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700' },
  category: { color: '#888', marginTop: 4 },
  sectionLabel: { fontSize: 12, color: '#999', marginTop: 24, letterSpacing: 0.5 },
  location: { fontSize: 16, marginTop: 8 },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 60 },
});
