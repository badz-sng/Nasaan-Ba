import { createElement } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { ActionButton } from './ActionButton';
jest.mock('react-native', () => { const mock = Object.create(jest.requireActual('react-native')); Object.defineProperty(mock, 'Pressable', { value: 'MockPressable' }); return mock; });
const { act, create } = require('react-test-renderer');

test('actions forward handlers, keep layout, and show disabled/pressed feedback', async () => {
  const onPress = jest.fn();
  const ref = { current: null };
  let tree: any;
  await act(async () => { tree = create(createElement(ActionButton, { onPress, ref, children: 'Save Item', style: { flex: 1, minHeight: 52 } })); });
  let button = tree.root.findByType(Pressable);
  expect(button.props.accessibilityRole).toBe('button');
  expect(button.props.onPress).toBe(onPress);
  expect(StyleSheet.flatten(button.props.style({ pressed: false })).flex).toBe(1);
  expect(StyleSheet.flatten(button.props.style({ pressed: false })).minHeight).toBe(52);
  expect(StyleSheet.flatten(button.props.style({ pressed: true })).opacity).toBe(0.75);
  await act(async () => { tree.update(createElement(ActionButton, { variant: 'danger', disabled: true, onPress, children: 'Delete' })); });
  button = tree.root.findByType(Pressable);
  expect(button.props.disabled).toBe(true);
  expect(button.props.accessibilityState.disabled).toBe(true);
  const style = StyleSheet.flatten(button.props.style({ pressed: true }));
  expect(style.backgroundColor).toBe('#FEF2F2');
  expect(style.opacity).toBe(0.5);
  expect(style.minHeight).toBe(44);
  await act(async () => tree.unmount());
});
