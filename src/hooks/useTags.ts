import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { tagService, TagServiceError } from '@/features/tags/tag.service';
import type { TagWithCount } from '@/features/tags/tag.types';

interface UseTagsResult {
  tags: TagWithCount[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await tagService.getAllTags();
      setTags(result);
    } catch (err) {
      setError(err instanceof TagServiceError ? err.message : 'Could not load tags. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { tags, isLoading, error, refresh };
}

export function useCreateTag() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const createTag = useCallback(async (input: unknown) => {
    setIsSubmitting(true);
    setFieldErrors(undefined);
    try {
      const tag = await tagService.createTag(input);
      return { success: true as const, tag };
    } catch (err) {
      if (err instanceof TagServiceError) {
        setFieldErrors(err.fieldErrors);
        return { success: false as const, message: err.message, fieldErrors: err.fieldErrors };
      }
      return {
        success: false as const,
        message: 'An unexpected error occurred. Please try again.',
        fieldErrors: undefined,
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors(undefined);
  }, []);

  return { createTag, isSubmitting, fieldErrors, clearFieldErrors };
}

export function useDeleteTag() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTag = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await tagService.deleteTag(id);
      return { success: true as const, ...result };
    } catch (err) {
      const message =
        err instanceof TagServiceError ? err.message : 'Could not delete the tag. Please try again.';
      return { success: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteTag, isDeleting };
}
