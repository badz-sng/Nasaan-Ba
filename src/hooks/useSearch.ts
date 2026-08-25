import { useCallback, useState } from 'react';
import { searchService, SearchServiceError } from '@/features/search/search.service';
import type { SearchResult } from '@/features/search/search.repository';

interface UseSearchResult {
  results: SearchResult[];
  isSearching: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  const search = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      clear();
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const data = await searchService.search(query);
      setResults(data);
    } catch (err) {
      setResults([]);
      setError(err instanceof SearchServiceError ? err.message : 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [clear]);

  return { results, isSearching, error, search, clear };
}
