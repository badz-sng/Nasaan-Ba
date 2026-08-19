import { View, Text, StyleSheet } from 'react-native';

// TODO: wire to location.service.ts — render as a hierarchical tree
// (LocationTree component), root nodes = locations where parent_id IS NULL.
export default function LocationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Locations tree — TODO: wire to location.service.ts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholder: { color: '#888', textAlign: 'center' },
});
