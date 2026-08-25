import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import type { ColorValue } from 'react-native';

type TabIconProps = { color: ColorValue; focused: boolean };

function TabIcon({ glyph, color, focused }: TabIconProps & { glyph: string }) {
  return (
    <Text
      accessibilityRole="image"
      style={[styles.icon, { color }, focused && styles.iconFocused]}
    >
      {glyph}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, focused }) => (
          <TabIcon glyph="⌂" color={color} focused={focused} />
        ) }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Search', tabBarIcon: ({ color, focused }) => (
          <TabIcon glyph="⌕" color={color} focused={focused} />
        ) }}
      />
      <Tabs.Screen
        name="items"
        options={{ title: 'Items', tabBarIcon: ({ color, focused }) => (
          <TabIcon glyph="▤" color={color} focused={focused} />
        ) }}
      />
      <Tabs.Screen
        name="locations"
        options={{ title: 'Locations', tabBarIcon: ({ color, focused }) => (
          <TabIcon glyph="⌖" color={color} focused={focused} />
        ) }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, focused }) => (
          <TabIcon glyph="⋯" color={color} focused={focused} />
        ) }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 24, lineHeight: 26, textAlign: 'center' },
  iconFocused: { fontWeight: '700' },
});
