import { searchRepository } from './search.repository';
import type { SearchResult } from './search.repository';

export class SearchServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchServiceError';
  }
}

class SearchService {
  async search(query: string, limit?: number): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      throw new SearchServiceError('Enter at least 2 characters to search.');
    }

    try {
      return await searchRepository.search(trimmed, limit);
    } catch {
      throw new SearchServiceError('Could not search items. Please try again.');
    }
  }
}

export const searchService = new SearchService();
