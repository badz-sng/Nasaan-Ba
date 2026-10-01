import { Tabs } from 'expo-router';
import { View, StyleSheet, type ColorValue } from 'react-native';
import { colors } from '@/components/ActionButton';

function TabIcon({ name, color }: { name: string; color: ColorValue }) {
  const stroke = { borderColor: color };
  return <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {name === 'index' && <><View style={[styles.roof, stroke]} /><View style={[styles.house, stroke]} /></>}
    {name === 'items' && <><View style={[styles.box, stroke]} /><View style={[styles.boxLine, { backgroundColor: color }]} /></>}
    {name === 'search' && <><View style={[styles.circle, stroke]} /><View style={[styles.handle, { backgroundColor: color }]} /></>}
    {name === 'locations' && <><View style={[styles.pin, stroke]} /><View style={[styles.dot, { backgroundColor: color }]} /></>}
    {name === 'more' && [5, 11, 17].map(top => <View key={top} style={[styles.line, { top, backgroundColor: color }]} />)}
  </View>;
}

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primaryDark,
    tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.border },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '500' }, tabBarItemStyle: { paddingVertical: 4 } }}>
    {[['index', 'Home'], ['items', 'Items'], ['search', 'Search'], ['locations', 'Locations'], ['more', 'More']].map(([name, title]) =>
      <Tabs.Screen key={name} name={name} options={{ title, tabBarAccessibilityLabel: title, tabBarIcon: ({ color }) => <TabIcon name={name} color={color} /> }} />)}
  </Tabs>;
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24 },
  roof: { position: 'absolute', width: 14, height: 14, left: 5, top: 3, borderTopWidth: 1.8, borderLeftWidth: 1.8, transform: [{ rotate: '45deg' }] },
  house: { position: 'absolute', width: 14, height: 12, left: 5, top: 10, borderWidth: 1.8, borderTopWidth: 0, borderRadius: 1 },
  box: { position: 'absolute', width: 16, height: 17, left: 4, top: 4, borderWidth: 1.8, borderRadius: 2 },
  boxLine: { position: 'absolute', width: 1.8, height: 15, left: 11, top: 5 },
  circle: { position: 'absolute', width: 16, height: 16, top: 2, left: 2, borderRadius: 8, borderWidth: 1.8 },
  handle: { position: 'absolute', width: 9, height: 1.8, top: 18, left: 14, transform: [{ rotate: '45deg' }] },
  pin: { position: 'absolute', width: 16, height: 16, top: 2, left: 4, borderWidth: 1.8, borderRadius: 8, borderBottomRightRadius: 1, transform: [{ rotate: '45deg' }] },
  dot: { position: 'absolute', width: 5, height: 5, top: 7, left: 9.5, borderRadius: 3 },
  line: { position: 'absolute', width: 18, height: 1.8, left: 3, borderRadius: 1 },
});
