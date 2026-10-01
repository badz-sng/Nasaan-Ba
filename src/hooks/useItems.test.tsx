import { createElement } from 'react';
import { useItems } from './useItems';
import { itemService } from '@/features/items/item.service';
jest.mock('@/features/items/item.service', () => ({ itemService: { getItems: jest.fn() }, ItemServiceError: class extends Error {} }));
jest.mock('expo-router', () => ({ useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }));
const { act, create } = require('react-test-renderer');

test('changing search ignores stale results and duplicate pagination requests', async () => {
  const pending: ((rows: any[]) => void)[] = [];
  jest.mocked(itemService.getItems).mockImplementation(() => new Promise(resolve => pending.push(resolve)));
  let result: ReturnType<typeof useItems>;
  function Probe({ query }: { query: string }) { result = useItems({ query, pageSize: 1, sort: 'nameAsc' }); return null; }
  let tree: any;
  await act(async () => { tree = create(createElement(Probe, { query: 'old' })); });
  await act(async () => tree.update(createElement(Probe, { query: 'new' })));
  await act(async () => pending[1]([{ id: 'new' }]));
  await act(async () => pending[0]([{ id: 'old' }]));
  expect(result!.items.map(i => i.id)).toEqual(['new']);
  await act(async () => { void result!.loadMore(); void result!.loadMore(); });
  expect(itemService.getItems).toHaveBeenCalledTimes(3);
  expect(itemService.getItems).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'new', offset: 1, sort: 'nameAsc' }));
  await act(async () => pending[2]([]));
  expect(result!.hasMore).toBe(false);
  expect(result!.isLoadingMore).toBe(false);
  await act(async () => tree.unmount());
});
