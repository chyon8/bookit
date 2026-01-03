import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_HISTORY = 10;
const STORAGE_KEY = '@search_history';

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load history from storage
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load search history', e);
    } finally {
      setLoading(false);
    }
  };

  const addHistory = useCallback(async (query: string) => {
    if (!query.trim()) return;
    const trimmed = query.trim();

    try {
      setHistory(prev => {
        // Remove if exists, then add to top
        const filtered = prev.filter(item => item !== trimmed);
        const newHistory = [trimmed, ...filtered].slice(0, MAX_HISTORY);
        
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (e) {
      console.error('Failed to save search history', e);
    }
  }, []);

  const removeHistory = useCallback(async (query: string) => {
    try {
      setHistory(prev => {
        const newHistory = prev.filter(item => item !== query);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        return newHistory;
      });
    } catch (e) {
      console.error('Failed to remove search history', e);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setHistory([]);
    } catch (e) {
      console.error('Failed to clear search history', e);
    }
  }, []);

  return {
    history,
    loading,
    addHistory,
    removeHistory,
    clearHistory
  };
}
