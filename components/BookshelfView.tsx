import React, { useState, useMemo, useRef, useEffect } from "react";
import { BookWithReview, ReadingStatus } from "../types";
import {
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
} from "./Icons";
import { useAppContext } from "../context/AppContext";
import ConfirmModal from "./ConfirmModal";

interface BookshelfCardProps {
  book: BookWithReview;
  onSelect: (book: BookWithReview) => void;
  onDelete: (bookId: string, bookTitle: string) => void;
}

export const BookshelfCard: React.FC<BookshelfCardProps> = ({
  book,
  onSelect,
  onDelete,
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
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-full h-full object-cover rounded-md shadow-lg transition-transform group-hover:scale-105"
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
};

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
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "All">(
    "All"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<string>("default");
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [isRandomNoteModalOpen, setRandomNoteModalOpen] = useState(false);
  const [shuffledNotes, setShuffledNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const sortDropdownRef = useRef<HTMLDivElement>(null);

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

  const sortedAndFilteredBooks = useMemo(() => {
    const filtered = (books || [])
      .filter(
        (book) => statusFilter === "All" || book.review?.status === statusFilter
      )
      .filter((book) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        const { title, author } = book;
        const {
          one_line_review,
          summary,
          memorable_quotes,
          questions_from_book,
          connected_thoughts,
          overall_impression,
          reread_reason,
          notes,
        } = book.review || {};
        const searchableContent = [
          title,
          author,
          one_line_review,
          summary,
          ...(memorable_quotes || []),
          ...(questions_from_book || []),
          connected_thoughts,
          overall_impression,
          reread_reason,
          notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchableContent.includes(query);
      });

    // Sorting logic
    switch (sortOption) {
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
          const dateA = a.review?.end_date
            ? new Date(a.review.end_date).getTime()
            : 0;
          const dateB = b.review?.end_date
            ? new Date(b.review.end_date).getTime()
            : 0;
          return dateB - dateA;
        });
    }
  }, [books, statusFilter, searchQuery, sortOption]);

  const handleShowRandomNote = () => {
    const allNotes: Note[] = (books || []).flatMap((book) => {
      const review = book.review;
      if (!review) return [];

      const notes: { title: string; content: string }[] = [];

      if (review.summary) {
        notes.push({ title: "요약", content: review.summary });
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
        review.memorable_quotes.forEach((quote, index) => {
          if (quote)
            notes.push({
              title: `인상 깊은 구절 #${index + 1}`,
              content: quote,
            });
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
    ...Object.values(ReadingStatus),
  ];

  const readingStatusKorean = {
    All: "전체",
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
    [ReadingStatus.WantToRead]: "읽고 싶은",
  };

  const sortOptions: { [key: string]: string } = {
    default: "정렬 기준",
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
          <h2 className="text-xl font-bold text-text-heading dark:text-dark-text-heading">
            {title}
          </h2>
          {status && booksToRender.length > 10 && (
            <button
              onClick={() => setStatusFilter(status)}
              className="text-sm font-semibold text-primary hover:underline"
            >
              전체보기
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto space-x-4 -m-2 p-2">
          {limitedBooks.map((book) => (
            <div key={book.id} className="w-40 flex-shrink-0">
              <BookshelfCard
                book={book}
                onSelect={onSelectBook}
                onDelete={handleRequestDelete}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm border border-border dark:border-dark-border space-y-4">
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="기록 검색..."
            className="w-full px-4 py-2 bg-light-gray dark:bg-dark-bg text-text-heading dark:text-dark-text-heading border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-y-2">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                  statusFilter === status
                    ? "bg-text-heading dark:bg-primary text-white dark:text-text-heading"
                    : "bg-light-gray dark:bg-dark-bg text-text-body dark:text-dark-text-body hover:bg-border dark:hover:bg-dark-border"
                }`}
              >
                {
                  readingStatusKorean[
                    status as keyof typeof readingStatusKorean
                  ]
                }
              </button>
            ))}
          </div>
          <button
            onClick={handleShowRandomNote}
            className="ml-auto px-3 py-1 text-sm font-semibold rounded-full bg-card-secondary dark:bg-dark-bg text-text-heading dark:text-dark-text-heading whitespace-nowrap hover:shadow-md transition-shadow"
          >
            랜덤 기록 보기 ✨
          </button>
        </div>
      </div>

      <div className="flex justify-end items-center mb-4">
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setSortDropdownOpen((prev) => !prev)}
            className="flex items-center text-sm font-semibold text-text-body dark:text-dark-text-body hover:text-text-heading dark:hover:text-dark-text-heading"
          >
            <span>{sortOptions[sortOption]}</span>
            <ChevronDownIcon
              className={`w-5 h-5 ml-1 text-text-body dark:text-dark-text-body transition-transform ${
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
                groupedBooks[ReadingStatus.Finished],
                ReadingStatus.Finished
              )}
              {renderBookSection(
                "중단",
                groupedBooks[ReadingStatus.Dropped],
                ReadingStatus.Dropped
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
              {sortedAndFilteredBooks.map((book) => (
                <BookshelfCard
                  key={book.id}
                  book={book}
                  onSelect={onSelectBook}
                  onDelete={handleRequestDelete}
                />
              ))}
            </div>
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
