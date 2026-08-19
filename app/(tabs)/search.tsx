import { View, Text, StyleSheet } from 'react-native';

// TODO: wire to useSearch() hook -> search.service.ts -> FTS5 query
// against items_fts (see src/database/migrations/0000_initial.ts).
export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Search screen — TODO: wire to search.service.ts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholder: { color: '#888', textAlign: 'center' },
});
