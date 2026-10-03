import { ScreenHeader } from './ScreenHeader';
import { ActionButton } from '@/components/ActionButton';
import { useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LocationTree } from '@/components/LocationTree';
import { useLocationTree } from '@/hooks/useLocations';
import type { LocationTreeNode } from '@/features/locations/location.types';

interface LocationPickerProps {
  value: string | null;
  label?: string | null;
  onChange: (locationId: string, locationPath: string) => void;
  error?: string;
  disabled?: boolean;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  renderTrigger?: (open: () => void) => ReactNode;
}

export function LocationPicker({ value, label, onChange, error, disabled, visible: controlledVisible, onVisibleChange, renderTrigger }: LocationPickerProps) {
  const [internalVisible, setInternalVisible] = useState(false);
  const visible = controlledVisible ?? internalVisible;
  const setVisible = (value: boolean) => { setInternalVisible(value); onVisibleChange?.(value); };
  const { tree, isLoading, error: loadError, refresh } = useLocationTree();

  useEffect(() => { if (visible) void refresh(); }, [visible, refresh]);

  const handleSelect = (node: LocationTreeNode) => {
    onChange(node.id, node.path);
    setVisible(false);
  };

  return (
    <View>
      {renderTrigger ? renderTrigger(() => { if (!disabled) setVisible(true); }) : <Pressable accessibilityRole="button" disabled={disabled} style={[styles.trigger, error && styles.triggerError, disabled && { opacity: 0.5 }]} onPress={() => setVisible(true)}>
        <Text style={label ? styles.triggerText : styles.triggerPlaceholder}>
          {label ?? 'Choose a location'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>}
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}>
        <View style={styles.modal}>
          <ScreenHeader title="Choose a location" onBack={() => setVisible(false)} />

          {isLoading && <ActivityIndicator style={styles.loader} />}
          {!isLoading && loadError && (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{loadError}</Text>
              <Pressable onPress={refresh}>
                <Text style={styles.retry}>Try Again</Text>
              </Pressable>
            </View>
          )}
          {!isLoading && !loadError && (
            <ScrollView style={styles.treeScroll}>
              <LocationTree nodes={tree} onSelect={handleSelect} selectedId={value} />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  triggerError: { borderColor: '#b91c1c' },
  triggerText: { fontSize: 16, flex: 1 },
  triggerPlaceholder: { fontSize: 16, color: '#888', flex: 1 },
  chevron: { fontSize: 20, color: '#888' },
  error: { color: '#b91c1c', fontSize: 12, marginTop: 4 },
  modal: { flex: 1, paddingTop: 60 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: { color: '#007F76', fontSize: 16, fontWeight: '600' },
  loader: { marginTop: 40 },
  errorBox: { alignItems: 'center', marginTop: 40, gap: 8 },
  retry: { color: '#2563eb', fontWeight: '600' },
  treeScroll: { flex: 1, paddingHorizontal: 8 },
});
