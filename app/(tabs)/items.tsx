import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Link } from 'expo-router';
import { useItems } from '@/hooks/useItems';

export default function ItemsScreen() {
  const { items, isLoading, isLoadingMore, error, hasMore, refresh, loadMore } = useItems({
    pageSize: 20,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Items</Text>

      {isLoading && items.length === 0 && <ActivityIndicator style={styles.loader} />}

      {!isLoading && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={refresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      )}

      {!error && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          onRefresh={refresh}
          refreshing={isLoading && items.length > 0}
          onEndReached={() => {
            if (hasMore) loadMore();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>No items yet. Add one to get started!</Text>
            ) : undefined
          }
          ListFooterComponent={
            isLoadingMore ? <ActivityIndicator style={styles.footerLoader} /> : undefined
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/item/[id]', params: { id: item.id } }} asChild>
              <Pressable style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.categoryName && <Text style={styles.category}>{item.categoryName}</Text>}
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
  loader: { marginTop: 24 },
  footerLoader: { marginVertical: 16 },
  errorBox: { alignItems: 'center', marginTop: 24, gap: 8 },
  errorText: { color: '#b91c1c', textAlign: 'center' },
  retryText: { color: '#2563eb', fontWeight: '600' },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  itemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 16, fontWeight: '500' },
  category: { fontSize: 12, color: '#888', marginTop: 2 },
  itemLocation: { color: '#888', marginTop: 2 },
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
