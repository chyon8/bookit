import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { BookWithReview } from './useBooks';

// Use exact type from useBooks
type SearchResultBook = BookWithReview & {
  isInBookshelf: boolean;
};

const ALADIN_API_KEY = process.env.NEXT_PUBLIC_ALADIN_API_KEY;

export function useAladinSearch() {
  const [results, setResults] = useState<SearchResultBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchBooks = useCallback(async (query: string) => {
    if (!query.trim()) return;
    if (!ALADIN_API_KEY) {
      setError("API Key not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch from Aladin
      const url = `http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${ALADIN_API_KEY}&Query=${encodeURIComponent(
        query
      )}&QueryType=Keyword&MaxResults=20&start=1&SearchTarget=Book&output=js&Version=20131101`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.item) {
        setResults([]);
        return;
      }

      // 2. Check Bookshelf Status (Supabase)
      const { data: { user } } = await supabase.auth.getUser();
      
      const isbnToReviewMap = new Map();
      const legacyToReviewMap = new Map();
      const cleanAuthor = (author: string) => author.replace(/\s*\(.*\)/g, "");

      if (user) {
        const { data: userBooks } = await supabase
          .from("user_books")
          .select("*, books(*)")
          .eq("user_id", user.id);

        if (userBooks) {
          userBooks.forEach((userBook: any) => {
            const { books, ...reviewData } = userBook;
            if (books && books.isbn13) {
              isbnToReviewMap.set(books.isbn13, reviewData);
            } else if (books) {
              legacyToReviewMap.set(
                `${books.title}|${cleanAuthor(books.author)}`,
                reviewData
              );
            }
          });
        }
      }

      // 3. Merge Data
      const searchResults = data.item.map((item: any) => {
        const authorName = cleanAuthor(item.author);
        const legacyKey = `${item.title}|${authorName}`;

        const review =
          isbnToReviewMap.get(item.isbn13) ||
          legacyToReviewMap.get(legacyKey) ||
          null;
        const isInBookshelf = !!review;

        return {
          id: item.isbn13 || item.itemId.toString(),
          isbn13: item.isbn13 || item.itemId.toString(),
          title: item.title,
          author: item.author,
          category: item.categoryName.split(">")[1] || item.categoryName,
          description: item.description,
          coverImageUrl: item.cover.replace("coversum", "cover200"),
          review: review,
          isInBookshelf,
        };
      });

      setResults(searchResults);

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
