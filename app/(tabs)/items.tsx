import { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, ActivityIndicator, Pressable, Modal, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { ActionButton, colors } from '@/components/ActionButton';
import { LinkPressable } from '@/components/LinkPressable';
import { AppIcon } from '@/components/AppIcon';
import { useItems } from '@/hooks/useItems';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import type { ItemWithLocation } from '@/features/items/item.types';

const sorts = [{ id: 'nameAsc', name: 'Name (A–Z)' }, { id: 'nameDesc', name: 'Name (Z–A)' }, { id: 'recent', name: 'Most Recent' }] as const;
function Photo({ uri }: { uri: string | null }) {
  const [failed, setFailed] = useState(false);
  return uri && !failed ? <Image source={{ uri }} resizeMode="cover" style={styles.photo} onError={() => setFailed(true)} /> :
    <View style={[styles.photo, styles.placeholder]}><AppIcon name="items" color={colors.primaryDark} /></View>;
}

export default function ItemsScreen() {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>();
  const [tagId, setTagId] = useState<string>();
  const [sort, setSort] = useState<'nameAsc' | 'nameDesc' | 'recent'>('nameAsc');
  const [grid, setGrid] = useState(true);
  const [picker, setPicker] = useState<'categories' | 'tags' | 'sort' | null>(null);
  const categories = useCategories();
  const tags = useTags();
  const { items, isLoading, isLoadingMore, error, hasMore, refresh, loadMore } = useItems({ pageSize: 20, categoryId, tagId, query, sort });
  const options = picker === 'sort' ? sorts : picker === 'categories' ? categories.categories : tags.tags;
  const filterSource = picker === 'categories' ? categories : picker === 'tags' ? tags : null;
  const selected = picker === 'categories' ? categoryId : picker === 'tags' ? tagId : sort;
  const choose = (id?: string) => {
    if (picker === 'categories') setCategoryId(id);
    if (picker === 'tags') setTagId(id);
    if (picker === 'sort') setSort(id as typeof sort);
    setPicker(null);
  };
  const openActions = (item: ItemWithLocation) => Alert.alert(item.name, 'Item actions', [
    { text: 'View details / Edit', onPress: () => router.push({ pathname: '/item/[id]', params: { id: item.id } }) },
    { text: 'Add reminder', onPress: () => router.push({ pathname: '/more/reminders', params: { itemId: item.id } }) },
    { text: 'Cancel', style: 'cancel' },
  ]);

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>All Items</Text>
      <Link href="/item/add" asChild><LinkPressable accessibilityLabel="Add new item" style={styles.add}><Text style={styles.plus}>＋</Text></LinkPressable></Link>
    </View>
    <View style={styles.search}>
      <AppIcon name="search" color={colors.muted} />
      <TextInput accessibilityLabel="Search items" placeholder="Search items..." placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={styles.searchInput} autoCorrect={false} returnKeyType="search" />
      {!!query && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}><Text style={styles.clearText}>×</Text></Pressable>}
    </View>
    <View style={styles.filters}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected: !categoryId && !tagId }} onPress={() => { setCategoryId(undefined); setTagId(undefined); }} style={[styles.filter, !categoryId && !tagId && styles.activeFilter]}><Text style={[styles.filterText, !categoryId && !tagId && styles.activeText]}>All</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Filter by category" accessibilityState={{ selected: !!categoryId }} onPress={() => setPicker('categories')} style={[styles.filter, !!categoryId && styles.activeFilter]}><Text numberOfLines={1} style={[styles.filterText, !!categoryId && styles.activeText]}>{categories.categories.find(c => c.id === categoryId)?.name ?? 'Categories'}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Filter by tag" accessibilityState={{ selected: !!tagId }} onPress={() => setPicker('tags')} style={[styles.filter, !!tagId && styles.activeFilter]}><Text numberOfLines={1} style={[styles.filterText, !!tagId && styles.activeText]}>{tags.tags.find(t => t.id === tagId)?.name ?? 'Tags'}</Text></Pressable>
    </View>
    <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" accessibilityLabel={grid ? 'Switch to list view' : 'Switch to grid view'} onPress={() => setGrid(!grid)} style={styles.toolButton}><AppIcon name={grid ? 'more' : 'categories'} color={colors.muted} /></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Sort items" onPress={() => setPicker('sort')} style={styles.sortButton}><Text style={styles.sortText}>{sorts.find(s => s.id === sort)?.name}  ⌄</Text></Pressable>
    </View>
    <FlatList key={grid ? 'grid' : 'list'} numColumns={grid ? 2 : 1} data={items} keyExtractor={item => item.id}
      style={styles.list} contentContainerStyle={styles.listContent} columnWrapperStyle={grid ? styles.columns : undefined}
      onRefresh={refresh} refreshing={isLoading} onEndReached={() => { if (hasMore && !isLoading && !error) void loadMore(); }} onEndReachedThreshold={0.3}
      ListHeaderComponent={error ? <View style={styles.message}><Text accessibilityRole="alert" style={styles.error}>{error}</Text><ActionButton variant="secondary" onPress={refresh}>Try Again</ActionButton></View> : null}
      ListEmptyComponent={!error ? <View style={styles.message}>{isLoading ? <ActivityIndicator color={colors.primaryDark} /> : <><Text style={styles.emptyTitle}>{query || categoryId || tagId ? 'No matching items' : 'No items yet'}</Text><Text style={styles.emptyText}>{query || categoryId || tagId ? 'Try a different search or filter.' : 'Tap + to add your first item.'}</Text></>}</View> : null}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.primaryDark} style={styles.message} /> : null}
      renderItem={({ item }) => <View style={[styles.card, !grid && styles.listCard]}>
        <Link href={{ pathname: '/item/[id]', params: { id: item.id } }} asChild><LinkPressable accessibilityLabel={`Open ${item.name}`} style={!grid ? styles.listBody : styles.cardBody}>
          <View style={!grid ? styles.listPhoto : undefined}><Photo key={item.photoUri ?? item.id} uri={item.photoUri} /></View>
          <View style={styles.details}><Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
            <View style={styles.chips}>{item.categoryName && <Text numberOfLines={1} style={styles.chip}>{item.categoryName}</Text>}{item.tags?.map(tag => <Text numberOfLines={1} key={tag.id} style={styles.chip}>{tag.name}</Text>)}</View>
            {!grid && <Text numberOfLines={2} style={styles.emptyText}>{item.currentLocationPath?.replace(/\//g, ' › ') ?? 'No location'}</Text>}
          </View>
        </LinkPressable></Link>
        <Pressable accessibilityRole="button" accessibilityLabel={`Actions for ${item.name}`} onPress={() => openActions(item)} style={styles.menu}><Text style={styles.menuText}>⋮</Text></Pressable>
      </View>}
    />
    <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
      <SafeAreaView style={styles.modalBackdrop}><View style={styles.modalPanel}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{picker === 'sort' ? 'Sort items' : picker === 'categories' ? 'Categories' : 'Tags'}</Text><ActionButton variant="link" onPress={() => setPicker(null)}>Close</ActionButton></View>
        <ScrollView>{picker !== 'sort' && <ActionButton variant="secondary" style={styles.option} onPress={() => choose()}>All {picker}</ActionButton>}
          {filterSource?.isLoading && <ActivityIndicator color={colors.primaryDark} />}
          {filterSource?.error && <View style={styles.message}><Text style={styles.error}>{filterSource.error}</Text><ActionButton variant="secondary" onPress={filterSource.refresh}>Try Again</ActionButton></View>}
          {!filterSource?.isLoading && !filterSource?.error && options.length === 0 && <Text style={styles.emptyText}>No {picker} yet. Create them from More.</Text>}
          {options.map(option => <ActionButton key={option.id} style={styles.option} variant={selected === option.id ? 'primary' : 'secondary'} accessibilityState={{ selected: selected === option.id }} onPress={() => choose(option.id)}>{option.name}</ActionButton>)}
        </ScrollView>
      </View></SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  add: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 28, color: '#FFFFFF', lineHeight: 34 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, backgroundColor: '#EEF3F8', paddingHorizontal: 12, minHeight: 48, marginBottom: 12 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, color: colors.text, paddingVertical: 12 },
  clear: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, clearText: { fontSize: 24, color: colors.muted },
  filters: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  filter: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  filterText: { fontSize: 13, color: colors.muted }, activeFilter: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark }, activeText: { color: '#FFFFFF', fontWeight: '600' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  toolButton: { width: 44, height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  sortButton: { minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center' }, sortText: { fontSize: 13, color: colors.text },
  list: { flex: 1 }, listContent: { paddingBottom: 24 }, columns: { justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }, cardBody: { padding: 4 },
  photo: { width: '100%', aspectRatio: 1.5, borderRadius: 10, backgroundColor: '#E8F7F5' }, placeholder: { alignItems: 'center', justifyContent: 'center' },
  details: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 10, flexShrink: 1 }, itemName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 }, chip: { maxWidth: '100%', backgroundColor: '#EEF3F8', borderRadius: 10, fontSize: 10, color: colors.muted, paddingHorizontal: 8, paddingVertical: 5 },
  menu: { position: 'absolute', right: 6, top: 6, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, menuText: { fontSize: 23, color: colors.muted, backgroundColor: '#FFFFFF', borderRadius: 8, width: 28, textAlign: 'center' },
  listCard: { width: '100%' }, listBody: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, paddingRight: 48 }, listPhoto: { width: 88 },
  message: { paddingVertical: 24, alignItems: 'center', gap: 12 }, error: { color: '#B91C1C', textAlign: 'center' }, emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text }, emptyText: { fontSize: 12, color: colors.muted, marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: 24 }, modalPanel: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text }, option: { marginTop: 8 },
});
