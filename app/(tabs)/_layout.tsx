import { Tabs } from 'expo-router';
import { colors } from '@/components/ActionButton';
import { AppIcon } from '@/components/AppIcon';

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primaryDark,
    tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: colors.border },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '500' }, tabBarItemStyle: { paddingVertical: 4 } }}>
    {[['index', 'Home'], ['items', 'Items'], ['search', 'Search'], ['locations', 'Locations'], ['more', 'More']].map(([name, title]) =>
      <Tabs.Screen key={name} name={name} options={{ title, tabBarAccessibilityLabel: title, tabBarIcon: ({ color }) => <AppIcon name={name} color={color} /> }} />)}
  </Tabs>;
}
