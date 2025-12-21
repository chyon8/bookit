"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookWithReview, ReadingStatus } from "../../types";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameMonth,
} from "date-fns";
import { ko } from "date-fns/locale";

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

  // --- Data Logic ---
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ko });
    const calendarEnd = endOfWeek(monthEnd, { locale: ko });

    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

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

  // --- Handlers ---
  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getDayBooks = (day: Date): DailyBook | null => {
    const dateKey = format(day, "yyyy-MM-dd");
    const booksOnDay = calendarData.booksMap.get(dateKey);
    if (!booksOnDay || booksOnDay.length === 0) return null;
    return {
      book: booksOnDay[booksOnDay.length - 1], // 가장 최근 책
      count: booksOnDay.length,
    };
  };

  const getBooksForDate = (date: Date): BookWithReview[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return calendarData.booksMap.get(dateKey) || [];
  };

  const handleDateClick = (day: Date) => {
    const booksOnDay = getBooksForDate(day);
    if (booksOnDay.length > 0) {
      setSelectedDate(day);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedDate(null), 200);
  };

  const handleBookClick = (bookId: string) => {
    router.push(`/book-record/${bookId}`);
    handleCloseModal();
  };

  // --- Helpers ---
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`w-3.5 h-3.5 ${
          i < rating
            ? "text-yellow-400 fill-current"
            : "text-slate-200 dark:text-slate-700"
        }`}
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-none">
      {/* 1. Header Navigation */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-dark-text-heading tracking-tight">
          독서 캘린더
        </h3>

        <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-full p-1">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full shadow-sm transition-all"
            aria-label="Previous month"
          >
            <svg
              className="w-4 h-4 text-slate-600 dark:text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[100px] text-center px-2">
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full shadow-sm transition-all"
            aria-label="Next month"
          >
            <svg
              className="w-4 h-4 text-slate-600 dark:text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Calendar Grid */}
      <div className="w-full">
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-4">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold text-slate-400 dark:text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {calendarData.calendarDays.map((day) => {
            const isCurrentM = isSameMonth(day, currentDate);

            // 이번 달이 아니면 빈 공간 유지
            if (!isCurrentM) {
              return <div key={day.toISOString()} className="aspect-square" />;
            }

            const dailyBook = getDayBooks(day);
            const isTodayDate = isToday(day);
            const hasBooks = dailyBook !== null;

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  aspect-square relative overflow-hidden transition-all duration-300
                  /* ✅ 수정됨: 모바일에서는 rounded-lg(살짝 둥금), 태블릿 이상에서는 rounded-2xl(많이 둥금) */
                  rounded-lg sm:rounded-2xl
                  ${
                    hasBooks
                      ? "cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                      : "bg-slate-50 dark:bg-slate-800/50"
                  }
                `}
              >
                {/* Book Cover Image */}
                {hasBooks && dailyBook && (
                  <div className="absolute inset-0 w-full h-full">
                    <img
                      src={dailyBook.book.coverImageUrl}
                      alt="cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />
                  </div>
                )}

                {/* Date Number Badge */}
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 flex flex-col items-start">
                  <span
                    className={`
                       flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-[10px] sm:text-xs font-bold rounded-full
                       ${
                         isTodayDate
                           ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                           : hasBooks
                           ? "text-white/90 drop-shadow-md"
                           : "text-slate-400 dark:text-slate-500"
                       }
                     `}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Multiple Books Count Badge */}
                {dailyBook && dailyBook.count > 1 && (
                  <div className="absolute bottom-0.5 right-0.5 sm:bottom-1.5 sm:right-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-1 h-3 sm:h-4 flex items-center justify-center rounded-md sm:rounded-lg shadow-sm">
                    <span className="text-[7px] sm:text-[9px] font-semibold text-slate-700 dark:text-white leading-none">
                      +{dailyBook.count - 1}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detail Modal (Pop-up) */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          />

          <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Read on
                </span>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white font-serif">
                  {format(selectedDate, "yyyy년 M월 d일", { locale: ko })}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 bg-white dark:bg-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                <svg
                  className="w-5 h-5 text-slate-500 dark:text-slate-300"
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

            <div className="p-4 max-h-[60vh] overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
              <div className="space-y-3">
                {getBooksForDate(selectedDate).map((book) => (
                  <div
                    key={book.id}
                    onClick={() => handleBookClick(book.id)}
                    className="group flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                  >
                    <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-bold text-slate-800 dark:text-white text-base leading-snug line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-3">
                        {book.author}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {book.review?.rating && book.review.rating > 0 ? (
                            renderStars(Math.round(book.review.rating))
                          ) : (
                            <span className="text-xs text-slate-300">
                              No rating
                            </span>
                          )}
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                          <svg
                            className="w-5 h-5 text-slate-400"
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingCalendar;
