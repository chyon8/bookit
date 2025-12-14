"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ReadingStatus } from '../types';

interface BookshelfState {
  statusFilter: ReadingStatus | "All";
  finishedSubFilter: "finished" | "dropped";
  searchQuery: string;
  sortOption: string;
  rereadFilter: boolean;
  monthFilter: string;
  genreFilter: string;
  isAdvancedFilterOpen: boolean;
  visibleBooksCount: number;
  scrollPosition: number;
}

interface SearchState {
  query: string;
  scrollPosition: number;
}

interface NavigationState {
  bookshelf: BookshelfState;
  search: SearchState;
}

interface NavigationStateContextType {
  state: NavigationState;
  updateBookshelfState: (updates: Partial<BookshelfState>) => void;
  updateSearchState: (updates: Partial<SearchState>) => void;
  saveScrollPosition: (view: 'bookshelf' | 'search', position: number) => void;
  getScrollPosition: (view: 'bookshelf' | 'search') => number;
  clearState: (view: 'bookshelf' | 'search') => void;
}

const defaultBookshelfState: BookshelfState = {
  statusFilter: "All",
  finishedSubFilter: "finished",
  searchQuery: "",
  sortOption: "created_at_desc",
  rereadFilter: false,
  monthFilter: 'all',
  genreFilter: 'all',
  isAdvancedFilterOpen: false,
  visibleBooksCount: 20,
  scrollPosition: 0,
};

const defaultSearchState: SearchState = {
  query: "",
  scrollPosition: 0,
};

const NavigationStateContext = createContext<NavigationStateContextType | undefined>(undefined);

export const NavigationStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<NavigationState>({
    bookshelf: defaultBookshelfState,
    search: defaultSearchState,
  });

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem('navigationState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(parsed);
      } catch (e) {
        console.error('Failed to parse saved navigation state:', e);
      }
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('navigationState', JSON.stringify(state));
  }, [state]);

  const updateBookshelfState = useCallback((updates: Partial<BookshelfState>) => {
    setState(prev => ({
      ...prev,
      bookshelf: { ...prev.bookshelf, ...updates },
    }));
  }, []);

  const updateSearchState = useCallback((updates: Partial<SearchState>) => {
    setState(prev => ({
      ...prev,
      search: { ...prev.search, ...updates },
    }));
  }, []);

  const saveScrollPosition = useCallback((view: 'bookshelf' | 'search', position: number) => {
    setState(prev => ({
      ...prev,
      [view]: { ...prev[view], scrollPosition: position },
    }));
  }, []);

  const getScrollPosition = useCallback((view: 'bookshelf' | 'search') => {
    return state[view].scrollPosition;
  }, [state]);

  const clearState = useCallback((view: 'bookshelf' | 'search') => {
    setState(prev => ({
      ...prev,
      [view]: view === 'bookshelf' ? defaultBookshelfState : defaultSearchState,
    }));
  }, []);

  return (
    <NavigationStateContext.Provider
      value={{
        state,
        updateBookshelfState,
        updateSearchState,
        saveScrollPosition,
        getScrollPosition,
        clearState,
      }}
    >
      {children}
    </NavigationStateContext.Provider>
  );
};

export const useNavigationState = () => {
  const context = useContext(NavigationStateContext);
  if (context === undefined) {
    throw new Error('useNavigationState must be used within a NavigationStateProvider');
  }
  return context;
};
