import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

// TODO: list of Reminders / Categories / Tags / Backup & Restore / App Lock /
// Settings / About, per spec section 3.1.
export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>More</Text>
      <Link href="/more/backup" style={styles.link}>Backup &amp; Restore</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, gap: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  link: { color: '#2563eb', fontSize: 16 },
});
