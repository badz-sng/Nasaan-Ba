jest.mock('react-native', () => { const mock = Object.create(jest.requireActual('react-native')); Object.defineProperty(mock, 'Pressable', { value: 'MockPressable' }); return mock; });
jest.mock('expo-router', () => ({ router: { canGoBack: jest.fn(), back: jest.fn(), replace: jest.fn() } }));
import { createElement } from 'react';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from './ScreenHeader';
const { act, create } = require('react-test-renderer');
test('headers pop history and use a replacement only without a previous screen', async () => {
  let tree: any;
  await act(async () => { tree = create(createElement(ScreenHeader, { title: 'Settings' })); });
  jest.mocked(router.canGoBack).mockReturnValue(true);
  tree.root.findByType(Pressable).props.onPress();
  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
  jest.mocked(router.canGoBack).mockReturnValue(false);
  tree.root.findByType(Pressable).props.onPress();
  expect(router.replace).toHaveBeenCalledWith('/(tabs)/more');
  await act(async () => tree.unmount());
});
