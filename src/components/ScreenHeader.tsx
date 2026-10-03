import { Pressable, StyleSheet, Text } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors } from './ActionButton';

export function ScreenHeader({ title, fallback = '/(tabs)/more', onBack, disabled = false }: { title: string; fallback?: Href; onBack?: () => void; disabled?: boolean }) {
  const back = onBack ?? (() => router.canGoBack() ? router.back() : router.replace(fallback));
  return <Pressable accessibilityRole="button" accessibilityLabel={`Back from ${title}`} disabled={disabled} onPress={back} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <Text style={styles.arrow}>‹</Text><Text accessibilityRole="header" style={styles.title}>{title}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingVertical: 8 },
  arrow: { fontSize: 32, color: colors.text }, title: { flexShrink: 1, fontSize: 22, fontWeight: '700', color: colors.text }, pressed: { opacity: 0.7 },
});
