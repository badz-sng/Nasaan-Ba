import { ActionButton } from '@/components/ActionButton';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { authenticate, useAppLock } from '@/services/appLockService';

export function AppLockGate({ children }: { children: ReactNode }) {
  const { enabled, locked } = useAppLock();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const authenticating = useRef(false);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && useAppLock.getState().enabled) useAppLock.setState({ locked: true });
    });
    return () => { subscription.remove(); };
  }, []);
  const unlock = async () => {
    if (authenticating.current) return;
    authenticating.current = true; setBusy(true); setError('');
    try { await authenticate(); useAppLock.setState({ locked: AppState.currentState === 'background' }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not unlock.'); }
    finally { authenticating.current = false; setBusy(false); }
  };
  const hidden = enabled && locked;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, opacity: hidden ? 0 : 1 }} pointerEvents={hidden ? 'none' : 'auto'} accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}>{children}</View>
      {hidden && <View style={styles.cover}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Nasaan ba? is locked</Text>
        {!!error && <Text style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</Text>}
        {busy ? <ActivityIndicator /> : <ActionButton variant="primary" accessibilityRole="button" style={styles.button} onPress={unlock}><Text >Unlock</Text></ActionButton>}
      </View>}
    </View>
  );
}
const styles = StyleSheet.create({
  cover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', padding: 24, gap: 20 },
  button: {  },
});
