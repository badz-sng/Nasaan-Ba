import { useEffect, useRef, useState } from 'react';
import { AppState, Modal, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppLock } from '@/services/appLockService';
import { ActionButton, colors } from './ActionButton';
import { SupportModal } from './SupportModal';

const KEY = 'nasaanba-support-last-prompt';
const WEEK = 7 * 24 * 60 * 60 * 1000;
const MAIN_SCREENS = ['/', '/items', '/search', '/locations'];

export function SupportPrompt() {
  const pathname = usePathname();
  const { enabled, locked } = useAppLock();
  const hidden = enabled && locked;
  const [eligible, setEligible] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [support, setSupport] = useState(false);
  const visits = useRef(0);
  const previous = useRef(pathname);
  const shown = useRef(false);

  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync(KEY).then((value) => {
      const last = Number(value);
      if (active) setEligible(!value || (Number.isFinite(last) && Date.now() - last >= WEEK));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      if (!hidden && AppState.currentState === 'active') visits.current += 1;
    }
    if (!eligible || shown.current || hidden || visits.current < 10 || !MAIN_SCREENS.includes(pathname) || AppState.currentState !== 'active') return;
    shown.current = true;
    // Persist before showing so a storage failure cannot cause repeated prompts.
    void SecureStore.setItemAsync(KEY, String(Date.now())).then(() => {
      const lock = useAppLock.getState();
      if (AppState.currentState === 'active' && !(lock.enabled && lock.locked) && MAIN_SCREENS.includes(previous.current)) setPrompt(true);
    }).catch(() => undefined);
  }, [pathname, eligible, hidden]);

  useEffect(() => {
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') { setPrompt(false); setSupport(false); }
    });
    return () => listener.remove();
  }, []);

  return <>
    <Modal visible={prompt && !hidden} transparent animationType="fade" onRequestClose={() => setPrompt(false)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">Enjoy using this app?</Text>
          <Text style={styles.body}>A little support helps me keep building Nasaan ba? and bring it to Google Play. Sharing it with a friend helps too!</Text>
          <ActionButton onPress={() => { setPrompt(false); setSupport(true); }}>Support me</ActionButton>
          <ActionButton variant="secondary" onPress={() => setPrompt(false)}>Maybe later</ActionButton>
        </View>
      </View>
    </Modal>
    <SupportModal visible={support && !prompt && !hidden} onClose={() => setSupport(false)} />
  </>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15,23,42,0.45)' },
  card: { padding: 24, borderRadius: 12, gap: 16, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, lineHeight: 23, color: colors.muted },
});
