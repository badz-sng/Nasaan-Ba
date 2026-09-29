import { useRef, useState } from 'react';
import { View, Image, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { pickPhoto } from '@/services/imageService';

export function PhotoPicker({ value, onChange, disabled, onBusyChange }: { value: string | null; onChange: (uri: string | null) => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const selecting = useRef(false);
  const choose = async (camera: boolean) => {
    if (selecting.current || disabled) return;
    selecting.current = true;
    setBusy(true); onBusyChange?.(true);
    try { const uri = await pickPhoto(camera); if (uri) onChange(uri); }
    catch (err) { Alert.alert('Could not add photo', err instanceof Error ? err.message : 'Please try again.'); }
    finally { selecting.current = false; setBusy(false); onBusyChange?.(false); }
  };
  return (
    <View style={{ gap: 12, marginTop: 12 }}>
      <Text>Photo (optional)</Text>
      {value && <Image accessibilityLabel="Item photo" source={{ uri: value }} style={{ width: '100%', height: 200 }} resizeMode="contain" />}
      {busy && <ActivityIndicator />}
      <View style={{ flexDirection: 'row', gap: 20 }}>
        <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={() => choose(false)}><Text>Choose Photo</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={() => choose(true)}><Text>Camera</Text></Pressable>
        {value && <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={() => onChange(null)}><Text>Remove</Text></Pressable>}
      </View>
    </View>
  );
}
