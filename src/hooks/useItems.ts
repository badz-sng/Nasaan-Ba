import { useCallback, useEffect, useState } from 'react';
import { itemService, ItemServiceError } from '@/features/items/item.service';
import type { ItemWithLocation } from '@/features/items/item.types';

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
        err instanceof ItemServiceError ? err.message : 'Hindi ma-load ang mga item. I-pull to refresh.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      return { success: false as const, message: 'May naganap na error. Subukan ulit.' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { createItem, isSubmitting, fieldErrors };
}
