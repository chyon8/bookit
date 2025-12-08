import React, { useState, useEffect } from "react";
import { BookWithReview, ReadingStatus, UserBook } from "../types";
import {
  StarIcon,
  XMarkIcon,
  TrashIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  BookOpenIcon,
} from "./Icons";
import ConfirmModal from "./ConfirmModal";
import { useAppContext } from "../context/AppContext";

// --- Helper Components ---
const StarRating: React.FC<{
  rating: number;
  setRating: (rating: number) => void;
}> = ({ rating, setRating }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
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
            <StarIcon className="w-8 h-8 text-gray-300 dark:text-dark-border" />
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
              <StarIcon className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => (
  <input
    {...props}
    className={`w-full p-2 border border-border dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow ${
      props.type === "date" ? "dark:[color-scheme:dark]" : ""
    }`}
  />
);

const FormTextarea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = (props) => (
  <textarea
    {...props}
    className="w-full p-2 border border-border dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
  />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (
  props
) => (
  <div className="relative">
    <select
      {...props}
      className="w-full p-2 pr-8 border border-border dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow appearance-none"
    >
      {props.children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-body dark:text-dark-text-body">
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
      className="block text-sm font-semibold text-text-body dark:text-dark-text-body mb-1"
    >
      {label}
    </label>
    {children}
  </div>
);

const Checkbox: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
> = ({ label, ...props }) => (
  <label className="flex items-center space-x-2 cursor-pointer">
    <input
      type="checkbox"
      {...props}
      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
    />
    <span className="text-text-body dark:text-dark-text-body">{label}</span>
  </label>
);

interface MemorableQuote {
  quote: string;
  page: string;
  thought: string;
}

const QuoteCard: React.FC<{
  quote: MemorableQuote;
  onDelete: () => void;
  onSave: (updatedQuote: MemorableQuote) => void;
}> = ({ quote, onDelete, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState<MemorableQuote>(quote);

  useEffect(() => {
    setEditedQuote(quote);
  }, [quote]);

  const handleSave = () => {
    onSave(editedQuote);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedQuote(quote);
    setIsEditing(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedQuote((prev) => ({ ...prev, [name]: value }));
  };

  if (isEditing) {
    return (
      <div className="bg-light-gray/60 dark:bg-dark-bg/80 p-4 rounded-lg border border-primary dark:border-primary space-y-3">
        <FormTextarea
          name="quote"
          value={editedQuote.quote}
          onChange={handleChange}
          placeholder="인상 깊었던 문장"
          rows={3}
        />
        <div className="flex items-center space-x-2">
          <input
            type="text"
            name="page"
            value={editedQuote.page}
            onChange={handleChange}
            placeholder="페이지"
            className="w-20 p-2 border border-border dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
          />
          <FormTextarea
            name="thought"
            value={editedQuote.thought}
            onChange={handleChange}
            placeholder="나의 생각"
            rows={2}
            className="flex-grow"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="text-sm font-semibold text-text-body dark:text-dark-text-body hover:opacity-80"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="text-sm font-semibold text-primary hover:opacity-80"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-gray/60 dark:bg-dark-bg/80 p-4 rounded-lg border border-border dark:border-dark-border">
      <div className="flex justify-between items-start">
        <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap flex-1 pr-4">
          "{quote.quote}"
        </p>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-primary dark:hover:text-primary"
            aria-label="인용구 수정"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-red-500 dark:hover:text-red-500"
            aria-label="인용구 삭제"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-text-body/70 dark:text-dark-text-body/70 mt-2">
        p. {quote.page}
      </p>
      {quote.thought && (
        <div className="mt-3 pt-3 border-t border-border dark:border-dark-border/50">
          <p className="text-text-body dark:text-dark-text-body mt-1">
            💭 {quote.thought}
          </p>
        </div>
      )}
    </div>
  );
};

const MemoCard: React.FC<{
  memo: string;
  onDelete: () => void;
  onSave: (updatedMemo: string) => void;
}> = ({ memo, onDelete, onSave }) => {
  const [isEditing, setIsEditing] = useState(memo === "");
  const [editedMemo, setEditedMemo] = useState(memo);

  useEffect(() => {
    setEditedMemo(memo);
  }, [memo]);

  const handleSave = () => {
    onSave(editedMemo);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (memo === "") {
      onDelete();
    } else {
      setEditedMemo(memo);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-light-gray/60 dark:bg-dark-bg/80 p-4 rounded-lg border border-primary dark:border-primary space-y-3">
        <FormTextarea
          value={editedMemo}
          onChange={(e) => setEditedMemo(e.target.value)}
          placeholder="메모 내용"
          rows={3}
        />
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleCancel}
            className="text-sm font-semibold text-text-body dark:text-dark-text-body hover:opacity-80"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="text-sm font-semibold text-primary hover:opacity-80"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-gray/60 dark:bg-dark-bg/80 p-4 rounded-lg border border-border dark:border-dark-border">
      <div className="flex justify-between items-start">
        <p className="text-text-body dark:text-dark-text-body whitespace-pre-wrap flex-1 pr-4">
          {memo}
        </p>
        <div className="flex space-x-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-text-body/50 dark:text-dark-text-body/50 hover:text-primary dark:hover:text-primary"
            aria-label="메모 수정"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
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

// --- New Book Info Header ---
const BookInfoHeader: React.FC<{
  book: BookWithReview;
  description?: string;
}> = ({ book, description }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-28 h-auto md:w-32 object-cover rounded-md flex-shrink-0 shadow-lg"
        />
        <div className="flex-grow text-center md:text-left">
          <h3 className="text-xl md:text-2xl font-bold text-text-heading dark:text-dark-text-heading">
            {book.title}
          </h3>
          <p className="text-md text-text-body dark:text-dark-text-body mt-1">
            {book.author}
          </p>
          <p className="text-sm text-text-muted dark:text-dark-text-muted mt-2">
            {book.category}
          </p>
          {description && (
            <div className="text-sm text-text-body dark:text-dark-text-body mt-4 text-left">
              <p
                className={`whitespace-pre-wrap ${
                  !showFullDescription ? "line-clamp-3" : ""
                }`}
              >
                {description}
              </p>
              {description.length > 100 && ( // Only show if description is long enough
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-primary font-semibold text-sm mt-2"
                >
                  {showFullDescription ? "간략히" : "더보기"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Refactored Component ---
const ReviewModal = () => {
  const {
    isReviewModalOpen,
    selectedBook,
    handleSaveReview,
    handleCloseReview,
    handleDeleteBook,
  } = useAppContext();

  const [review, setReview] = useState<Partial<UserBook>>({});
  const [newQuote, setNewQuote] = useState<MemorableQuote>({
    quote: "",
    page: "",
    thought: "",
  });
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", children: null, onConfirm: () => {} });

  useEffect(() => {
    if (selectedBook) {
      const initialReview = selectedBook.review || {
        status: ReadingStatus.WantToRead,
        rating: 0,
        memorable_quotes: [],
        questions_from_book: [],
        memos: [],
      };

      const formatDate = (date: string | undefined) =>
        date ? new Date(date).toISOString().split("T")[0] : undefined;

      setReview({
        ...initialReview,
        start_date: formatDate(initialReview.start_date),
        end_date: formatDate(initialReview.end_date),
        memorable_quotes: (initialReview.memorable_quotes || []).map((q) =>
          typeof q === "string" ? { quote: q, page: "", thought: "" } : q
        ),
        memos: initialReview.memos || [],
      });
    } else {
      // Reset state when modal is closed
      setReview({});
      setNewQuote({ quote: "", page: "", thought: "" });
    }
  }, [selectedBook]);

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
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "status") {
      handleStatusChange(value as ReadingStatus);
    } else {
      setReview((prev) => ({ ...prev, [name]: isCheckbox ? checked : value }));
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

    if (
      newStatus === ReadingStatus.Finished &&
      oldStatus === ReadingStatus.Reading
    ) {
      performStatusUpdate({ end_date: today }, newStatus);
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

  const handleNewQuoteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewQuote((prev) => ({ ...prev, [name]: value }));
  };

  const addMemorableQuote = () => {
    if (newQuote.quote.trim() === "") {
      alert("인상 깊었던 문장을 입력해주세요.");
      return;
    }
    setReview((prev) => ({
      ...prev,
      memorable_quotes: [...(prev.memorable_quotes || []), newQuote],
    }));
    setNewQuote({ quote: "", page: "", thought: "" });
  };

  const removeMemorableQuote = (index: number) => {
    setReview((prev) => ({
      ...prev,
      memorable_quotes: (prev.memorable_quotes || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateMemorableQuote = (
    index: number,
    updatedQuote: MemorableQuote
  ) => {
    setReview((prev) => {
      const newQuotes = [...(prev.memorable_quotes || [])];
      newQuotes[index] = updatedQuote;
      return { ...prev, memorable_quotes: newQuotes };
    });
  };

  const addMemo = () => {
    setReview((prev) => ({
      ...prev,
      memos: [...(prev.memos || []), ""],
    }));
  };

  const removeMemo = (index: number) => {
    setReview((prev) => ({
      ...prev,
      memos: (prev.memos || []).filter((_, i) => i !== index),
    }));
  };

  const updateMemo = (index: number, updatedMemo: string) => {
    setReview((prev) => {
      const newMemos = [...(prev.memos || [])];
      newMemos[index] = updatedMemo;
      return { ...prev, memos: newMemos };
    });
  };

  const handleArrayChange = (
    field: "questions_from_book",
    index: number,
    value: string
  ) => {
    setReview((prev) => {
      const currentArray = prev[field] || [];
      const newArray = [...currentArray];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addToArray = (field: "questions_from_book") => {
    setReview((prev) => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
  };

  const removeFromArray = (field: "questions_from_book", index: number) => {
    setReview((prev) => {
      const currentArray = prev[field] || [];
      return { ...prev, [field]: currentArray.filter((_, i) => i !== index) };
    });
  };

  const handleSave = () => {
    if (!selectedBook) return;

    const { status, start_date, end_date } = review;

    if (status === ReadingStatus.Reading || status === ReadingStatus.Dropped) {
      if (!start_date) {
        alert("독서 시작일을 입력해주세요.");
        return;
      }
    }

    if (status === ReadingStatus.Finished) {
      if (!start_date) {
        alert("독서 시작일을 입력해주세요.");
        return;
      }
      if (!end_date) {
        alert("완독일을 입력해주세요.");
        return;
      }
      if (new Date(end_date) < new Date(start_date)) {
        alert("완독일은 시작일보다 빠를 수 없습니다.");
        return;
      }
    }

    const finalReview = {
      ...review,
      start_date:
        status === ReadingStatus.WantToRead ? undefined : review.start_date,
      end_date: status === ReadingStatus.Finished ? review.end_date : undefined,
      memos: (review.memos || []).filter((m) => m.trim() !== ""),
      memorable_quotes: (review.memorable_quotes || []).filter(
        (q) => q.quote.trim() !== ""
      ),
      questions_from_book: (review.questions_from_book || []).filter(
        (q) => q.trim() !== ""
      ),
    };

    handleSaveReview({ ...selectedBook, review: finalReview as UserBook });
  };

  const handleDeleteRequest = () => {
    if (!selectedBook) return;
    setConfirmation({
      isOpen: true,
      title: "책 삭제",
      children: (
        <p>
          정말로 <span className="font-bold">{selectedBook.title}</span> 책을
          책장에서 삭제하시겠습니까?
        </p>
      ),
      onConfirm: () => {
        if (selectedBook.review?.book_id) {
          handleDeleteBook(selectedBook.review.book_id);
        } else {
          console.error("No book_id found to delete.");
        }
        setConfirmation({ ...confirmation, isOpen: false });
      },
    });
  };

  if (!isReviewModalOpen || !selectedBook) {
    return null;
  }

  const showStartDate =
    review.status === ReadingStatus.Reading ||
    review.status === ReadingStatus.Finished ||
    review.status === ReadingStatus.Dropped;

  const showFinishDate = review.status === ReadingStatus.Finished;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={handleCloseReview}
    >
      <div
        className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white dark:bg-dark-card p-4 border-b border-border dark:border-dark-border flex justify-between items-center z-10">
          <div className="flex items-center space-x-3">
            <BookOpenIcon className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-text-heading dark:text-dark-text-heading truncate pr-10">
              독서 기록
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {review.id && (
              <button
                onClick={handleDeleteRequest}
                className="p-2 rounded-full text-text-body dark:text-dark-text-body hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20"
                aria-label="책 삭제"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleCloseReview}
              className="p-2 rounded-full text-text-body dark:text-dark-text-body hover:bg-light-gray dark:hover:bg-dark-bg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* --- Book Info Header --- */}
        <BookInfoHeader
          book={selectedBook}
          description={selectedBook.description}
        />

        {/* --- Divider --- */}
        <div className="px-6">
          <hr className="border-border dark:border-dark-border" />
        </div>

        {/* --- Form Body --- */}
        <main className="p-6 space-y-6 flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <FormRow label="별점">
              <StarRating
                rating={review.rating || 0}
                setRating={handleRatingChange}
              />
            </FormRow>
          </div>

          {(showStartDate || showFinishDate) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          )}

          {review.notes && (
            <FormRow label="Notion 기록">
              <div className="w-full p-3 border border-border/50 dark:border-dark-border/50 rounded-md bg-light-gray/50 dark:bg-dark-bg/50 text-text-body dark:text-dark-text-body text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                {review.notes}
              </div>
            </FormRow>
          )}

          <FormRow label="한 줄 평">
            <FormInput
              type="text"
              name="one_line_review"
              value={review.one_line_review || ""}
              onChange={handleInputChange}
            />
          </FormRow>

          {/* <FormRow label="읽게 된 동기">
            <FormTextarea
              name="motivation"
              value={review.motivation || ""}
              onChange={handleInputChange}
              rows={3}
            />
          </FormRow> */}

          <FormRow label="메모">
            <div className="space-y-3">
              {(review.memos || []).map((memo, index) => (
                <MemoCard
                  key={index}
                  memo={memo}
                  onDelete={() => removeMemo(index)}
                  onSave={(updatedMemo) => updateMemo(index, updatedMemo)}
                />
              ))}
              <button
                onClick={addMemo}
                className="flex items-center space-x-2 text-sm font-semibold text-primary hover:opacity-80"
              >
                <PlusIcon className="w-4 h-4" />
                <span>메모 추가</span>
              </button>
            </div>
          </FormRow>

          <FormRow label="인상 깊은 구절">
            <div className="space-y-3">
              {(review.memorable_quotes || []).map((q, index) => (
                <QuoteCard
                  key={index}
                  quote={q}
                  onDelete={() => removeMemorableQuote(index)}
                  onSave={(updatedQuote) =>
                    updateMemorableQuote(index, updatedQuote)
                  }
                />
              ))}

              <div className="p-4 border border-border dark:border-dark-border rounded-lg space-y-3 bg-white dark:bg-dark-bg">
                <FormTextarea
                  name="quote"
                  value={newQuote.quote}
                  onChange={handleNewQuoteChange}
                  placeholder="인상 깊었던 문장을 입력하세요"
                  rows={3}
                  className="text-base"
                />
                <div className="flex flex-wrap items-center gap-2 bg-light-gray/50 dark:bg-dark-card p-2 rounded-md">
                  <input
                    type="text"
                    name="page"
                    value={newQuote.page}
                    onChange={handleNewQuoteChange}
                    placeholder="페이지"
                    className="w-20 p-2 border border-border dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                  />
                  <input
                    type="text"
                    name="thought"
                    value={newQuote.thought}
                    onChange={handleNewQuoteChange}
                    placeholder="나의 생각"
                    className="flex-1 p-2 border border-border dark:border-dark-border rounded-md bg-white dark:bg-dark-bg text-text-heading dark:text-dark-text-heading focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                  />
                  <button
                    onClick={addMemorableQuote}
                    className="p-2 bg-primary rounded-full text-white hover:opacity-90 transition-opacity flex-shrink-0"
                    aria-label="구절 추가"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </FormRow>

          {/* <FormRow label="새로운 개념/알게된 점">
            <FormTextarea
              name="learnings"
              value={review.learnings || ""}
              onChange={handleInputChange}
              rows={4}
            />
          </FormRow> */}

          {/* <FormRow label="책이 던지는 질문">
            <div className="space-y-2">
              {(review.questions_from_book || []).map((question, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <FormTextarea
                    value={question}
                    onChange={(e) =>
                      handleArrayChange(
                        "questions_from_book",
                        index,
                        e.target.value
                      )
                    }
                    placeholder={`질문 #${index + 1}`}
                    rows={2}
                  />
                  <button
                    onClick={() =>
                      removeFromArray("questions_from_book", index)
                    }
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addToArray("questions_from_book")}
                className="flex items-center space-x-2 text-sm font-semibold text-primary hover:opacity-80"
              >
                <PlusIcon className="w-4 h-4" />
                <span>질문 추가</span>
              </button>
            </div>
          </FormRow> */}

          {/* <FormRow label="연결되는 생각/아이디어">
            <FormTextarea
              name="connected_thoughts"
              value={review.connected_thoughts || ""}
              onChange={handleInputChange}
              rows={3}
            />
          </FormRow> */}

          {/* <FormRow label="총평">
            <FormTextarea
              name="overall_impression"
              value={review.overall_impression || ""}
              onChange={handleInputChange}
              rows={4}
            />
          </FormRow> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormRow label="다시 읽을 건가요?">
              <Checkbox
                label="이 책을 다시 읽을 거예요"
                name="reread_will"
                checked={review.reread_will || false}
                onChange={handleInputChange}
              />
            </FormRow>
            <FormRow label="소장할 가치가 있나요?">
              <Checkbox
                label="책장에 평생 소장할 가치가 있어요"
                name="worth_owning"
                checked={review.worth_owning || false}
                onChange={handleInputChange}
              />
            </FormRow>
          </div>

          {review.reread_will && (
            <FormRow label="다시 읽으려는 이유">
              <FormInput
                type="text"
                name="reread_reason"
                value={review.reread_reason || ""}
                onChange={handleInputChange}
              />
            </FormRow>
          )}
        </main>

        <footer className="sticky bottom-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm p-4 border-t border-border dark:border-dark-border">
          <button
            onClick={handleSave}
            className="w-full bg-primary text-text-heading font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            책장에 저장
          </button>
        </footer>

        <ConfirmModal
          isOpen={confirmation.isOpen}
          onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
          onConfirm={confirmation.onConfirm}
          title={confirmation.title}
        >
          {confirmation.children}
        </ConfirmModal>
      </div>
    </div>
  );
};

export default ReviewModal;