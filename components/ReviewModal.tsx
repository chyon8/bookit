import React, { useState } from "react";
import { BookWithReview, ReadingStatus, UserBook } from "../types";
import {
  StarIcon,
  XMarkIcon,
  TrashIcon,
  ChevronDownIcon,
  PlusIcon,
} from "./Icons";
import ConfirmModal from "./ConfirmModal";

interface ReviewModalProps {
  book: BookWithReview;
  onSave: (book: BookWithReview) => void;
  onClose: () => void;
  onDelete: (bookId: string) => void;
}

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Helper components (no changes needed for these)
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

const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="block text-sm font-semibold text-text-body dark:text-dark-text-body mb-1">
      {label}
    </label>
    {children}
  </div>
);

const Checkbox: React.FC<CheckboxProps> = ({ label, ...props }) => (
  <label className="flex items-center space-x-2 cursor-pointer">
    <input
      type="checkbox"
      {...props}
      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
    />
    <span className="text-text-body dark:text-dark-text-body">{label}</span>
  </label>
);

// Main Refactored Component
const ReviewModal: React.FC<ReviewModalProps> = ({
  book,
  onSave,
  onClose,
  onDelete,
}) => {
  const [review, setReview] = useState<Partial<UserBook>>(() => {
    const today = new Date().toISOString().split("T")[0];
    const initialReview = book.review || {
      status: ReadingStatus.WantToRead,
      rating: 0,
      memorable_quotes: [],
      questions_from_book: [],
    };

    return {
      ...initialReview,
      start_date: initialReview.start_date
        ? new Date(initialReview.start_date).toISOString().split("T")[0]
        : today,
      end_date: initialReview.end_date
        ? new Date(initialReview.end_date).toISOString().split("T")[0]
        : today,
    };
  });
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

  const readingStatusKorean = {
    [ReadingStatus.WantToRead]: '읽고 싶은',
    [ReadingStatus.Reading]: '읽는 중',
    [ReadingStatus.Finished]: '완독',
    [ReadingStatus.Dropped]: '중단',
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = (e.target as HTMLInputElement).checked;
    setReview((prev) => ({ ...prev, [name]: isCheckbox ? checked : value }));
  };

  const handleRatingChange = (newRating: number) => {
    setReview((prev) => ({ ...prev, rating: newRating }));
  };

  const handleArrayChange = (
    field: "memorable_quotes" | "questions_from_book",
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

  const addToArray = (field: "memorable_quotes" | "questions_from_book") => {
    setReview((prev) => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
  };

  const removeFromArray = (
    field: "memorable_quotes" | "questions_from_book",
    index: number
  ) => {
    setReview((prev) => {
      const currentArray = prev[field] || [];
      return { ...prev, [field]: currentArray.filter((_, i) => i !== index) };
    });
  };

  const handleSave = () => {
    // Filter out empty strings from arrays before saving
    const finalReview = {
      ...review,
      memorable_quotes: (review.memorable_quotes || []).filter(
        (q) => q.trim() !== ""
      ),
      questions_from_book: (review.questions_from_book || []).filter(
        (q) => q.trim() !== ""
      ),
    };
    onSave({ ...book, review: finalReview });
  };

  const handleConfirmDelete = () => {
    onDelete(book.id);
    setConfirmModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-white dark:bg-dark-card p-4 border-b border-border dark:border-dark-border flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-text-heading dark:text-dark-text-heading truncate pr-10">
            {book.title}
          </h2>
          <div className="flex items-center space-x-2">
            {book.review && book.review.id && (
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="p-2 rounded-full text-text-body dark:text-dark-text-body hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-500/20"
                aria-label="책 삭제"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-text-body dark:text-dark-text-body hover:bg-light-gray dark:hover:bg-dark-bg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        <main className="p-6 space-y-6 flex-grow">
          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="w-32 h-48 object-cover rounded-md flex-shrink-0 mx-auto sm:mx-0 shadow-md"
            />
            <div className="flex-grow space-y-4 w-full">
              <FormRow label="독서 상태">
                <FormSelect
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FormRow label="독서 시작일">
              <FormInput
                type="date"
                name="start_date"
                value={review.start_date || ""}
                onChange={handleInputChange}
              />
            </FormRow>
            <FormRow label="완독일">
              <FormInput
                type="date"
                name="end_date"
                value={review.end_date || ""}
                onChange={handleInputChange}
              />
            </FormRow>
          </div>

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

          <FormRow label="읽게 된 동기">
            <FormTextarea
              name="motivation"
              value={review.motivation || ""}
              onChange={handleInputChange}
              rows={3}
            />
          </FormRow>

          <FormRow label="요약">
            <FormTextarea
              name="summary"
              value={review.summary || ""}
              onChange={handleInputChange}
              rows={5}
            />
          </FormRow>

          <FormRow label="인상 깊은 구절">
            <div className="space-y-2">
              {(review.memorable_quotes || []).map((quote, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <FormInput
                    type="text"
                    value={quote}
                    onChange={(e) =>
                      handleArrayChange(
                        "memorable_quotes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder={`구절 #${index + 1}`}
                  />
                  <button
                    onClick={() => removeFromArray("memorable_quotes", index)}
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addToArray("memorable_quotes")}
                className="flex items-center space-x-2 text-sm font-semibold text-primary hover:opacity-80"
              >
                <PlusIcon className="w-4 h-4" />
                <span>구절 추가</span>
              </button>
            </div>
          </FormRow>

          <FormRow label="배운 점">
            <FormTextarea
              name="learnings"
              value={review.learnings || ""}
              onChange={handleInputChange}
              rows={4}
            />
          </FormRow>

          <FormRow label="책이 던지는 질문">
            <div className="space-y-2">
              {(review.questions_from_book || []).map((question, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <FormInput
                    type="text"
                    value={question}
                    onChange={(e) =>
                      handleArrayChange(
                        "questions_from_book",
                        index,
                        e.target.value
                      )
                    }
                    placeholder={`질문 #${index + 1}`}
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
          </FormRow>

          <FormRow label="연결되는 생각/아이디어">
            <FormTextarea
              name="connected_thoughts"
              value={review.connected_thoughts || ""}
              onChange={handleInputChange}
              rows={3}
            />
          </FormRow>

          <FormRow label="총평">
            <FormTextarea
              name="overall_impression"
              value={review.overall_impression || ""}
              onChange={handleInputChange}
              rows={4}
            />
          </FormRow>

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
            isOpen={isConfirmModalOpen}
            onClose={() => setConfirmModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="책 삭제"
        >
            <p>정말로 <span className="font-bold">{book.title}</span> 책을 책장에서 삭제하시겠습니까?</p>
        </ConfirmModal>
      </div>
    </div>
  );
};

export default ReviewModal;