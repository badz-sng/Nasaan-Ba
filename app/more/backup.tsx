import { View, Text, StyleSheet } from 'react-native';

// TODO: wire to backupService.ts
// Export: read all tables via Drizzle, serialize to JSON with a
// { schema_version, exported_at, data } envelope, write via
// expo-file-system, share via expo-sharing.
// Restore: read file, validate schema_version + shape (zod) BEFORE
// touching the DB, wrap the actual insert in a transaction, and only
// commit if every table imports cleanly. Never partially restore.
export default function BackupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Backup & Restore — TODO: wire to backupService.ts</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  placeholder: { color: '#888', textAlign: 'center' },
});
