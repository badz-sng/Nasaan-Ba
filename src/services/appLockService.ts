import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { create } from 'zustand';
import { AppState } from 'react-native';

const KEY = 'nasaanba-app-lock';
export const useAppLock = create<{ enabled: boolean; locked: boolean }>(() => ({ enabled: false, locked: true }));

export async function initializeAppLock(): Promise<void> {
  const enabled = (await SecureStore.getItemAsync(KEY)) === 'enabled';
  useAppLock.setState({ enabled, locked: enabled });
}

export async function authenticate(): Promise<void> {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Nasaan ba?', cancelLabel: 'Cancel', disableDeviceFallback: false });
  if (!result.success) throw new Error('Authentication was not completed. Try again to unlock.');
}

export async function setAppLock(enabled: boolean): Promise<void> {
  if (enabled && !(await LocalAuthentication.hasHardwareAsync() && await LocalAuthentication.isEnrolledAsync())) {
    throw new Error('Set up fingerprint or face authentication in your device settings first.');
  }
  await authenticate();
  await SecureStore.setItemAsync(KEY, enabled ? 'enabled' : 'disabled');
  useAppLock.setState({ enabled, locked: enabled && AppState.currentState !== 'active' });
}
