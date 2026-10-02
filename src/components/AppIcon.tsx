import { View, Text, StyleSheet, type ColorValue } from 'react-native';

export function AppIcon({ name, color }: { name: string; color: ColorValue }) {
  const stroke = { borderColor: color };
  return <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {name === 'index' && <><View style={[styles.roof, stroke]} /><View style={[styles.house, stroke]} /></>}
    {name === 'items' && [[12,2,21,7],[21,7,21,17],[21,17,12,22],[12,22,3,17],[3,17,3,7],[3,7,12,2],[3,7,12,12],[21,7,12,12],[12,12,12,22]].map(([x1,y1,x2,y2], i) => {
      const length = Math.hypot(x2-x1,y2-y1);
      return <View key={i} style={{ position: 'absolute', left: (x1+x2-length)/2, top: (y1+y2)/2-0.9, width: length, height: 1.8, backgroundColor: color, borderRadius: 1, transform: [{ rotate: Math.atan2(y2-y1,x2-x1) + 'rad' }] }} />;
    })}
    {name === 'search' && <><View style={[styles.circle, stroke]} /><View style={[styles.handle, { backgroundColor: color }]} /></>}
    {name === 'locations' && <><View style={[styles.pin, stroke]} /><View style={[styles.dot, { backgroundColor: color }]} /></>}
    {name === 'more' && [5, 11, 17].map(top => <View key={top} style={[styles.line, { top, backgroundColor: color }]} />)}
    {name === 'categories' && [0, 1, 2, 3].map(i => <View key={i} style={[styles.gridSquare, stroke, { left: 3 + (i % 2) * 11, top: 3 + Math.floor(i / 2) * 11 }]} />)}
    {name === 'reminders' && <><View style={[styles.bell, stroke]} /><View style={[styles.bellBase, { backgroundColor: color }]} /><View style={[styles.bellDot, { backgroundColor: color }]} /></>}
    {name === 'condition' && <Text style={[styles.gear, { color }]}>♡</Text>}
    {name === 'notes' && <Text style={[styles.gear, { color }]}>▤</Text>}
    {name === 'calendar' && <View style={{ width: 20, height: 20, margin: 2, borderWidth: 1.8, borderColor: color, borderRadius: 3 }}><View style={{ height: 5, borderBottomWidth: 1.8, borderColor: color }} /></View>}
    {name === 'settings' && <Text style={[styles.gear, { color }]}>⚙</Text>}
  </View>;
}

const styles = StyleSheet.create({
  gridSquare: { position: 'absolute', width: 7, height: 7, borderWidth: 1.8, borderRadius: 1 },
  bell: { position: 'absolute', width: 14, height: 15, left: 5, top: 3, borderWidth: 1.8, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 0 },
  bellBase: { position: 'absolute', width: 18, height: 1.8, left: 3, top: 17 },
  bellDot: { position: 'absolute', width: 4, height: 3, left: 10, top: 20, borderRadius: 2 },
  gear: { fontSize: 25, lineHeight: 26, textAlign: 'center' },
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
