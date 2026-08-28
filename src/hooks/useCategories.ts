import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  categoryService,
  CategoryServiceError,
} from '@/features/categories/category.service';
import type { CategoryWithCount } from '@/features/categories/category.types';

interface UseCategoriesResult {
  categories: CategoryWithCount[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await categoryService.getAllCategories();
      setCategories(result);
    } catch (err) {
      setError(
        err instanceof CategoryServiceError
          ? err.message
          : 'Could not load categories. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return { categories, isLoading, error, refresh };
}

export function useCreateCategory() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const createCategory = useCallback(async (input: unknown) => {
    setIsSubmitting(true);
    setFieldErrors(undefined);
    try {
      const category = await categoryService.createCategory(input);
      return { success: true as const, category };
    } catch (err) {
      if (err instanceof CategoryServiceError) {
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

  return { createCategory, isSubmitting, fieldErrors };
}

export function useUpdateCategory() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const updateCategory = useCallback(async (id: string, input: unknown) => {
    setIsSubmitting(true);
    setFieldErrors(undefined);
    try {
      const category = await categoryService.updateCategory(id, input);
      return { success: true as const, category };
    } catch (err) {
      if (err instanceof CategoryServiceError) {
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

  return { updateCategory, isSubmitting, fieldErrors };
}

export function useDeleteCategory() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const deleteCategory = useCallback(async (id: string) => {
    setIsDeleting(true);
    setFieldErrors(undefined);
    try {
      await categoryService.deleteCategory(id);
      return { success: true as const };
    } catch (err) {
      if (err instanceof CategoryServiceError) {
        setFieldErrors(err.fieldErrors);
        return {
          success: false as const,
          message: err.message,
          fieldErrors: err.fieldErrors,
        };
      }
      return {
        success: false as const,
        message: 'Could not delete the category. Please try again.',
        fieldErrors: undefined,
      };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteCategory, isDeleting, fieldErrors };
}
