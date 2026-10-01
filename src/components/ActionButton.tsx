import { forwardRef } from 'react';
import { Pressable, Text, StyleSheet, type PressableProps, type View } from 'react-native';

export const colors = { primary: '#009E8F', primaryDark: '#007F76', text: '#0F172A', muted: '#475569', border: '#E2E8F0', background: '#F8FAFC' };
type Props = Omit<PressableProps, 'children'> & { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger' | 'link' };

export const ActionButton = forwardRef<View, Props>(function ActionButton({ children, variant = 'primary', style, disabled, accessibilityState, ...props }, ref) {
  return <Pressable {...props} ref={ref} disabled={disabled} accessibilityRole="button"
    accessibilityState={{ ...accessibilityState, disabled: !!disabled }}
    style={(state) => [typeof style === 'function' ? style(state) : style, styles.base, styles[variant], disabled && styles.disabled, state.pressed && !disabled && styles.pressed]}>
    <Text style={[styles.label, variant === 'primary' ? styles.light : variant === 'danger' ? styles.dangerText : styles.teal]}>{children}</Text>
  </Pressable>;
});

const styles = StyleSheet.create({
  base: { minHeight: 44, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  secondary: { backgroundColor: '#E8F7F5', borderColor: '#D2EFEB' },
  danger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  link: { backgroundColor: 'transparent', borderColor: 'transparent', alignSelf: 'flex-start', paddingHorizontal: 8 },
  label: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  light: { color: '#FFFFFF' }, teal: { color: colors.primaryDark }, dangerText: { color: '#B91C1C' },
  disabled: { opacity: 0.5 }, pressed: { opacity: 0.75 },
});
