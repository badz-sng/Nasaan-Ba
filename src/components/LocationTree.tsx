import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from './AppIcon';
import { colors } from './ActionButton';
import type { LocationTreeNode } from '@/features/locations/location.types';

export function filterLocationTree(nodes: LocationTreeNode[], query: string): LocationTreeNode[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) return nodes;
  return nodes.flatMap(node => {
    if (node.name.toLocaleLowerCase().includes(term)) return [node];
    const children = filterLocationTree(node.children, query);
    return children.length ? [{ ...node, children }] : [];
  });
}

interface Props {
  nodes: LocationTreeNode[];
  onSelect?: (node: LocationTreeNode) => void;
  selectedId?: string | null;
  onDelete?: (node: LocationTreeNode) => void;
  query?: string;
}

function NodeRow({ node, depth, onSelect, selectedId, onDelete, query }: Omit<Props, 'nodes'> & { node: LocationTreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 3);
  const searching = !!query?.trim();
  useEffect(() => { if (searching) setExpanded(true); }, [searching, query]);
  const branch = node.children.length > 0;
  const home = node.type === 'HOUSE' || node.name.toLowerCase() === 'home';
  return <View>
    <View style={styles.row}>
      {branch ? <Pressable accessibilityRole="button" accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${node.name}`} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.expand}><Text style={styles.arrow}>{expanded ? '⌄' : '›'}</Text></Pressable> : <View style={styles.spacer} />}
      <Pressable accessibilityRole="button" accessibilityLabel={`${node.name}, ${node.itemCount ?? 0} active items including sub-locations`} accessibilityHint={onDelete ? 'Tap to edit. Hold to delete.' : 'Select location'} accessibilityState={{ selected: selectedId === node.id }}
        onPress={() => onSelect?.(node)} onLongPress={onDelete ? () => onDelete(node) : undefined} style={({ pressed }) => [styles.body, selectedId === node.id && styles.selected, pressed && styles.pressed]}>
        {home ? <AppIcon name="index" color="#0284C7" /> : <View style={[styles.folder, branch && styles.folderFilled]}><View style={[styles.folderTab, branch && styles.folderTabFilled]} /></View>}
        <Text style={[styles.name, depth === 0 && styles.rootName]}>{node.name}</Text>
        <Text style={styles.count}>{node.itemCount ?? 0}</Text>
      </Pressable>
    </View>
    {expanded && branch && <View style={styles.children}>{node.children.map(child => <NodeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} onDelete={onDelete} query={query} />)}</View>}
  </View>;
}

export function LocationTree({ nodes, query = '', ...props }: Props) {
  const visible = filterLocationTree(nodes, query);
  if (!visible.length) return <Text style={styles.empty}>{query.trim() ? 'No matching locations.' : 'No locations yet. Add one to get started!'}</Text>;
  return <View>{visible.map(node => <NodeRow key={node.id} node={node} depth={0} query={query} {...props} />)}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  expand: { width: 32, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, spacer: { width: 32 }, arrow: { fontSize: 24, color: colors.muted },
  body: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingRight: 8, borderRadius: 8 },
  name: { flex: 1, fontSize: 14, color: colors.text }, rootName: { fontWeight: '600' },
  count: { backgroundColor: '#E8F7F5', color: colors.text, minWidth: 28, textAlign: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 16, fontSize: 12 },
  children: { marginLeft: 20, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: colors.border },
  folder: { width: 20, height: 15, borderWidth: 1.5, borderColor: colors.muted, borderRadius: 2, marginTop: 3 },
  folderTab: { position: 'absolute', left: -1.5, top: -5, width: 10, height: 5, borderWidth: 1.5, borderBottomWidth: 0, borderColor: colors.muted, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: colors.background },
  folderFilled: { borderColor: '#D97706', backgroundColor: '#FCD34D' }, folderTabFilled: { borderColor: '#D97706', backgroundColor: '#FCD34D' },
  selected: { backgroundColor: '#E8F7F5' }, pressed: { opacity: 0.65 }, empty: { color: colors.muted, textAlign: 'center', padding: 24 },
});
