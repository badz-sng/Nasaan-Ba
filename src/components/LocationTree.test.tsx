import { createElement } from 'react';
import { LocationTree, filterLocationTree } from './LocationTree';
jest.mock('react-native', () => {
  const mock = Object.create(jest.requireActual('react-native'));
  for (const name of ['View', 'Text', 'Pressable']) Object.defineProperty(mock, name, { value: 'Mock' + name });
  return mock;
});
const { act, create } = require('react-test-renderer');
test('search preserves ancestors and counts; expanding and selecting remain independent', async () => {
  const drawer = { id: 'drawer', name: 'Drawer', itemCount: 3, children: [] } as any;
  const root = { id: 'home', name: 'Home', itemCount: 3, children: [drawer] } as any;
  expect(filterLocationTree([root], ' DRAW ')).toEqual([root]);
  expect(filterLocationTree([root], 'missing')).toEqual([]);
  const onSelect = jest.fn();
  let tree: any;
  await act(async () => { tree = create(createElement(LocationTree, { nodes: [root], onSelect })); });
  const find = (label: string) => tree.root.findAllByType('MockPressable').find((node: any) => node.props.accessibilityLabel === label);
  await act(async () => find('Collapse Home').props.onPress());
  expect(onSelect).not.toHaveBeenCalled();
  expect(find('Drawer, 3 active items including sub-locations')).toBeUndefined();
  await act(async () => find('Expand Home').props.onPress());
  await act(async () => find('Drawer, 3 active items including sub-locations').props.onPress());
  expect(onSelect).toHaveBeenCalledWith(drawer);
  await act(async () => tree.unmount());
});
