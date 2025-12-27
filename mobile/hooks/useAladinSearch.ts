import { useState, useCallback } from 'react';
import { BookWithReview } from './useBooks';
import { BASE_URL } from '../constants/Config';

// Use exact type from useBooks
type SearchResultBook = BookWithReview & {
  isInBookshelf: boolean;
};

export function useAladinSearch() {
  const [results, setResults] = useState<SearchResultBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBooks = useCallback(async (query: string) => {
    console.log('[Search] Starting search for:', query);
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      // Use the backend proxy instead of calling Aladin directly to avoid CORS
      const url = `${BASE_URL}/api/aladin-search?query=${encodeURIComponent(query)}`;
      console.log('[Search] Fetching from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();

      if (!data.item) {
        setResults([]);
        return;
      }

      // The backend now handles the merging of review data/bookshelf status
      setResults(data.item);

    } catch (err) {
      console.error("Search failed:", err);
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    searchBooks,
    setResults // Exposed for clearing
  };
}
