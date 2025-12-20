"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookWithReview, ReadingStatus } from "../../types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale"; // [수정 1] 한국어 로케일 추가

interface ReadingCalendarProps {
  books: BookWithReview[];
  theme?: "light" | "dark";
}

interface DailyBook {
  book: BookWithReview;
  count: number;
}

const ReadingCalendar: React.FC<ReadingCalendarProps> = ({
  books,
  theme = "light",
}) => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    // Create a map of date -> books finished on that date
    const booksMap = new Map<string, BookWithReview[]>();

    books.forEach((book) => {
      if (
        book.review?.status === ReadingStatus.Finished &&
        book.review?.end_date
      ) {
        const endDate = new Date(book.review.end_date);
        if (!isNaN(endDate.getTime())) {
          const dateKey = format(endDate, "yyyy-MM-dd");
          if (!booksMap.has(dateKey)) {
            booksMap.set(dateKey, []);
          }
          booksMap.get(dateKey)!.push(book);
        }
      }
    });

    return { calendarDays, booksMap };
  }, [books, currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getDayBooks = (day: Date): DailyBook | null => {
    const dateKey = format(day, "yyyy-MM-dd");
    const booksOnDay = calendarData.booksMap.get(dateKey);
    if (!booksOnDay || booksOnDay.length === 0) return null;

    // Return the last book and count
    return {
      book: booksOnDay[booksOnDay.length - 1],
      count: booksOnDay.length,
    };
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentDate.getMonth();
  };

  const getBooksForDate = (date: Date): BookWithReview[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return calendarData.booksMap.get(dateKey) || [];
  };

  const handleDateClick = (day: Date) => {
    const booksOnDay = getBooksForDate(day);
    if (booksOnDay.length > 0 && isCurrentMonth(day)) {
      setSelectedDate(day);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book-record/${bookId}`);
    handleCloseModal();
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-3 h-3 ${
            i <= rating
              ? "text-yellow-400 fill-current"
              : "text-slate-300 dark:text-slate-600"
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <svg
              className="w-5 h-5 text-slate-600 dark:text-dark-text-body"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-dark-text-heading min-w-[120px] text-center">
            {/* [수정 2] 달력 헤더 한국어 적용 (예: 2025년 12월) */}
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg
              className="w-5 h-5 text-slate-600 dark:text-dark-text-body"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-400 dark:text-dark-text-muted py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {calendarData.calendarDays.map((day) => {
          const dailyBook = getDayBooks(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const hasBooks = dailyBook !== null;

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`aspect-square p-1 relative rounded-xl overflow-hidden transition-all ${
                isCurrentMonthDay
                  ? "bg-slate-50 dark:bg-dark-bg hover:ring-2 hover:ring-slate-200 dark:hover:ring-slate-700"
                  : "bg-slate-50/50 dark:bg-dark-bg/50 opacity-40"
              } ${hasBooks && isCurrentMonthDay ? "cursor-pointer" : ""}`}
            >
              {/* Date Number */}
              <span
                className={`absolute top-1 left-1 sm:top-2 sm:left-2 z-10 text-[10px] font-medium ${
                  dailyBook
                    ? "text-white drop-shadow-md"
                    : isCurrentMonthDay
                    ? "text-slate-400 dark:text-dark-text-muted"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              >
                {format(day, "d")}
              </span>

              {/* Book Cover */}
              {dailyBook && isCurrentMonthDay && (
                <>
                  <img
                    src={dailyBook.book.coverImageUrl}
                    alt={dailyBook.book.title}
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    title={dailyBook.book.title}
                  />
                  {/* Badge for multiple books */}
                  {dailyBook.count > 1 && (
                    <span className="absolute bottom-1 right-1 bg-slate-800 dark:bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                      +{dailyBook.count - 1}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Content */}
          <div className="relative bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-dark-text-heading">
                {/* [수정 3] 모달 날짜 한국어 적용 */}
                {format(selectedDate, "PPP", { locale: ko })}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-dark-bg rounded-full transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5 text-slate-400 dark:text-dark-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {getBooksForDate(selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {getBooksForDate(selectedDate).map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleBookClick(book.id)}
                      className="flex gap-4 p-3 hover:bg-slate-50 dark:hover:bg-dark-bg rounded-xl cursor-pointer transition-colors group"
                    >
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-14 h-20 object-cover rounded-md shadow-sm group-hover:shadow-md transition-all flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-dark-text-heading text-sm line-clamp-2">
                          {book.title}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-dark-text-body mt-1 truncate">
                          {book.author.split("(지은이")[0].trim()}
                        </p>
                        {book.review?.rating && book.review.rating > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {renderStars(Math.round(book.review.rating))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 dark:text-dark-text-body py-8">
                  기록된 책이 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingCalendar;
