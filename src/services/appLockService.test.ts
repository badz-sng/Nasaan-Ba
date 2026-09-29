jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('expo-local-authentication', () => ({ authenticateAsync: jest.fn(), hasHardwareAsync: jest.fn(), isEnrolledAsync: jest.fn() }));
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Auth from 'expo-local-authentication';
import { initializeAppLock, setAppLock, useAppLock } from './appLockService';

beforeEach(() => { jest.clearAllMocks(); AppState.currentState = 'active'; useAppLock.setState({ enabled: true, locked: true }); });
it('starts locked when enabled, and failed authentication cannot disable the lock', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('enabled');
  await initializeAppLock();
  expect(useAppLock.getState()).toEqual({ enabled: true, locked: true });
  jest.mocked(Auth.authenticateAsync).mockResolvedValue({ success: false, error: 'user_cancel' });
  await expect(setAppLock(false)).rejects.toThrow('Authentication');
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  expect(useAppLock.getState().enabled).toBe(true);
});
it('requires enrollment and persists a setting only after successful authentication', async () => {
  jest.mocked(Auth.hasHardwareAsync).mockResolvedValue(true);
  jest.mocked(Auth.isEnrolledAsync).mockResolvedValue(false);
  await expect(setAppLock(true)).rejects.toThrow('Set up fingerprint');
  jest.mocked(Auth.isEnrolledAsync).mockResolvedValue(true);
  jest.mocked(Auth.authenticateAsync).mockResolvedValue({ success: true });
  await setAppLock(true);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('nasaanba-app-lock', 'enabled');
  expect(useAppLock.getState()).toEqual({ enabled: true, locked: false });
});
