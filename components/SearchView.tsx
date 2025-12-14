import React, { useState, useEffect, useRef } from "react";
import { Book, BookWithReview, ReadingStatus } from "../types";
import { SearchIcon, StarIcon, XMarkIcon } from "./Icons";
import { useAppContext } from "../context/AppContext";
import { useNavigationState } from "../context/NavigationStateContext";

const BookCard = ({ book, onSelect }) => {
  const handleSelect = () => {
    const bookToSelect = book.review ? book : { ...book, review: { status: ReadingStatus.WantToRead, rating: 0 } };
    onSelect(bookToSelect);
  };

  return (
    <div
      className="bg-card dark:bg-dark-card p-4 rounded-lg shadow-sm flex items-start space-x-4 cursor-pointer hover:shadow-md transition-shadow border border-border dark:border-dark-border"
      onClick={handleSelect}
      aria-label={`${book.title} 선택`}
    >
      <img
        src={book.coverImageUrl}
        alt={book.title}
        className="w-20 h-28 object-cover rounded-md flex-shrink-0 shadow-sm"
      />
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[12px] font-semibold uppercase text-text-muted tracking-wider">
              {book.category}
            </p>
            <h3 className="text-lg font-bold text-text-heading dark:text-dark-text-heading mt-1">
              {book.title}
            </h3>
            <p className="text-sm text-text-body dark:text-dark-text-body mt-1">
              저자: {book.author}
            </p>
          </div>
          {book.isInBookshelf && (
            <div className="flex-shrink-0 ml-4">
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">내 서재에 있음</span>
            </div>
          )}
        </div>

        {book.review?.rating > 0 && (
            <div className="flex items-center justify-start mt-2">
                <p className="font-bold text-text-heading dark:text-dark-text-heading mr-1">{book.review.rating.toFixed(1)}</p>
                <StarIcon className="w-5 h-5 text-yellow-400"/>
            </div>
        )}

        <p className="text-sm text-text-body dark:text-dark-text-body mt-2 line-clamp-2">
          {book.description}
        </p>
      </div>
    </div>
  );
};

const SearchView = ({ onSelectBook }) => {
  const { books } = useAppContext();
  const { state: navState, updateSearchState, saveScrollPosition } = useNavigationState();

  // Initialize from saved state
  const [query, setQuery] = useState(navState.search.query);
  const [results, setResults] = useState<BookWithReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(navState.search.query.trim().length > 0);
  const [visibleCount, setVisibleCount] = useState(navState.search.visibleCount);
  const scrollRestoredRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore scroll position on mount
  useEffect(() => {
    if (!scrollRestoredRef.current && navState.search.scrollPosition > 0) {
      setTimeout(() => {
        window.scrollTo(0, navState.search.scrollPosition);
        scrollRestoredRef.current = true;
      }, 100);
    }
  }, [navState.search.scrollPosition]);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      saveScrollPosition('search', window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      saveScrollPosition('search', window.scrollY);
    };
  }, [saveScrollPosition]);

  // Save query and visibleCount to navigation state
  useEffect(() => {
    updateSearchState({ query, visibleCount });
  }, [query, visibleCount, updateSearchState]);

  // Perform search if there's a saved query on mount
  useEffect(() => {
    if (navState.search.query.trim() && results.length === 0 && !loading) {
      performSearch(navState.search.query);
    }
  }, []); // Run only once on mount

  // Note: Query change handling is now done imperatively via handleQueryChange
  // This prevents false resets when restoring state from Context on back navigation

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setSearchPerformed(true);
    setResults([]);
    setVisibleCount(20); // Reset pagination on new search

    try {
      const response = await fetch(
        `/api/aladin-search?query=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "알라딘 도서 검색에 실패했습니다.");
      }
      const data = await response.json();

      if (data.item) {
        setResults(data.item);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Aladin search failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "온라인 검색 중 오류가 발생했습니다. 다시 시도해주세요."
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounced search
    debounceTimerRef.current = setTimeout(() => {
      if (newQuery.trim()) {
        performSearch(newQuery);
      } else {
        setResults([]);
        setLoading(false);
        setSearchPerformed(false);
        setVisibleCount(20);
      }
    }, 500);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => e.preventDefault()} className="relative">
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 focus-within:border-gray-800 dark:focus-within:border-gray-200 transition-colors duration-200">
          <SearchIcon className="w-5 h-5 ml-2 text-text-muted flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="책 제목이나 저자로 검색..."
            className="w-full pl-3 pr-10 py-2 bg-transparent text-text-heading dark:text-dark-text-heading focus:outline-none"
            autoFocus
          />
        </div>
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading dark:hover:text-dark-text-heading"
            aria-label="검색어 지우기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-text-body dark:text-dark-text-body py-10">
            <p>"{query}"(으)로 검색 중입니다...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            {results.slice(0, visibleCount).map((book) => (
              <BookCard key={book.id} book={book} onSelect={onSelectBook} />
            ))}
            {visibleCount < results.length && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setVisibleCount(prev => prev + 20)}
                  className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
                >
                  더보기 ({visibleCount} / {results.length})
                </button>
              </div>
            )}
          </>
        ) : (
          searchPerformed && (
            <p className="text-center text-text-body dark:text-dark-text-body py-10">
              검색 결과가 없습니다.
            </p>
          )
        )}
      </div>
    </div>
  );
};

export default SearchView;