import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { LocationTreeNode } from '@/features/locations/location.types';

interface LocationTreeProps {
  nodes: LocationTreeNode[];
  onSelect?: (node: LocationTreeNode) => void;
  selectedId?: string | null;
  onDelete?: (node: LocationTreeNode) => void;
}

function LocationTreeNodeRow({
  node,
  depth,
  onSelect,
  selectedId,
  onDelete,
}: {
  node: LocationTreeNode;
  depth: number;
  onSelect?: (node: LocationTreeNode) => void;
  selectedId?: string | null;
  onDelete?: (node: LocationTreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <View>
      <Pressable
        style={[styles.row, { paddingLeft: 12 + depth * 16 }, isSelected && styles.rowSelected]}
        onPress={() => onSelect?.(node)}
        onLongPress={() => onDelete?.(node)}
      >
        {hasChildren ? (
          <Pressable
            onPress={() => setExpanded((e) => !e)}
            hitSlop={8}
            style={styles.expandButton}
          >
            <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
          </Pressable>
        ) : (
          <View style={styles.expandPlaceholder} />
        )}
        <View style={styles.labelBlock}>
          <Text style={styles.name}>{node.name}</Text>
          {node.type && <Text style={styles.type}>{node.type}</Text>}
        </View>
      </Pressable>

      {expanded &&
        node.children.map((child) => (
          <LocationTreeNodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            onSelect={onSelect}
            selectedId={selectedId}
            onDelete={onDelete}
          />
        ))}
    </View>
  );
}

export function LocationTree({ nodes, onSelect, selectedId, onDelete }: LocationTreeProps) {
  if (nodes.length === 0) {
    return <Text style={styles.empty}>No locations yet. Add one to get started!</Text>;
  }

  return (
    <View style={styles.container}>
      {nodes.map((node) => (
        <LocationTreeNodeRow
          key={node.id}
          node={node}
          depth={0}
          onSelect={onSelect}
          selectedId={selectedId}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowSelected: { backgroundColor: '#f0f9ff' },
  expandButton: { width: 24, alignItems: 'center' },
  expandIcon: { fontSize: 10, color: '#666' },
  expandPlaceholder: { width: 24 },
  labelBlock: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500' },
  type: { fontSize: 11, color: '#888', marginTop: 2 },
  empty: { color: '#888', textAlign: 'center', marginTop: 24 },
});
