import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '../constants/Config';
import { BookWithReview } from './useBooks';
import { supabase } from '../lib/supabase';

export type CuratedBook = BookWithReview & {
  isInBookshelf: boolean;
  pubDate?: string;
  publisher?: string;
  bestRank?: number;
};


type CurationType = 'ItemNewSpecial' | 'ItemEditorChoice' | 'Bestseller' | 'ItemNewAll'; // Added ItemNewAll

async function fetchCurationList(type: CurationType, categoryId: number = 1): Promise<CuratedBook[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  const headers: HeadersInit = {};
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/aladin-list?queryType=${type}&categoryId=${categoryId}`, {
    headers
  });

  if (!response.ok) {
    throw new Error('Failed to fetch curation list');
  }

  const data = await response.json();
  return data.item || [];
}

export function useAladinCuration(categoryId: number = 1) {
  // EditorChoice only supports root categories (Domestic=1), so we force it to 1.
  // This ensures the Hero section always has content.
  const editorChoice = useQuery({
    queryKey: ['curation', 'ItemEditorChoice', 1],
    queryFn: () => fetchCurationList('ItemEditorChoice', 1),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // For specific categories, ItemNewSpecial might be empty. Use ItemNewAll for subcategories.
  const newQueryType = categoryId === 1 ? 'ItemNewSpecial' : 'ItemNewAll';
  
  const newSpecial = useQuery({
    queryKey: ['curation', newQueryType, categoryId],
    queryFn: () => fetchCurationList(newQueryType, categoryId),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const bestseller = useQuery({
    queryKey: ['curation', 'Bestseller', categoryId],
    queryFn: () => fetchCurationList('Bestseller', categoryId),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    editorChoice,
    newSpecial,
    bestseller
  };
}
