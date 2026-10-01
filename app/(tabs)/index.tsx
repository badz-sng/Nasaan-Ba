import { LinkPressable } from '@/components/LinkPressable';
import { useCallback, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { ActionButton, colors } from '@/components/ActionButton';
import { AppIcon } from '@/components/AppIcon';
import { useRecentItems } from '@/hooks/useItems';
import { getDashboardSummary, type DashboardSummary } from '@/services/dashboardService';

const shortcuts = [
  { key: 'items', label: 'Total Items', description: 'active items', href: '/(tabs)/items', icon: 'items', color: colors.primary },
  { key: 'locations', label: 'Locations', description: 'locations', href: '/(tabs)/locations', icon: 'locations', color: '#EF4444' },
  { key: 'categories', label: 'Categories', description: 'categories', href: '/more/categories', icon: 'categories', color: colors.primaryDark },
  { key: 'reminders', label: 'Reminders', description: 'pending reminders', href: '/more/reminders', icon: 'reminders', color: '#D97706' },
] as const;

export function formatAddedDate(value: string, now = Date.now()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  const days = Math.max(0, Math.floor((now - date.getTime()) / 86400000));
  if (days === 0) return 'Today';
  if (days < 30) return days + (days === 1 ? ' day ago' : ' days ago');
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ItemThumbnail({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  return uri && !failed ? <Image source={{ uri }} style={styles.thumbnail} onError={() => setFailed(true)} /> :
    <View style={[styles.thumbnail, styles.photoPlaceholder]}><AppIcon name="items" color={colors.primaryDark} /></View>;
}

export default function HomeScreen() {
  const { items, isLoading, error, refresh } = useRecentItems(10);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const refreshSummary = useCallback(() => {
    try { setSummary(getDashboardSummary()); setSummaryError(false); }
    catch { setSummary(null); setSummaryError(true); }
  }, []);
  useFocusEffect(useCallback(() => { refreshSummary(); }, [refreshSummary]));

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
    <FlatList
      data={error ? [] : items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={() => { refreshSummary(); void refresh(); }}
      refreshing={isLoading}
      ListHeaderComponent={<>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandMark}><AppIcon name="locations" color="#FFFFFF" /></View>
            <Text style={styles.brandName}>Nasaan Ba?</Text>
          </View>
          <Link href="/more/settings" asChild><LinkPressable accessibilityRole="button" accessibilityLabel="Open settings"
            style={styles.settings}><AppIcon name="settings" color={colors.text} /></LinkPressable></Link>
        </View>
        <Text style={styles.greeting}>Good day!</Text>
        <Text style={styles.subtitle}>What are you looking for?</Text>
        <Link href="/(tabs)/search" asChild><LinkPressable accessibilityRole="button" accessibilityLabel="Search for an item"
          style={styles.searchBar}>
          <AppIcon name="search" color={colors.primaryDark} />
          <Text style={styles.searchPlaceholder}>Search for an item...</Text>
        </LinkPressable></Link>
        <View style={styles.stats}>
          {shortcuts.map((shortcut) => <Link key={shortcut.key} href={shortcut.href} asChild>
            <LinkPressable accessibilityRole="button" accessibilityLabel={`${shortcut.label}: ${summary ? summary[shortcut.key] : 'unavailable'} ${shortcut.description}`}
              style={styles.statCard}>
              <AppIcon name={shortcut.icon} color={shortcut.color} />
              <Text style={styles.statValue}>{summary ? summary[shortcut.key] : '—'}</Text>
              <Text style={styles.statLabel}>{shortcut.label}</Text>
            </LinkPressable>
          </Link>)}
        </View>
        {summaryError && <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.errorText}>Could not load your totals.</Text>
          <ActionButton variant="link" onPress={refreshSummary}>Retry totals</ActionButton>
        </View>}
        <Link href="/item/add" asChild><ActionButton style={styles.addButton}>＋ Add New Item</ActionButton></Link>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          <Link href="/(tabs)/items" asChild><ActionButton variant="link" accessibilityLabel="See all items">See all</ActionButton></Link>
        </View>
      </>}
      ListEmptyComponent={isLoading ? <ActivityIndicator color={colors.primaryDark} style={styles.loader} /> : error ?
        <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text><ActionButton variant="secondary" onPress={refresh}>Try Again</ActionButton></View> :
        <View style={styles.emptyState}><AppIcon name="items" color={colors.primaryDark} /><Text style={styles.emptyTitle}>Your items start here</Text>
          <Text style={styles.emptyText}>Add your first item and remember where you put it.</Text></View>}
      renderItem={({ item }) => <Link href={{ pathname: '/item/[id]', params: { id: item.id } }} asChild>
        <LinkPressable accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.currentLocationPath ?? 'No location'}`}
          style={styles.itemRow}>
          <ItemThumbnail key={item.photoUri ?? item.id} uri={item.photoUri} />
          <View style={styles.itemBody}>
            <Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
            <Text numberOfLines={2} style={styles.itemLocation}>{item.currentLocationPath?.replace(/\//g, ' › ') ?? 'No location'}</Text>
            <Text style={styles.itemDate}>{formatAddedDate(item.createdAt)}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </LinkPressable>
      </Link>}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24, width: '100%' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingTop: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  brandMark: { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontSize: 18, fontWeight: '700', color: colors.text, flexShrink: 1 },
  settings: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 30, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, minHeight: 60, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', borderRadius: 10 },
  searchPlaceholder: { fontSize: 14, color: colors.muted, flexShrink: 1 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 },
  statCard: { flexGrow: 1, flexBasis: 64, minHeight: 112, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 4, gap: 6 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  addButton: { marginBottom: 12, minHeight: 52 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, minHeight: 84 },
  thumbnail: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#E8F7F5' },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, gap: 4 },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemLocation: { fontSize: 12, color: colors.muted },
  itemDate: { fontSize: 11, color: colors.muted },
  chevron: { fontSize: 24, color: colors.muted },
  loader: { marginVertical: 24 },
  errorBox: { alignItems: 'center', gap: 8, marginVertical: 12 },
  errorText: { color: '#B91C1C', textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
