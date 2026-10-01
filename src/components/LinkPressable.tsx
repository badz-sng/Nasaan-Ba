import { forwardRef } from 'react';
import { Pressable, type PressableProps, type View, type StyleProp, type ViewStyle } from 'react-native';

// Link's Slot merges style objects. Keep the pressed callback inside this component.
export const LinkPressable = forwardRef<View, Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }>(function LinkPressable({ style, disabled, ...props }, ref) {
  return <Pressable {...props} ref={ref} disabled={disabled} accessibilityRole="button"
    style={({ pressed }) => [style, pressed && !disabled && { opacity: 0.65 }]} />;
});
