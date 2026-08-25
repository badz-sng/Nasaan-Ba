import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useRecentItems } from '@/hooks/useItems';

export default function HomeScreen() {
  const { items, isLoading, error, refresh } = useRecentItems(10);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nasaan ba?</Text>

      <Link href="/search" asChild>
        <Pressable style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>Search your items</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>Recently Added</Text>

      {isLoading && <ActivityIndicator style={{ marginTop: 24 }} />}

      {!isLoading && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !error && items.length === 0 && (
        <Text style={styles.emptyText}>You have no recorded items yet. Add one to get started!</Text>
      )}

      {!isLoading && !error && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          onRefresh={refresh}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/item/[id]', params: { id: item.id } }} asChild>
              <Pressable style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemLocation}>
                  Location: {item.currentLocationPath ?? 'No location'}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}

      <Link href="/item/add" asChild>
        <Pressable style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  searchBar: { backgroundColor: '#f2f2f2', borderRadius: 10, padding: 14, marginBottom: 20 },
  searchPlaceholder: { color: '#888' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  itemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemLocation: { color: '#888', marginTop: 2 },
  emptyText: { color: '#888', marginTop: 24, textAlign: 'center' },
  errorBox: { marginTop: 24, alignItems: 'center', gap: 8 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  retryText: { color: '#2563eb', fontWeight: '600' },
  addButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#111',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  addButtonText: { color: '#fff', fontWeight: '600' },
});
