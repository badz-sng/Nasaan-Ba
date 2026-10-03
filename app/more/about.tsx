import { ScreenHeader } from '@/components/ScreenHeader';
import { ActionButton } from '@/components/ActionButton';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="About" />
      <Text style={styles.subtitle}>Local-first personal inventory app</Text>
      <Text style={styles.version}>Version 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 8, textAlign: 'center' },
  version: { color: '#888', marginTop: 16 },
});
