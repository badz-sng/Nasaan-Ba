import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from './ActionButton';
const steps = [
  'Making room for your things — opening your inventory…',
  'A place for everything — setting up your locations…',
  'Keeping your space yours — checking security…',
  'All set. Let’s find what you need!',
];
export function StartupScreen({ step }: { step: number }) {
  return <View style={styles.screen}>
    <View style={styles.brand}><Image source={require('../../assets/icon.png')} style={styles.icon} accessibilityLabel="Nasaan ba? app logo" /><Text style={styles.title}>Nasaan ba?</Text><Text style={styles.tagline}>Less searching. More living.</Text></View>
    <View style={styles.status}>
      <View accessibilityRole="progressbar" accessibilityLabel="App startup" accessibilityValue={{ min: 0, max: 3, now: step }} style={styles.track}><View style={[styles.fill, { width: `${step / 3 * 100}%` }]} /></View>
      <Text accessibilityLiveRegion="polite" style={styles.message}>{steps[step]}</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F7F5', justifyContent: 'center', padding: 32 },
  brand: { alignItems: 'center', gap: 16 }, icon: { width: 88, height: 88, borderRadius: 20 },
  title: { fontSize: 36, fontWeight: '700', color: colors.text }, tagline: { fontSize: 16, color: colors.primaryDark },
  status: { marginTop: 64, gap: 16 }, track: { height: 6, backgroundColor: '#C4E6E0', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primaryDark }, message: { color: colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 22 },
});
