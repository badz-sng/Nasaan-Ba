jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('expo-local-authentication', () => ({ authenticateAsync: jest.fn() }));
import { createElement } from 'react';
import { AppState } from 'react-native';
import { AppLockGate } from './AppLockGate';
import { useAppLock } from '@/services/appLockService';
const { act, create } = require('react-test-renderer');
test('dialogs and focus changes do not lock, but backgrounding still does', async () => {
  let change: any;
  const events: string[] = [];
  const listener = jest.spyOn(AppState, 'addEventListener').mockImplementation((event, callback) => {
    events.push(event); if (event === 'change') change = callback;
    return { remove: jest.fn() };
  });
  useAppLock.setState({ enabled: true, locked: false });
  let tree: any;
  try {
    await act(async () => { tree = create(createElement(AppLockGate, { children: null })); });
    expect(events).not.toContain('blur');
    await act(async () => change('inactive'));
    expect(useAppLock.getState().locked).toBe(false);
    await act(async () => change('background'));
    expect(useAppLock.getState().locked).toBe(true);
  } finally { await act(async () => tree.unmount()); listener.mockRestore(); }
});
