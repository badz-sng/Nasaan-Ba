import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Link } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@/hooks/useSearch';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { results, isSearching, error, search, clear } = useSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      clear();
      return;
    }

    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search, clear]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>

      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Search your items"
        autoFocus
        returnKeyType="search"
      />

      {isSearching && <ActivityIndicator style={styles.loader} />}

      {error && <Text style={styles.error}>{error}</Text>}

      {!isSearching && !error && query.trim().length >= 2 && results.length === 0 && (
        <Text style={styles.empty}>No items found for "{query}"</Text>
      )}

      {!error && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.itemId}
          renderItem={({ item }) => (
            <Link href={{ pathname: '/item/[id]', params: { id: item.itemId } }} asChild>
              <Pressable style={styles.resultRow}>
                <Text style={styles.resultName}>{item.name}</Text>
                {item.snippet ? (
                  <Text style={styles.snippet} numberOfLines={2}>
                    {item.snippet.replace(/\*\*/g, '')}
                  </Text>
                ) : null}
                <Text style={styles.meta}>
                  {item.categoryName ? `${item.categoryName} · ` : ''}
                  Location: {item.locationPath || 'No location'}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  searchInput: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  loader: { marginTop: 24 },
  error: { color: '#b91c1c', textAlign: 'center', marginTop: 16 },
  empty: { color: '#888', textAlign: 'center', marginTop: 24 },
  resultRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  resultName: { fontSize: 16, fontWeight: '500' },
  snippet: { color: '#666', marginTop: 4, fontSize: 14 },
  meta: { color: '#888', marginTop: 4, fontSize: 12 },
});
