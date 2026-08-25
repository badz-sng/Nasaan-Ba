import { View, Text, StyleSheet } from 'react-native';

export default function TagsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Tags — coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholder: { color: '#888', textAlign: 'center' },
});
