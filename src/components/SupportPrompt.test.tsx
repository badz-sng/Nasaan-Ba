jest.mock('expo-router', () => ({ usePathname: () => mockPath }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('@/services/appLockService', () => ({ useAppLock: Object.assign(() => ({ enabled: false, locked: false }), { getState: () => ({ enabled: false, locked: false }) }) }));
jest.mock('./SupportModal', () => ({ SupportModal: 'SupportModal' }));
import { createElement } from 'react';
import { AppState, Modal } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ActionButton } from './ActionButton';
import { SupportPrompt } from './SupportPrompt';
const { act, create } = require('react-test-renderer');
let mockPath = '/';

test('prompt waits for navigation, opens support, and respects a persisted cooldown', async () => {
  AppState.currentState = 'active';
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue();
  let tree: any;
  try {
    await act(async () => { tree = create(createElement(SupportPrompt)); });
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
    for (let i = 0; i < 10; i++) {
      mockPath = i % 2 === 0 ? '/items' : '/locations';
      await act(async () => tree.update(createElement(SupportPrompt)));
      if (i < 9) expect(tree.root.findByType(Modal).props.visible).toBe(false);
    }
    expect(tree.root.findByType(Modal).props.visible).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    const button = tree.root.findAllByType(ActionButton).find((node: any) => node.props.children === 'Support me');
    await act(async () => button.props.onPress());
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
    expect(tree.root.findByType('SupportModal').props.visible).toBe(true);
    await act(async () => tree.unmount());
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(String(Date.now()));
    await act(async () => { tree = create(createElement(SupportPrompt)); });
    for (let i = 0; i < 12; i++) {
      mockPath = i % 2 === 0 ? '/items' : '/locations';
      await act(async () => tree.update(createElement(SupportPrompt)));
    }
    expect(tree.root.findByType(Modal).props.visible).toBe(false);
  } finally { await act(async () => tree.unmount()); }
});
