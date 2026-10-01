import { ActionButton } from '@/components/ActionButton';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';

const MORE_LINKS = [
  { href: '/more/reminders', label: 'Reminders' },
  { href: '/more/categories', label: 'Categories' },
  { href: '/more/tags', label: 'Tags' },
  { href: '/more/backup', label: 'Backup & Restore' },
  { href: '/more/app-lock', label: 'App Lock' },
  { href: '/more/settings', label: 'Settings' },
  { href: '/more/about', label: 'About' },
] as const;

export default function MoreScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>More</Text>
      {MORE_LINKS.map((link) => (
        <Link key={link.href} href={link.href} asChild>
          <ActionButton variant="secondary" style={{ marginBottom: 10 }}>{link.label}  ›</ActionButton>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 24 },
});
