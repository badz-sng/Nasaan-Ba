import { useCallback, useRef, useState } from 'react';
import { itemService, ItemServiceError } from '@/features/items/item.service';
import type { ItemWithLocation } from '@/features/items/item.types';
import { useFocusEffect } from 'expo-router';
import type { LocationHistoryEntry } from '@/features/items/item.types';

interface UseRecentItemsResult {
  items: ItemWithLocation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRecentItems(limit = 10): UseRecentItemsResult {
  const [items, setItems] = useState<ItemWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemService.getRecentItems(limit);
      setItems(result);
    } catch (err) {
      // Fallback: show empty state + retry, not a blank crash.
      setError(
        err instanceof ItemServiceError ? err.message : 'Could not load items. Pull to refresh.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { items, isLoading, error, refresh };
}

export function useCreateItem() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const createItem = useCallback(async (input: unknown) => {
    setIsSubmitting(true);
    setFieldErrors(undefined);
    try {
      const item = await itemService.createItem(input);
      return { success: true as const, item };
    } catch (err) {
      if (err instanceof ItemServiceError) {
        setFieldErrors(err.fieldErrors);
        return { success: false as const, message: err.message };
      }
      return { success: false as const, message: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { createItem, isSubmitting, fieldErrors };
}

interface UseItemsOptions {
  pageSize?: number;
  categoryId?: string;
  tagId?: string;
}

export function useItems(options: UseItemsOptions = {}) {
  const { pageSize = 20, categoryId, tagId } = options;
  const [items, setItems] = useState<ItemWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchPage = useCallback(
    async (pageOffset: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      try {
        const result = await itemService.getItems({
          offset: pageOffset,
          limit: pageSize,
          categoryId,
          tagId,
        });
        setHasMore(result.length === pageSize);
        setItems((prev) => (append ? [...prev, ...result] : result));
        setOffset(pageOffset + result.length);
      } catch (err) {
        setError(
          err instanceof ItemServiceError ? err.message : 'Could not load items. Please try again.'
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize, categoryId, tagId]
  );

  const refresh = useCallback(async () => {
    setOffset(0);
    await fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    await fetchPage(offset, true);
  }, [fetchPage, offset, isLoadingMore, hasMore]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
);
  return { items, isLoading, isLoadingMore, error, hasMore, refresh, loadMore };
}

export function useUpdateItem() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const updateItem = useCallback(async (id: string, input: unknown) => {
    setIsSubmitting(true);
    setFieldErrors(undefined);
    try {
      const item = await itemService.updateItem(id, input);
      return { success: true as const, item };
    } catch (err) {
      if (err instanceof ItemServiceError) {
        setFieldErrors(err.fieldErrors);
        return { success: false as const, message: err.message };
      }
      return { success: false as const, message: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { updateItem, isSubmitting, fieldErrors };
}

export function useArchiveItem() {
  const [isArchiving, setIsArchiving] = useState(false);

  const archiveItem = useCallback(async (id: string) => {
    setIsArchiving(true);
    try {
      await itemService.archiveItem(id);
      return { success: true as const };
    } catch (err) {
      const message =
        err instanceof ItemServiceError ? err.message : 'Could not archive the item. Please try again.';
      return { success: false as const, message };
    } finally {
      setIsArchiving(false);
    }
  }, []);

  return { archiveItem, isArchiving };
}

export function useDeleteItem() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteItem = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await itemService.deleteItem(id);
      return { success: true as const };
    } catch (err) {
      const message =
        err instanceof ItemServiceError ? err.message : 'Could not delete the item. Please try again.';
      return { success: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteItem, isDeleting };
}

export function useLocationHistory(itemId: string) {
  const [history, setHistory] = useState<LocationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await itemService.getLocationHistory(itemId);
      setHistory(result);
    } catch {
      setError('Could not load location history.');
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return { history, isLoading, error, refresh };
}

export function useMoveItem() {
  const [isMoving, setIsMoving] = useState(false);
  const pending = useRef(false);

  const moveItem = useCallback(async (itemId: string, newLocationId: string) => {
    if (pending.current) return { success: false as const, message: 'A move is already in progress.' };
    pending.current = true;
    setIsMoving(true);
    try {
      await itemService.moveItem(itemId, newLocationId);
      return { success: true as const };
    } catch (err) {
      const message = err instanceof ItemServiceError ? err.message : 'Could not move the item.';
      return { success: false as const, message };
    } finally {
      pending.current = false;
      setIsMoving(false);
    }
  }, []);

  return { moveItem, isMoving };
}
