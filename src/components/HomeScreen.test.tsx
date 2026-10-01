import { createElement } from 'react';
import HomeScreen, { formatAddedDate } from '../../app/(tabs)/index';
import { useRecentItems } from '@/hooks/useItems';
import { getDashboardSummary } from '@/services/dashboardService';

jest.mock('@/hooks/useItems', () => ({ useRecentItems: jest.fn() }));
jest.mock('@/services/dashboardService', () => ({ getDashboardSummary: jest.fn() }));
jest.mock('expo-router', () => {
  const React = require('react');
  const { Slot } = jest.requireActual('expo-router/build/ui/Slot');
  return { Link: ({ children, href }: any) => React.createElement('MockLink', { href }, React.createElement(Slot, { style: undefined }, children)), useFocusEffect: (callback: () => void) => React.useEffect(callback, [callback]) };
});
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'MockSafeAreaView' }));
jest.mock('react-native', () => {
  const React = require('react');
  const mock = Object.create(jest.requireActual('react-native'));
  for (const name of ['View', 'Text', 'Image', 'Pressable', 'ActivityIndicator']) Object.defineProperty(mock, name, { value: 'Mock' + name });
  Object.defineProperty(mock, 'FlatList', { value: (props: any) => React.createElement('MockFlatList', props,
    props.ListHeaderComponent, props.data.length ? props.data.map((item: any) => React.createElement('MockRow', { key: item.id }, props.renderItem({ item }))) : props.ListEmptyComponent) });
  return mock;
});
const { act, create } = require('react-test-renderer');

test('Home uses live totals, routes shortcuts, handles missing photos, and preserves retry/empty states', async () => {
  const refresh = jest.fn().mockResolvedValue(undefined);
  const item = { id: 'charger', name: 'Laptop Charger', photoUri: 'file:///charger.jpg', currentLocationPath: 'Home/Bedroom/Drawer', createdAt: '2026-10-01T00:00:00Z' };
  jest.mocked(useRecentItems).mockReturnValue({ items: [item] as any, isLoading: false, error: null, refresh });
  jest.mocked(getDashboardSummary).mockReturnValue({ items: 24, locations: 8, categories: 6, reminders: 3 });
  let tree: any;
  await act(async () => { tree = create(createElement(HomeScreen)); });
  const renderedText = () => tree.root.findAllByType('MockText').map((node: any) => node.children.filter((child: any) => typeof child === 'string' || typeof child === 'number').join('')).join('|');
  expect(renderedText()).toContain('24');
  // Exercise Expo's actual Slot merging: the previous callback style became {}.
  const { StyleSheet } = require('react-native');
  const pressables = tree.root.findAllByType('MockPressable');
  const styleFor = (label: string) => {
    const node = pressables.find((p: any) => p.props.accessibilityLabel === label);
    return StyleSheet.flatten(node.props.style({ pressed: false }));
  };
  expect(styleFor('Search for an item')).toMatchObject({ flexDirection: 'row', borderWidth: 1, minHeight: 60, backgroundColor: '#FFFFFF' });
  expect(styleFor('Total Items: 24 active items')).toMatchObject({ backgroundColor: '#FFFFFF', borderRadius: 10, minHeight: 112 });
  expect(styleFor('Laptop Charger, Home/Bedroom/Drawer')).toMatchObject({ flexDirection: 'row', borderBottomWidth: 1 });
  const now = Date.parse('2026-10-04T00:00:00Z');
  expect(formatAddedDate('2026-10-02T00:00:00Z', now)).toBe('2 days ago');
  expect(formatAddedDate('2026-10-03T00:00:00Z', now)).toBe('1 day ago');
  expect(formatAddedDate('2026-10-04T00:00:00Z', now)).toBe('Today');
  expect(formatAddedDate('bad date', now)).toBe('Date unavailable');
  const hrefs = tree.root.findAllByType('MockLink').map((node: any) => node.props.href);
  for (const href of ['/(tabs)/items', '/(tabs)/locations', '/(tabs)/search', '/more/categories', '/more/reminders', '/more/settings', '/item/add']) expect(hrefs).toContain(href);
  expect(hrefs).toContainEqual({ pathname: '/item/[id]', params: { id: 'charger' } });
  expect(renderedText()).toContain('Home › Bedroom › Drawer');
  await act(async () => tree.root.findByType('MockImage').props.onError());
  expect(tree.root.findAllByType('MockImage')).toHaveLength(0);
  await act(async () => tree.root.findByType('MockFlatList').props.onRefresh());
  expect(refresh).toHaveBeenCalledTimes(1);
  jest.mocked(useRecentItems).mockReturnValue({ items: [], isLoading: false, error: 'Could not load items.', refresh });
  await act(async () => tree.update(createElement(HomeScreen)));
  expect(renderedText()).toContain('Try Again');
  jest.mocked(useRecentItems).mockReturnValue({ items: [], isLoading: false, error: null, refresh });
  await act(async () => tree.update(createElement(HomeScreen)));
  expect(renderedText()).toContain('Your items start here');
  await act(async () => tree.unmount());
});
