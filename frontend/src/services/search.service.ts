import { apiRequest } from './api';
import type { ApiResponse } from '../types';

export const searchService = {
  /** Semantic search of beats by artist lyrics. */
  byLyrics(lyrics: string): Promise<ApiResponse> {
    return apiRequest<ApiResponse>('/api/search/by-lyrics', {
      method: 'POST',
      body: JSON.stringify({ lyrics }),
    });
  },
};
