import React, { useState, useMemo, useRef, useEffect } from "react";
import { BookWithReview, ReadingStatus, UserBook } from "../types"; // UserBook 타입을 import 합니다.
import {
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  SearchIcon,
  XMarkIcon,
  SparklesIcon,
} from "./Icons";
import { useAppContext } from "../context/AppContext";
import ConfirmModal from "./ConfirmModal";

// memorable_quotes의 타입을 명시적으로 정의합니다.
// ReviewModal에서 사용한 타입과 동일하게 맞춰줍니다.
interface MemorableQuote {
  quote: string;
  page: string;
  thought: string;
}

interface BookshelfCardProps {
  book: BookWithReview;
  onSelect: (book: BookWithReview) => void;
  onDelete: (bookId: string, bookTitle: string) => void;
  showStatusBadge?: boolean;
}

export const BookshelfCard: React.FC<BookshelfCardProps> = React.memo(({
  book,
  onSelect,
  onDelete,
  showStatusBadge,
}) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(book.id, book.title);
  };

  const renderStatusInfo = () => {
    const { review } = book;

    if (review?.status === ReadingStatus.Reading && review.start_date) {
      const startDate = new Date(review.start_date);
      const today = new Date();
      // Set hours to 0 to compare dates only
      startDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      return (
        <div className="flex items-center justify-start mt-2 h-[28px]">
          <p className="text-sm font-bold text-primary">
            {diffDays}일째 읽는중
          </p>
        </div>
      );
    }

    if (review?.rating && review.rating > 0) {
      return (
        <div className="flex items-center justify-start mt-2 h-[28px]">
          <p className="font-bold text-text-heading dark:text-dark-text-heading mr-1">
            {review.rating.toFixed(1)}
          </p>
          <StarIcon className="w-5 h-5 text-yellow-400" />
        </div>
      );
    }

    return <div className="h-[28px] mt-2" />; // Placeholder for consistent height
  };

  return (
    <div
      onClick={() => onSelect(book)}
      className="cursor-pointer group flex flex-col h-full"
    >
      <div className="relative aspect-[2/3] w-full">
        {showStatusBadge && book.review?.status === ReadingStatus.Dropped && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              중단
            </div>
        )}
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-full h-full object-cover rounded-md border border-gray-200 dark:border-dark-border transition-transform group-hover:scale-105"
        />
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
          aria-label="책 삭제"
        >
          <TrashIcon className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="bg-white dark:bg-dark-card p-3 rounded-b-md flex-grow flex flex-col justify-between">
        <div>
          <h3 className="text-md font-bold text-text-heading dark:text-dark-text-heading line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm text-text-body dark:text-dark-text-body mt-1 line-clamp-2">
            {book.author.split("(지은이")[0].trim()}
          </p>
        </div>
        {renderStatusInfo()}
      </div>
    </div>
  );
});

type Note = {
  book: BookWithReview;
  note: { title: string; content: string };
};

interface RandomNoteModalProps {
  currentNote: Note;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectBook: (book: BookWithReview) => void;
}

const BookshelfView: React.FC = () => {
  const {
    books,
    handleOpenReview: onSelectBook,
    handleDeleteBook,
  } = useAppContext();
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "All">
    ("All"
  );
  const [finishedSubFilter, setFinishedSubFilter] = useState<"finished" | "dropped">("finished");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("created_at_desc");
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [isRandomNoteModalOpen, setRandomNoteModalOpen] = useState(false);
  const [shuffledNotes, setShuffledNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ 
    id: string;
    title: string;
  } | null>(null);

  const [isAdvancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [rereadFilter, setRereadFilter] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [visibleBooksCount, setVisibleBooksCount] = useState(20);

  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const statusCounts = useMemo(() => {
    if (!books) {
      return {
        All: 0,
        [ReadingStatus.Reading]: 0,
        [ReadingStatus.Finished]: 0,
        [ReadingStatus.Dropped]: 0,
        [ReadingStatus.WantToRead]: 0,
      };
    }
    const counts: { [key in ReadingStatus | "All"]: number } = {
      All: books.length,
      [ReadingStatus.Reading]: 0,
      [ReadingStatus.Finished]: 0,
      [ReadingStatus.Dropped]: 0,
      [ReadingStatus.WantToRead]: 0,
    };
    for (const book of books) {
      if (book.review?.status) {
        counts[book.review.status]++;
      }
    }
    const displayCounts = { ...counts };
    displayCounts[ReadingStatus.Finished] = (counts[ReadingStatus.Finished] || 0) + (counts[ReadingStatus.Dropped] || 0);
    return displayCounts;
  }, [books]);

  const handleRequestDelete = (bookId: string, bookTitle: string) => {
    setBookToDelete({ id: bookId, title: bookTitle });
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (bookToDelete) {
      await handleDeleteBook(bookToDelete.id);
      setConfirmModalOpen(false);
      setBookToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmModalOpen(false);
    setBookToDelete(null);
  };

  const RandomNoteModal: React.FC<RandomNoteModalProps> = ({ 
    currentNote,
    onClose,
    onNext,
    onPrev,
    onSelectBook,
  }) => {
    const { book, note } = currentNote;

    const handleViewDetails = () => {
      onClose();
      onSelectBook(book);
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-card-secondary dark:bg-dark-card p-6 rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-semibold uppercase text-text-body dark:text-dark-text-body tracking-wider">
            {note.title}
          </p>
          <p className="text-lg text-text-heading dark:text-dark-text-heading mt-4 whitespace-pre-wrap min-h-[100px] max-h-64 overflow-y-auto">
            {note.content}
          </p>
          <button
            onClick={handleViewDetails}
            className="border-t border-black/10 dark:border-white/10 mt-6 pt-4 w-full text-left p-2 -m-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <p className="font-bold text-text-heading dark:text-dark-text-heading">
              {book.title}
            </p>
            <p className="text-sm text-text-body dark:text-dark-text-body">
              저자: {book.author.split("(지은이")[0].trim()}
            </p>
            <p className="text-xs text-primary font-semibold mt-1">
              자세히 보기 →
            </p>
          </button>

          {/* Mobile navigation */}
          <div className="md:hidden flex justify-between items-center pt-4 mt-4 border-t border-black/10 dark:border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6 text-text-body dark:text-dark-text-body" />
            </button>
            <span className="text-sm font-semibold text-text-muted">
              {currentNoteIndex + 1} / {shuffledNotes.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6 text-text-body dark:text-dark-text-body" />
            </button>
          </div>

          {/* Desktop Navigation Buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="hidden md:block absolute left-[-60px] top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-2 hover:bg-white/40 transition-colors"
          >
            <ChevronLeftIcon className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="hidden md:block absolute right-[-60px] top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-2 hover:bg-white/40 transition-colors"
          >
            <ChevronRightIcon className="w-8 h-8 text-white" />
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setVisibleBooksCount(20);
  }, [statusFilter, searchQuery, sortOption, rereadFilter, monthFilter, genreFilter]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    const booksToFilter = statusFilter === 'All' 
        ? books 
        : books.filter(b => b.review?.status === statusFilter);

    const dateKey = statusFilter === ReadingStatus.Finished ? 'end_date' : 'created_at';

    booksToFilter.forEach(book => {
      const dateValue = book.review?.[dateKey as keyof UserBook];
      if (dateValue && typeof dateValue === 'string') {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            months.add(`${year}-${month}`);
          }
        } catch (e) {
          console.error("Invalid date format:", dateValue);
        }
      }
    });

    return Array.from(months).sort().reverse();
  }, [books, statusFilter]);

  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    books.forEach(book => {
      if (book.category) {
        genres.add(book.category);
      }
    });
    return Array.from(genres).sort();
  }, [books]);
  
  const handleStatusFilterChange = (status: ReadingStatus | "All") => {
    setStatusFilter(status);
    setFinishedSubFilter("finished");
    setMonthFilter('all'); // Reset month filter when status changes
    setGenreFilter('all'); // Reset genre filter when status changes
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setSortOption('created_at_desc');
    setRereadFilter(false);
    setMonthFilter('all');
    setGenreFilter('all');
    setAdvancedFilterOpen(false);
  };

  const sortedAndFilteredBooks = useMemo(() => {
    let filtered = (books || [])
      .filter((book) => {
        if (statusFilter === "All") return true;
        if (statusFilter === ReadingStatus.Finished) {
          const subStatus = finishedSubFilter === 'finished' ? ReadingStatus.Finished : ReadingStatus.Dropped;
          return book.review?.status === subStatus;
        }
        return book.review?.status === statusFilter;
      })
      .filter((book) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return book.searchable_content?.includes(query) ?? false;
      })
      .filter(book => {
        if (!rereadFilter) return true;
        return book.review?.reread_will === true;
      })
      .filter(book => {
        if (monthFilter === 'all') return true;
        const dateKey = statusFilter === ReadingStatus.Finished ? 'end_date' : 'created_at';
        const dateValue = book.review?.[dateKey as keyof UserBook];
        if (dateValue && typeof dateValue === 'string') {
          try {
            const date = new Date(dateValue);
             if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              return `${year}-${month}` === monthFilter;
            }
          } catch(e) {
            return false;
          }
        }
        return false;
      })
      .filter(book => {
        if (genreFilter === 'all') return true;
        return book.category === genreFilter;
      });

    // Sorting logic
    switch (sortOption) {
      case "created_at_desc":
        return [...filtered].sort((a, b) => {
          const dateA = a.review?.created_at
            ? new Date(a.review.created_at).getTime()
            : 0;
          const dateB = b.review?.created_at
            ? new Date(b.review.created_at).getTime()
            : 0;
          return dateB - dateA;
        });
      case "rating_desc":
        return [...filtered].sort(
          (a, b) => (b.review?.rating || 0) - (a.review?.rating || 0)
        );
      case "date_read_desc":
        return [...filtered].sort((a, b) => {
          const dateA = a.review?.end_date
            ? new Date(a.review.end_date).getTime()
            : 0;
          const dateB = b.review?.end_date
            ? new Date(b.review.end_date).getTime()
            : 0;
          if (dateB === 0 && dateA !== 0) return -1;
          if (dateA === 0 && dateB !== 0) return 1;
          return dateB - dateA;
        });
      case "title_asc":
        return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
      case "category_asc":
        return [...filtered].sort((a, b) =>
          (a.category || "").localeCompare(b.category || "")
        );
      default:
        return [...filtered].sort((a, b) => {
          const dateA = a.review?.created_at
            ? new Date(a.review.created_at).getTime()
            : 0;
          const dateB = b.review?.created_at
            ? new Date(b.review.created_at).getTime()
            : 0;
          return dateB - dateA;
        });
    }
  }, [books, statusFilter, finishedSubFilter, searchQuery, sortOption, rereadFilter, monthFilter, genreFilter]);

  const handleShowRandomNote = () => {
    const allNotes: Note[] = (books || []).flatMap((book) => {
      const review = book.review;
      if (!review) return [];

      const notes: { title: string; content: string }[] = [];

      if (review.one_line_review) {
        notes.push({ title: "한줄평", content: review.one_line_review });
      }
      if (review.memos && Array.isArray(review.memos)) {
        review.memos.forEach((memo, index) => {
          if (memo) notes.push({ title: `메모 #${index + 1}`, content: memo });
        });
      }
      if (review.overall_impression) {
        notes.push({ title: "총평", content: review.overall_impression });
      }
      if (review.connected_thoughts) {
        notes.push({
          title: "연결되는 생각",
          content: review.connected_thoughts,
        });
      }

      if (review.memorable_quotes && Array.isArray(review.memorable_quotes)) {
        (review.memorable_quotes as MemorableQuote[]).forEach((quoteObj) => {
          if (quoteObj && quoteObj.quote) {
            let content = `"${quoteObj.quote}"`;
            if (quoteObj.thought) {
              content += `\n\n- 나의 생각: ${quoteObj.thought}`;
            }
            notes.push({
              title: `인상 깊은 구절 (p.${quoteObj.page || "?"})`,
              content: content,
            });
          }
        });
      }

      if (
        review.questions_from_book &&
        Array.isArray(review.questions_from_book)
      ) {
        review.questions_from_book.forEach((question, index) => {
          if (question)
            notes.push({ title: `책의 질문 #${index + 1}`, content: question });
        });
      }

      return notes
        .filter((note) => note.content && note.content.trim() !== "")
        .map((note) => ({ book, note }));
    });

    if (allNotes.length === 0) {
      alert("아직 작성된 기록이 없습니다!");
      return;
    }

    // Fisher-Yates shuffle
    for (let i = allNotes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allNotes[i], allNotes[j]] = [allNotes[j], allNotes[i]];
    }

    setShuffledNotes(allNotes);
    setCurrentNoteIndex(0);
    setRandomNoteModalOpen(true);
  };

  const handleNextNote = () => {
    setCurrentNoteIndex((prev) => (prev + 1) % shuffledNotes.length);
  };

  const handlePrevNote = () => {
    setCurrentNoteIndex(
      (prev) => (prev - 1 + shuffledNotes.length) % shuffledNotes.length
    );
  };

  const filterOptions: (ReadingStatus | "All")[] = [
    "All",
    ReadingStatus.Reading,
    ReadingStatus.Finished,
    ReadingStatus.WantToRead,
  ];

  const readingStatusKorean = {
    All: "전체",
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
    [ReadingStatus.WantToRead]: "읽고 싶은",
  };

  const sortOptions: { [key: string]: string } = {
    created_at_desc: "최신 추가순",
    date_read_desc: "완독일 (최신순)",
    rating_desc: "별점 (높은순)",
    title_asc: "제목 (가나다순)",
    category_asc: "카테고리 (가나다순)",
  };

  const groupedBooks = useMemo(() => {
    if (statusFilter !== "All") {
      return null;
    }

    const groups: { [key in ReadingStatus]?: BookWithReview[] } = {};

    for (const book of sortedAndFilteredBooks) {
      const status = book.review?.status;
      if (status) {
        if (!groups[status]) {
          groups[status] = [];
        }
        groups[status].push(book);
      }
    }
    return groups;
  }, [sortedAndFilteredBooks, statusFilter]);

  if (!books || books.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-text-heading dark:text-dark-text-heading">
          책장이 비어있습니다
        </h2>
        <p className="text-text-body dark:text-dark-text-body mt-2">
          검색 탭을 이용해 첫 책을 추가해보세요!
        </p>
      </div>
    );
  }

  const renderBookSection = (
    title: string,
    booksToRender?: BookWithReview[],
    status?: ReadingStatus
  ) => {
    if (!booksToRender || booksToRender.length === 0) return null;

    const limitedBooks = booksToRender.slice(0, 10);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-heading dark:text-dark-text-heading">
            {title}{" "}
            <span className="text-lg text-text-body dark:text-dark-text-body font-medium">
              {booksToRender.length}
            </span>
          </h2>
          {status && booksToRender.length > 10 && (
            <button
              onClick={() => handleStatusFilterChange(status)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
            >
              전체보기
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto space-x-4 -m-2 p-2 no-scrollbar">
          {limitedBooks.map((book) => (
            <div key={book.id} className="w-40 flex-shrink-0">
              <BookshelfCard
                book={book}
                onSelect={onSelectBook}
                onDelete={handleRequestDelete}
                showStatusBadge={statusFilter === 'All'}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-grow">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 focus-within:border-gray-800 dark:focus-within:border-gray-200 transition-colors duration-200">
            <SearchIcon className="w-5 h-5 ml-2 text-text-muted flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="기록 검색..."
              className="w-full pl-3 pr-10 py-2 bg-transparent text-text-heading dark:text-dark-text-heading focus:outline-none"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-heading dark:hover:text-dark-text-heading"
              aria-label="검색어 지우기"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        <button
          onClick={handleShowRandomNote}
          className="p-2 rounded-full text-text-body dark:text-dark-text-body hover:bg-light-gray dark:hover:bg-dark-bg"
          aria-label="랜덤 기록 보기"
        >
          <SparklesIcon className="w-5 h-5 text-primary" />
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
              {filterOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusFilterChange(status)}
                  className={`flex-1 text-center px-2 py-3 text-sm whitespace-nowrap -mb-px ${
                    statusFilter === status
                      ? 'font-bold text-primary border-b-2 border-primary'
                      : 'text-text-body dark:text-dark-text-body'
                  }`}
                >
                  {readingStatusKorean[status as keyof typeof readingStatusKorean]} ({statusCounts[status as keyof typeof statusCounts]})
                </button>
              ))}
            </div>      
      {statusFilter === ReadingStatus.Finished && (
        <div className="flex items-center justify-center pt-4 w-full">
            <div className="inline-flex rounded-lg shadow-sm">
                <button
                    onClick={() => setFinishedSubFilter('finished')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${ 
                        finishedSubFilter === 'finished'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-dark-bg text-text-body dark:text-dark-text-body border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border'
                    } border`}
                >
                    완독 ({statusCounts[ReadingStatus.Finished] - statusCounts[ReadingStatus.Dropped]})
                </button>
                <button
                    onClick={() => setFinishedSubFilter('dropped')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${ 
                        finishedSubFilter === 'dropped'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-dark-bg text-text-body dark:text-dark-text-body border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border'
                    } border-t border-b border-r`}
                >
                    중단 ({statusCounts[ReadingStatus.Dropped]})
                </button>
            </div>
        </div>
      )}

      <div className="flex justify-end items-center gap-2 mb-4">
        <button
          onClick={handleResetFilters}
          className="bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text-body rounded-full px-4 py-2 text-sm font-medium"
        >
          초기화
        </button>
        <button 
          onClick={() => setAdvancedFilterOpen(prev => !prev)}
          className="flex items-center bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text-body rounded-full px-4 py-2 text-sm font-medium"
        >
          <span>상세 필터</span>
          <ChevronDownIcon
            className={`w-5 h-5 ml-1 transition-transform ${ 
              isAdvancedFilterOpen ? "rotate-180" : "" 
            }`}
          />
        </button>
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setSortDropdownOpen((prev) => !prev)}
            className="flex items-center bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-dark-text-body rounded-full px-4 py-2 text-sm font-medium"
          >
            <span>{sortOptions[sortOption]}</span>
            <ChevronDownIcon
              className={`w-5 h-5 ml-1 transition-transform ${ 
                isSortDropdownOpen ? "rotate-180" : "" 
              }`}
            />
          </button>
          {isSortDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-border dark:border-dark-border z-10 overflow-hidden">
              {Object.entries(sortOptions).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSortOption(key);
                    setSortDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-light-gray dark:hover:bg-dark-bg ${ 
                    sortOption === key
                      ? "font-bold text-text-heading dark:text-dark-text-heading bg-gray-100 dark:bg-dark-bg"
                      : "text-text-heading dark:text-dark-text-heading"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isAdvancedFilterOpen && (
        <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm border border-border dark:border-dark-border space-y-4 md:space-y-0 md:flex md:items-center md:gap-8 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reread-filter"
              checked={rereadFilter}
              onChange={(e) => setRereadFilter(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="reread-filter" className="text-sm font-medium text-text-heading dark:text-dark-text-heading">
              다시 읽고 싶은 책만
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="month-filter" className="text-sm font-medium text-text-heading dark:text-dark-text-heading">
              {statusFilter === ReadingStatus.Finished ? '완독한 달' : '추가한 달'}:
            </label>
            <select
              id="month-filter"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-light-gray dark:bg-dark-bg text-text-body dark:text-dark-text-body rounded-md border-border dark:border-dark-border py-1 px-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="all">모든 달</option>
              {monthOptions.map(month => (
                <option key={month} value={month}>
                  {month.replace('-', '년 ')}월
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="genre-filter" className="text-sm font-medium text-text-heading dark:text-dark-text-heading">
              장르:
            </label>
            <select
              id="genre-filter"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="bg-light-gray dark:bg-dark-bg text-text-body dark:text-dark-text-body rounded-md border-border dark:border-dark-border py-1 px-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            >
              <option value="all">모든 장르</option>
              {genreOptions.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}


      {sortedAndFilteredBooks.length > 0 ? (
        <div className="space-y-8">
          {statusFilter === "All" && groupedBooks ? (
            <>
              {renderBookSection(
                "읽는 중",
                groupedBooks[ReadingStatus.Reading],
                ReadingStatus.Reading
              )}
              {renderBookSection(
                "읽고 싶은",
                groupedBooks[ReadingStatus.WantToRead],
                ReadingStatus.WantToRead
              )}
              {renderBookSection(
                "완독",
                [...(groupedBooks[ReadingStatus.Finished] || []), ...(groupedBooks[ReadingStatus.Dropped] || [])],
                ReadingStatus.Finished
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
                {sortedAndFilteredBooks
                  .slice(0, visibleBooksCount)
                  .map((book) => (
                    <BookshelfCard
                      key={book.id}
                      book={book}
                      onSelect={onSelectBook}
                      onDelete={handleRequestDelete}
                      showStatusBadge={statusFilter === 'All'}
                    />
                  ))}
              </div>
              {visibleBooksCount < sortedAndFilteredBooks.length && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() =>
                      setVisibleBooksCount((prev) => prev + 20)
                    }
                    className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark transition-colors"
                  >
                    더보기
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-text-body dark:text-dark-text-body">
            조건에 맞는 책이 없습니다.
          </p>
        </div>
      )}

      {isRandomNoteModalOpen && shuffledNotes.length > 0 && (
        <RandomNoteModal
          currentNote={shuffledNotes[currentNoteIndex]}
          onClose={() => setRandomNoteModalOpen(false)}
          onNext={handleNextNote}
          onPrev={handlePrevNote}
          onSelectBook={onSelectBook}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="책 삭제"
      >
        <p>
          정말로 <span className="font-bold">{bookToDelete?.title}</span> 책을
          책장에서 삭제하시겠습니까?
        </p>
      </ConfirmModal>
    </div>
  );
};

export default BookshelfView;
