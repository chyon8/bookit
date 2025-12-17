"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  BookWithReview,
  ReadingStatus,
  UserBook,
  MemorableQuote,
  Memo,
} from "../../../types";
import { createClient } from "../../../utils/supabase/client";
import {
  StarIcon as StarSolid,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  ChevronDownIcon,
} from "../../../components/Icons";
import RecordHeader from "../../../components/RecordHeader";
import { useAppContext } from "../../../context/AppContext";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";

// --- Reusable Form Components with new styles ---

const StarRating: React.FC<{
  rating: number;
  setRating: (rating: number) => void;
  size?: "sm" | "lg";
}> = ({ rating, setRating, size = "lg" }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const starSize = size === "lg" ? "w-10 h-10" : "w-5 h-5";

  return (
    <div className="flex space-x-1" onMouseLeave={() => setHoverRating(null)}>
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        const displayRating = hoverRating !== null ? hoverRating : rating;
        return (
          <div
            key={index}
            className="relative cursor-pointer"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalf = e.clientX - rect.left < rect.width / 2;
              setHoverRating(starValue - (isHalf ? 0.5 : 0));
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isHalf = e.clientX - rect.left < rect.width / 2;
              const newRating = starValue - (isHalf ? 0.5 : 0);
              setRating(rating === newRating ? 0 : newRating);
            }}
          >
            <StarSolid
              className={`${starSize} text-gray-300 dark:text-dark-border`}
            />
            <div
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{
                width:
                  displayRating >= starValue
                    ? "100%"
                    : displayRating >= starValue - 0.5
                    ? "50%"
                    : "0%",
              }}
            >
              <StarSolid className={`${starSize} text-yellow-400`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>((props, ref) => (
  <input
    ref={ref}
    {...props}
    className={`w-full min-h-[48px] px-4 rounded-xl bg-[#F7F8FA] dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow ${
      props.type === "date" ? "dark:[color-scheme:dark]" : ""
    } ${props.className}`}
  />
));
FormInput.displayName = "FormInput";

const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => (
  <textarea
    ref={ref}
    {...props}
    className={`w-full min-h-[48px] p-4 rounded-xl bg-[#F7F8FA] dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow ${props.className}`}
  />
));
FormTextarea.displayName = "FormTextarea";

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (
  props
) => (
  <div className="relative">
    <select
      {...props}
      className={`w-full min-h-[48px] px-4 pr-10 rounded-xl bg-[#F7F8FA] dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow appearance-none ${props.className}`}
    >
      {props.children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-body dark:text-dark-text-body">
      <ChevronDownIcon className="w-5 h-5" />
    </div>
  </div>
);

const FormRow: React.FC<{
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
}> = ({ label, children, htmlFor }) => (
  <div>
    <label
      htmlFor={htmlFor}
      className="block text-base font-bold text-text-heading dark:text-dark-text-heading mb-2"
    >
      {label}
    </label>
    {children}
  </div>
);

// --- Page Specific Components ---

const QuoteCard: React.FC<{
  quote: MemorableQuote;
  onDelete: () => void;
  onChange: (field: keyof MemorableQuote, value: string) => void;
}> = ({ quote, onDelete, onChange }) => {
  const [isEditing, setIsEditing] = useState(!quote.quote);

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm space-y-3 border border-primary/50">
        <div className="flex justify-between items-start">
          <FormTextarea
            name="quote"
            value={quote.quote}
            onChange={(e) => onChange("quote", e.target.value)}
            placeholder="인상 깊었던 문장"
            rows={3}
            className="flex-grow !bg-transparent !p-0 focus:!ring-0"
          />
          <button
            onClick={onDelete}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-red-500 dark:hover:text-red-500 ml-2"
            aria-label="인용구 삭제"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <FormInput
            type="text"
            name="page"
            value={quote.page}
            onChange={(e) => onChange("page", e.target.value)}
            placeholder="페이지"
            className="w-24"
          />
          <FormInput
            type="text"
            name="thought"
            value={quote.thought}
            onChange={(e) => onChange("thought", e.target.value)}
            placeholder="나의 생각"
            className="flex-grow"
          />
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsEditing(false)}
            className="text-sm font-bold text-primary hover:opacity-80"
          >
            완료
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap flex-1 pr-4">
          "{quote.quote}"
        </p>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-primary dark:hover:text-primary"
            aria-label="인용구 수정"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-red-500 dark:hover:text-red-500"
            aria-label="인용구 삭제"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      {(quote.page || quote.thought) && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border/50">
          {quote.page && (
            <p className="text-sm text-text-body/70 dark:text-dark-text-body/70">
              p. {quote.page}
            </p>
          )}
          {quote.thought && (
            <p className="text-text-body dark:text-dark-text-body mt-1">
              💭 {quote.thought}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const MemoCard: React.FC<{
  memo: Memo;
  onDelete: () => void;
  onChange: (value: string) => void;
}> = ({ memo, onDelete, onChange }) => {
  const [isEditing, setIsEditing] = useState(memo.text === "");

  // Helper to format date
  const formattedDate = useMemo(() => {
    if (!memo.createdAt) return null;
    try {
      return new Date(memo.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "날짜 오류";
    }
  }, [memo.createdAt]);

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm space-y-3 border border-primary/50">
        <FormTextarea
          value={memo.text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="메모 내용"
          rows={3}
          className="flex-grow !bg-transparent !p-0 focus:!ring-0"
        />
        <div className="flex justify-between items-center pt-2">
           <span className="text-xs text-text-muted dark:text-dark-text-body/50">
            {formattedDate || "지금 작성 중"}
          </span>
          <div className="flex items-center space-x-4">
            <button
              onClick={onDelete}
              className="text-sm font-semibold text-red-500 hover:opacity-80"
            >
              삭제
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="text-sm font-bold text-primary hover:opacity-80"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap flex-1 pr-4">
          {memo.text}
        </p>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-primary dark:hover:text-primary"
            aria-label="메모 수정"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-red-500 dark:hover:text-red-500"
            aria-label="메모 삭제"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      {formattedDate && (
        <p className="mt-2 pt-2 border-t border-gray-100 dark:border-dark-border/50 text-xs text-right text-text-muted dark:text-dark-text-body/50">
          {formattedDate}
        </p>
      )}
    </div>
  );
};

const BookRecordPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const supabase = createClient();
  const { user, books, setBooks } = useAppContext();

  const [book, setBook] = useState<BookWithReview | null>(null);
  const [review, setReview] = useState<Partial<UserBook>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", children: null, onConfirm: () => {} });

      const DRAFT_KEY = `book-record-draft-${id}`;
  
    const processMemos = useCallback((memosArray: any[] | undefined): Memo[] => {
      if (!memosArray) return [];
      return memosArray
        .map(m => {
          if (typeof m === 'string') {
            return { text: m, createdAt: new Date().toISOString() };
          }
          if (typeof m === 'object' && m !== null) {
            if ('text' in m && typeof (m as any).text === 'string' &&
                'createdAt' in m && typeof (m as any).createdAt === 'string') {
              return m as Memo;
            }
            if ('text' in m && typeof (m as any).text === 'string') {
              console.warn("Malformed memo object found (missing createdAt), providing default:", m);
              return { text: (m as any).text, createdAt: new Date().toISOString() };
            }
          }
          console.warn("Unexpected memo format, returning empty memo:", m);
          return null;
        })
        .filter((m): m is Memo => m !== null);
    }, []); // No dependencies for processMemos
  
    // This ref stores the "clean" state of the review, as a string.
    const initialReviewState = useRef<string>("");

    // This is the main data-loading and state-syncing effect.
    // It runs on initial load and after a save (because `books` changes).
    useEffect(() => {
      const fetchBook = async () => {
        if (!user || !id) return;

        let bookData: BookWithReview | null = books.find((b) => b.id === id) || null;

        if (!bookData) {
          // Fetch from DB if not in context
          const { data, error } = await supabase
            .from("user_books")
            .select(`*, books(*)`)
            .eq("book_id", id)
            .eq("user_id", user?.id)
            .single();

          if (error || !data) {
            toast.error("책 정보를 불러오는데 실패했습니다.");
            console.error("Error fetching book:", error);
            router.push("/bookshelf/All");
            return;
          }

          const { books: dbBookData, ...reviewData } = data;
          const formattedBook: BookWithReview = {
            id: dbBookData.id,
            isbn13: dbBookData.isbn13,
            title: dbBookData.title,
            author: dbBookData.author,
            category: dbBookData.category,
            description: dbBookData.description,
            coverImageUrl: dbBookData.cover_image_url,
            review: reviewData,
          };
          bookData = formattedBook;
        }
        
        if (!bookData) return;

        setBook(bookData);

        // Draft logic takes precedence on first load
        const savedDraft = sessionStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          try {
            const draftReview = JSON.parse(savedDraft);
            const normalizedDraft = {
              ...draftReview,
              memos: processMemos(draftReview.memos),
            };
            // Set both the live and initial state from the draft
            setReview(normalizedDraft);
            initialReviewState.current = JSON.stringify(normalizedDraft);
            return; // Exit after loading draft
          } catch (e) {
            console.error("Failed to parse draft:", e);
            sessionStorage.removeItem(DRAFT_KEY);
          }
        }

        // If no draft, or after a save, reset state from book data
        const reviewFromBook = bookData.review || {};
        const formatDate = (date: string | undefined) =>
          date ? new Date(date).toISOString().split("T")[0] : undefined;
        
        const normalizedReview = {
          ...reviewFromBook,
          start_date: formatDate(reviewFromBook.start_date),
          end_date: formatDate(reviewFromBook.end_date),
          memorable_quotes: (reviewFromBook.memorable_quotes || []).map((q) =>
            typeof q === "string" ? { quote: q, page: "", thought: "" } : q
          ),
          memos: processMemos(reviewFromBook.memos),
        };

        // Set both the live state and the initial state to the same normalized value
        setReview(normalizedReview);
        initialReviewState.current = JSON.stringify(normalizedReview);
      };

      fetchBook();
    }, [id, user, books]); // Effect depends on the global books context

    // This effect handles dirty checking and saving drafts
    useEffect(() => {
      // Don't run if initial state isn't set yet, or if review state isn't populated
      if (!initialReviewState.current || !review || Object.keys(review).length === 0) return;
  
      const currentState = JSON.stringify(review);
      const isActuallyDirty = initialReviewState.current !== currentState;

      setIsDirty(isActuallyDirty);

      if (isActuallyDirty) {
        sessionStorage.setItem(DRAFT_KEY, currentState);
      } else {
        // If state is no longer dirty (e.g. after a save), remove the draft
        sessionStorage.removeItem(DRAFT_KEY);
      }
    }, [review, DRAFT_KEY]);
  
    const handleBackNavigation = useCallback(() => {
      if (isDirty) {
        if (
          window.confirm(
            "변경사항이 저장되지 않았습니다. 정말로 페이지를 떠나시겠습니까?"
          )
        ) {
          router.back();
        }
      } else {
        router.back();
      }
    }, [isDirty, router]);
  const readingStatusKorean = {
    [ReadingStatus.WantToRead]: "읽고 싶은",
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "status") {
      handleStatusChange(value as ReadingStatus);
    } else {
      setReview((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = (newStatus: ReadingStatus) => {
    const today = new Date().toISOString().split("T")[0];
    const oldStatus = review.status;

    const performStatusUpdate = (
      updates: Partial<UserBook>,
      newStatusToSet: ReadingStatus
    ) => {
      setReview((prev) => ({
        ...prev,
        ...updates,
        status: newStatusToSet,
      }));
    };

    if (
      newStatus === ReadingStatus.Reading &&
      oldStatus === ReadingStatus.WantToRead
    ) {
      performStatusUpdate(
        { start_date: today, end_date: undefined },
        newStatus
      );
      return;
    }

    if (newStatus === ReadingStatus.Finished) {
      const updates: Partial<UserBook> = { end_date: today };
      if (!review.start_date) {
        updates.start_date = today;
      }
      performStatusUpdate(updates, newStatus);
      return;
    }

    if (
      newStatus === ReadingStatus.Reading &&
      oldStatus === ReadingStatus.Finished
    ) {
      setConfirmation({
        isOpen: true,
        title: "상태 변경 확인",
        children: "책을 다시 읽으시겠어요? 기존의 완독일 기록이 삭제됩니다.",
        onConfirm: () => {
          performStatusUpdate({ end_date: undefined }, newStatus);
          setConfirmation({ ...confirmation, isOpen: false });
        },
      });
      return;
    }

    if (newStatus === ReadingStatus.WantToRead && oldStatus !== newStatus) {
      setConfirmation({
        isOpen: true,
        title: "상태 변경 확인",
        children:
          "'읽고싶은' 상태로 변경하면 모든 독서 기록(시작일, 완독일)이 삭제됩니다. 계속하시겠어요?",
        onConfirm: () => {
          performStatusUpdate(
            { start_date: undefined, end_date: undefined },
            newStatus
          );
          setConfirmation({ ...confirmation, isOpen: false });
        },
      });
      return;
    }

    setReview((prev) => ({ ...prev, status: newStatus }));
  };

  const handleRatingChange = (newRating: number) => {
    setReview((prev) => ({ ...prev, rating: newRating }));
  };

  const handleQuoteChange = (
    index: number,
    field: keyof MemorableQuote,
    value: string
  ) => {
    setReview((prev) => {
      const newQuotes = [...(prev.memorable_quotes || [])];
      newQuotes[index] = { ...newQuotes[index], [field]: value };
      return { ...prev, memorable_quotes: newQuotes };
    });
  };

  const addMemorableQuote = () => {
    const newQuote: MemorableQuote = { quote: "", page: "", thought: "" };
    setReview((prev) => ({
      ...prev,
      memorable_quotes: [...(prev.memorable_quotes || []), newQuote],
    }));
  };

  const removeMemorableQuote = (index: number) => {
    setConfirmation({
      isOpen: true,
      title: "인용구 삭제",
      children: "정말로 이 인용구를 삭제하시겠습니까?",
      onConfirm: () => {
        setReview((prev) => ({
          ...prev,
          memorable_quotes: (prev.memorable_quotes || []).filter(
            (_, i) => i !== index
          ),
        }));
        setConfirmation({ ...confirmation, isOpen: false });
      },
    });
  };

  const handleMemoChange = (index: number, newText: string) => {
    setReview((prev) => {
      const newMemos = [...(prev.memos || [])];
      if (newMemos[index]) {
        newMemos[index] = { ...newMemos[index], text: newText };
      }
      return { ...prev, memos: newMemos };
    });
  };

  const addMemo = () => {
    const newMemo: Memo = {
      text: "",
      createdAt: new Date().toISOString(),
    };
    setReview((prev) => ({
      ...prev,
      memos: [...(prev.memos || []), newMemo],
    }));
  };

  const removeMemo = (index: number) => {
    setConfirmation({
      isOpen: true,
      title: "메모 삭제",
      children: "정말로 이 메모를 삭제하시겠습니까?",
      onConfirm: () => {
        setReview((prev) => ({
          ...prev,
          memos: (prev.memos || []).filter((_, i) => i !== index),
        }));
        setConfirmation({ ...confirmation, isOpen: false });
      },
    });
  };

  const handleSave = async () => {
    if (!book || !user) return;
    setIsSaving(true);

    const finalReview = { ...review };
    const finalBook = { ...book, review: finalReview as UserBook };

    const savePromise = async () => {
      const { error: reviewError } = await supabase
        .from("user_books")
        .update(finalReview)
        .eq("id", finalBook.review?.id);

      if (reviewError) throw reviewError;

      // ONLY update the context. This will trigger the main state-sync useEffect.
      setBooks((currentBooks) => {
        const existingIndex = currentBooks.findIndex(
          (b) => b.id === finalBook.id
        );
        if (existingIndex > -1) {
          const newBooks = [...currentBooks];
          newBooks[existingIndex] = finalBook;
          return newBooks;
        }
        return [...currentBooks, finalBook];
      });

      // Clear draft after successful save
      sessionStorage.removeItem(DRAFT_KEY);
    };

    try {
      await toast.promise(savePromise(), {
        loading: "기록 저장 중...",
        success: "성공적으로 저장되었어요!",
        error: "저장에 실패했습니다.",
      });
    } catch (e) {
      // react-hot-toast's promise handler will catch and display the error.
    } finally {
      setIsSaving(false);
    }
  };

  if (!book) {
    return null; // Or handle as an error, but with loading.tsx, this state should ideally not be reached if ID is valid
  }

  const showStartDate =
    review.status === ReadingStatus.Reading ||
    review.status === ReadingStatus.Finished ||
    review.status === ReadingStatus.Dropped;
  const showFinishDate = review.status === ReadingStatus.Finished;

  return (
    <div className="bg-light-gray dark:bg-dark-bg min-h-screen animate-slideIn">
      <RecordHeader
        onSave={handleSave}
        isSaving={isSaving}
        onBack={handleBackNavigation}
      />

      {/* Main content with top padding for header and bottom for keyboard */}
      <main className="pt-14 pb-24">
        {/* Hero Section */}
        <div className="relative h-64 overflow-hidden p-4">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${book.coverImageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-lg"></div>
          </div>
          <div className="relative z-[1] flex h-full flex-col items-center justify-center text-white">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="h-36 w-auto rounded-md object-cover"
              style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.25)" }}
            />
            <h2 className="mt-3 text-center text-xl font-bold">{book.title}</h2>
            <p className="text-sm opacity-80">
              {book.author.split("(지은이")[0].trim()}
            </p>
          </div>
        </div>

        {/* Description Section */}
        {book.description && (
          <div className="p-4 -mt-6 relative z-[2]">
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-text-heading dark:text-dark-text-heading mb-2">
                책 소개
              </h3>
              <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap">
                {book.description}
              </p>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className="p-4 space-y-8 -mt-10 relative z-[2]">
          {book.description && <div />}
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg">
            <StarRating
              rating={review.rating || 0}
              setRating={handleRatingChange}
            />
          </div>

          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-6">
            <FormRow label="독서 상태" htmlFor="status-select">
              <FormSelect
                id="status-select"
                name="status"
                value={review.status || ReadingStatus.WantToRead}
                onChange={handleInputChange}
              >
                {Object.entries(readingStatusKorean).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FormSelect>
            </FormRow>

            <div className="grid grid-cols-2 gap-4">
              {showStartDate && (
                <FormRow label="독서 시작일">
                  <FormInput
                    type="date"
                    name="start_date"
                    value={review.start_date || ""}
                    onChange={handleInputChange}
                  />
                </FormRow>
              )}
              {showFinishDate && (
                <FormRow label="완독일">
                  <FormInput
                    type="date"
                    name="end_date"
                    value={review.end_date || ""}
                    onChange={handleInputChange}
                  />
                </FormRow>
              )}
            </div>

            <FormRow label="한 줄 평">
              <FormInput
                type="text"
                name="one_line_review"
                value={review.one_line_review || ""}
                onChange={handleInputChange}
              />
            </FormRow>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="reread_will"
                name="reread_will"
                checked={review.reread_will || false}
                onChange={(e) =>
                  setReview((prev) => ({
                    ...prev,
                    reread_will: e.target.checked,
                  }))
                }
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded dark:bg-dark-bg dark:border-dark-border"
              />
              <label
                htmlFor="reread_will"
                className="ml-2 block text-base text-text-heading dark:text-dark-text-heading"
              >
                다시 읽고 싶은 책으로 표시
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-4">
            <FormRow label="인상 깊은 구절">
              <div className="space-y-4">
                {(review.memorable_quotes || []).map((q, index) => (
                  <QuoteCard
                    key={index}
                    quote={q}
                    onDelete={() => removeMemorableQuote(index)}
                    onChange={(field, value) =>
                      handleQuoteChange(index, field, value)
                    }
                  />
                ))}
                <button
                  onClick={addMemorableQuote}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/20"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>인용구 추가</span>
                </button>
              </div>
            </FormRow>
          </div>

          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-4">
            <FormRow label="메모">
              <div className="space-y-4">
                {(review.memos || []).map((memo, index) => (
                  <MemoCard
                    key={index}
                    memo={memo}
                    onDelete={() => removeMemo(index)}
                    onChange={(value) => handleMemoChange(index, value)}
                  />
                ))}
                <button
                  onClick={addMemo}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/20"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>메모 추가</span>
                </button>
              </div>
            </FormRow>
          </div>
        </div>
      </main>
      <ConfirmModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
      >
        {confirmation.children}
      </ConfirmModal>
    </div>
  );
};

export default BookRecordPage;
