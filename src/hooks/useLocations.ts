import { useCallback, useEffect, useState } from 'react';
import {
  locationService,
  LocationServiceError,
} from '@/features/locations/location.service';
import type { Location, LocationTreeNode } from '@/features/locations/location.types';
import { useFocusEffect } from 'expo-router';

interface UseLocationTreeResult {
  tree: LocationTreeNode[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLocationTree(): UseLocationTreeResult {
  const [tree, setTree] = useState<LocationTreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await locationService.getLocationTree();
      setTree(result);
    } catch (err) {
      setError(
        err instanceof LocationServiceError
          ? err.message
          : 'Could not load locations. Please try again.'
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
  return { tree, isLoading, error, refresh };
}

interface UseAllLocationsResult {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAllLocations(): UseAllLocationsResult {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await locationService.getAllLocations();
      setLocations(result);
    } catch (err) {
      setError(
        err instanceof LocationServiceError
          ? err.message
          : 'Could not load locations. Please try again.'
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

  return { locations, isLoading, error, refresh };
}

export function useCreateLocation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const createLocation = useCallback(async (input: unknown) => {
    setIsSubmitting(true);
    setFieldErrors(undefined);
    try {
      const location = await locationService.createLocation(input);
      return { success: true as const, location };
    } catch (err) {
      if (err instanceof LocationServiceError) {
        setFieldErrors(err.fieldErrors);
        return { success: false as const, message: err.message };
      }
      return { success: false as const, message: 'An unexpected error occurred. Please try again.' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { createLocation, isSubmitting, fieldErrors };
}

export function useDeleteLocation() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | undefined>();

  const deleteLocation = useCallback(async (id: string) => {
    setIsDeleting(true);
    setFieldErrors(undefined);
    try {
      await locationService.deleteLocation(id);
      return { success: true as const };
    } catch (err) {
      if (err instanceof LocationServiceError) {
        setFieldErrors(err.fieldErrors);
        return {
          success: false as const,
          message: err.message,
          fieldErrors: err.fieldErrors,
        };
      }
      return {
        success: false as const,
        message: 'Could not delete the location. Please try again.',
        fieldErrors: undefined,
      };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const deleteLocationWithSubtree = useCallback(async (id: string) => {
    setIsDeleting(true);
    setFieldErrors(undefined);
    try {
      await locationService.deleteLocationWithSubtree(id);
      return { success: true as const };
    } catch (err) {
      if (err instanceof LocationServiceError) {
        setFieldErrors(err.fieldErrors);
        return {
          success: false as const,
          message: err.message,
          fieldErrors: err.fieldErrors,
        };
      }
      return {
        success: false as const,
        message: 'Could not delete the location. Please try again.',
        fieldErrors: undefined,
      };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteLocation, deleteLocationWithSubtree, isDeleting, fieldErrors };
}

export function useUpdateLocation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateLocation = useCallback(async (id: string, input: unknown) => {
    setIsSubmitting(true);
    try {
      const location = await locationService.updateLocation(id, input);
      return { success: true as const, location };
    } catch (err) {
      return { success: false as const, message: err instanceof LocationServiceError ? err.message : 'Could not update the location.' };
    } finally {
      setIsSubmitting(false);
    }
  }, []);
  return { updateLocation, isSubmitting };
}
