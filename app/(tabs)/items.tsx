import { View, Text, StyleSheet } from 'react-native';

// TODO: wire to a paginated useItems() list hook with category/tag filters.
export default function ItemsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Items list — TODO: wire to item.service.ts findAll()</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholder: { color: '#888', textAlign: 'center' },
});
