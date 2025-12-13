"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { BookWithReview, ReadingStatus, UserBook, MemorableQuote } from "../../../types";
import { createClient } from "../../../utils/supabase/client";
import { StarIcon as StarSolid, PlusIcon, XMarkIcon, PencilIcon, ChevronDownIcon } from "../../../components/Icons";
import RecordHeader from "../../../components/RecordHeader";
import { useAppContext } from "../../../context/AppContext";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/ConfirmModal";


// --- Reusable Form Components with new styles ---

const StarRating: React.FC<{
  rating: number;
  setRating: (rating: number) => void;
  size?: 'sm' | 'lg';
}> = ({ rating, setRating, size = 'lg' }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const starSize = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';

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
            <StarSolid className={`${starSize} text-gray-300 dark:text-dark-border`} />
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

const FormInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input
    ref={ref}
    {...props}
    className={`w-full min-h-[48px] px-4 rounded-xl bg-[#F7F8FA] dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow ${
      props.type === "date" ? "dark:[color-scheme:dark]" : ""
    } ${props.className}`}
  />
));
FormInput.displayName = "FormInput";

const FormTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => (
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
              onChange={(e) => onChange('quote', e.target.value)}
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
            onChange={(e) => onChange('page', e.target.value)}
            placeholder="페이지"
            className="w-24"
          />
          <FormInput
            type="text"
            name="thought"
            value={quote.thought}
            onChange={(e) => onChange('thought', e.target.value)}
            placeholder="나의 생각"
            className="flex-grow"
          />
        </div>
        <div className="flex justify-end pt-2">
            <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-primary hover:opacity-80">
                완료
            </button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap flex-1 pr-4">
          "{quote.quote}"
        </p>
        <div className="flex space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-primary dark:hover:text-primary"
            aria-label="인용구 수정"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-red-500 dark:hover:text-red-500"
            aria-label="인용구 삭제"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      { (quote.page || quote.thought) && 
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-dark-border/50">
            { quote.page && <p className="text-sm text-text-body/70 dark:text-dark-text-body/70">
              p. {quote.page}
            </p> }
            { quote.thought && <p className="text-text-body dark:text-dark-text-body mt-1">
              💭 {quote.thought}
            </p> }
        </div>
      }
    </div>
  );
};

const MemoCard: React.FC<{
  memo: string;
  onDelete: () => void;
  onChange: (value: string) => void;
}> = ({ memo, onDelete, onChange }) => {
  const [isEditing, setIsEditing] = useState(memo === "");

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm space-y-3 border border-primary/50">
        <FormTextarea
          value={memo}
          onChange={(e) => onChange(e.target.value)}
          placeholder="메모 내용"
          rows={3}
          className="flex-grow !bg-transparent !p-0 focus:!ring-0"
        />
        <div className="flex justify-end items-center space-x-4 pt-2">
           <button onClick={onDelete} className="text-sm font-semibold text-red-500 hover:opacity-80">
                삭제
            </button>
            <button onClick={() => setIsEditing(false)} className="text-sm font-bold text-primary hover:opacity-80">
                완료
            </button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className="bg-white dark:bg-dark-card p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap flex-1 pr-4">
          {memo}
        </p>
        <div className="flex space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-primary dark:hover:text-primary"
            aria-label="메모 수정"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-red-500 dark:hover:text-red-500"
            aria-label="메모 삭제"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", children: null, onConfirm: () => {} });

  const initialReviewState = useMemo(() => JSON.stringify(book?.review), [book]);
  
  useEffect(() => {
    const currentState = JSON.stringify(review);
    if (initialReviewState !== currentState) {
      setIsDirty(true);
    } else {
      setIsDirty(false);
    }
  }, [review, initialReviewState]);

  const handleBackNavigation = useCallback(() => {
    if (isDirty) {
      if (window.confirm("변경사항이 저장되지 않았습니다. 정말로 페이지를 떠나시겠습니까?")) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [isDirty, router]);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      setIsLoading(true);

      const { data, error } = await supabase
        .from('user_books')
        .select(`*, books(*)`)
        .eq('book_id', id)
        .eq('user_id', user?.id)
        .single();

      if (error || !data) {
        toast.error("책 정보를 불러오는데 실패했습니다.");
        console.error("Error fetching book:", error);
        router.push("/bookshelf/All");
        return;
      }
      
      const { books: bookData, ...reviewData } = data;
      const formattedBook: BookWithReview = {
        id: bookData.id,
        isbn13: bookData.isbn13,
        title: bookData.title,
        author: bookData.author,
        category: bookData.category,
        description: bookData.description,
        coverImageUrl: bookData.cover_image_url,
        review: reviewData,
      };

      setBook(formattedBook);

      const initialReview = formattedBook.review || {};
      const formatDate = (date: string | undefined) => date ? new Date(date).toISOString().split("T")[0] : undefined;

      setReview({
        ...initialReview,
        start_date: formatDate(initialReview.start_date),
        end_date: formatDate(initialReview.end_date),
        memorable_quotes: (initialReview.memorable_quotes || []).map(q =>
          typeof q === "string" ? { quote: q, page: "", thought: "" } : q
        ),
        memos: initialReview.memos || [],
      });

      setIsLoading(false);
    };

    if (user && id) {
      fetchBook();
    }
  }, [id, user, router, supabase]);

  const readingStatusKorean = {
    [ReadingStatus.WantToRead]: "읽고 싶은",
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
     if (name === "status") {
      handleStatusChange(value as ReadingStatus);
    } else {
      setReview(prev => ({ ...prev, [name]: value }));
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

    if (newStatus === ReadingStatus.Reading && oldStatus === ReadingStatus.WantToRead) {
      performStatusUpdate({ start_date: today, end_date: undefined }, newStatus);
      return;
    }

    if (newStatus === ReadingStatus.Finished && oldStatus === ReadingStatus.Reading) {
      performStatusUpdate({ end_date: review.end_date || today }, newStatus);
      return;
    }
    
    if (newStatus === ReadingStatus.Reading && oldStatus === ReadingStatus.Finished) {
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
        children: "'읽고싶은' 상태로 변경하면 모든 독서 기록(시작일, 완독일)이 삭제됩니다. 계속하시겠어요?",
        onConfirm: () => {
          performStatusUpdate({ start_date: undefined, end_date: undefined }, newStatus);
          setConfirmation({ ...confirmation, isOpen: false });
        },
      });
      return;
    }

    setReview((prev) => ({ ...prev, status: newStatus }));
  };

  const handleRatingChange = (newRating: number) => {
    setReview(prev => ({ ...prev, rating: newRating }));
  };
  
  const handleQuoteChange = (index: number, field: keyof MemorableQuote, value: string) => {
    setReview(prev => {
        const newQuotes = [...(prev.memorable_quotes || [])];
        newQuotes[index] = { ...newQuotes[index], [field]: value };
        return { ...prev, memorable_quotes: newQuotes };
    });
  };
  
  const addMemorableQuote = () => {
    const newQuote: MemorableQuote = { quote: "", page: "", thought: "" };
    setReview(prev => ({
      ...prev,
      memorable_quotes: [...(prev.memorable_quotes || []), newQuote],
    }));
  };

  const removeMemorableQuote = (index: number) => {
    setReview(prev => ({
      ...prev,
      memorable_quotes: (prev.memorable_quotes || []).filter((_, i) => i !== index),
    }));
  };

  const handleMemoChange = (index: number, value: string) => {
    setReview(prev => {
        const newMemos = [...(prev.memos || [])];
        newMemos[index] = value;
        return { ...prev, memos: newMemos };
    });
  };

  const addMemo = () => {
    setReview(prev => ({
      ...prev,
      memos: [...(prev.memos || []), ""],
    }));
  };

  const removeMemo = (index: number) => {
    setReview(prev => ({
      ...prev,
      memos: (prev.memos || []).filter((_, i) => i !== index),
    }));
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
      
      // Update local state in AppContext
      setBooks((currentBooks) => {
        const existingIndex = currentBooks.findIndex((b) => b.id === finalBook.id);
        if (existingIndex > -1) {
          const newBooks = [...currentBooks];
          newBooks[existingIndex] = finalBook;
          return newBooks;
        }
        return [...currentBooks, finalBook];
      });

      setIsDirty(false);
    };

    toast.promise(savePromise(), {
      loading: "기록 저장 중...",
      success: "성공적으로 저장되었어요!",
      error: "저장에 실패했습니다.",
    });

    setIsSaving(false);
  };
  
  if (isLoading || !book) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const showStartDate = review.status === ReadingStatus.Reading || review.status === ReadingStatus.Finished || review.status === ReadingStatus.Dropped;
  const showFinishDate = review.status === ReadingStatus.Finished;

  return (
    <div className="bg-light-gray dark:bg-dark-bg min-h-screen">
      <RecordHeader onSave={handleSave} isSaving={isSaving} onBack={handleBackNavigation} />

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
              style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.25)"}}
            />
            <h2 className="mt-3 text-center text-xl font-bold">{book.title}</h2>
            <p className="text-sm opacity-80">{book.author.split("(지은이")[0].trim()}</p>
          </div>
        </div>

        {/* Description Section */}
        {book.description && (
          <div className="p-4 -mt-6 relative z-[2]">
            <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-bold text-text-heading dark:text-dark-text-heading mb-2">책 소개</h3>
              <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap">
                {book.description}
              </p>
            </div>
          </div>
        )}

        {/* Form Section */}
        <div className="p-4 space-y-8 -mt-10 relative z-[2]">
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg">
             <StarRating rating={review.rating || 0} setRating={handleRatingChange} />
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
                {showStartDate && <FormRow label="독서 시작일">
                    <FormInput
                        type="date"
                        name="start_date"
                        value={review.start_date || ""}
                        onChange={handleInputChange}
                    />
                </FormRow>}
                {showFinishDate && <FormRow label="완독일">
                    <FormInput
                        type="date"
                        name="end_date"
                        value={review.end_date || ""}
                        onChange={handleInputChange}
                    />
                </FormRow>}
            </div>

             <FormRow label="한 줄 평">
                <FormInput
                type="text"
                name="one_line_review"
                value={review.one_line_review || ""}
                onChange={handleInputChange}
                />
            </FormRow>
          </div>

          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-4">
            <FormRow label="인상 깊은 구절">
                <div className="space-y-4">
                {(review.memorable_quotes || []).map((q, index) => (
                    <QuoteCard
                    key={index}
                    quote={q}
                    onDelete={() => removeMemorableQuote(index)}
                    onChange={(field, value) => handleQuoteChange(index, field, value)}
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