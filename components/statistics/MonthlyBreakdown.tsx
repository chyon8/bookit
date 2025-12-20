'use client';
import React, { useState, useMemo } from 'react';
import { BookWithReview, ReadingStatus } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface MonthlyBreakdownProps {
  books: BookWithReview[];
  theme?: 'light' | 'dark';
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

const TimeRangeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
      active
        ? 'bg-slate-800 dark:bg-primary text-white dark:text-text-heading'
        : 'text-slate-500 dark:text-dark-text-body hover:bg-slate-100 dark:hover:bg-dark-bg'
    }`}
  >
    {children}
  </button>
);

const MonthlyBreakdown: React.FC<MonthlyBreakdownProps> = ({
  books,
  theme = 'light',
  timeRange,
  onTimeRangeChange,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const isDark = theme === 'dark';

  const chartColors = {
    textColor: isDark ? '#D1D5DB' : '#64748b',
    gridColor: isDark ? '#374151' : '#f1f5f9',
    tooltip: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderColor: isDark ? '#374151' : '#f1f5f9',
    },
    bar: isDark ? '#4ADE80' : '#334155',
  };

  const { monthlyData, monthlyBooksMap } = useMemo(() => {
    const monthlyMap = new Map<number, number>();
    const booksMap = new Map<string, BookWithReview[]>();

    books.forEach((book) => {
      if (
        book.review?.status === ReadingStatus.Finished &&
        book.review?.end_date
      ) {
        const date = new Date(book.review.end_date);
        if (!isNaN(date.getTime())) {
          const key = new Date(date.getFullYear(), date.getMonth()).getTime();
          monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);

          const monthKey = format(date, 'MMM yy');
          if (!booksMap.has(monthKey)) {
            booksMap.set(monthKey, []);
          }
          booksMap.get(monthKey)!.push(book);
        }
      }
    });

    const sortedMonthly = Array.from(monthlyMap.entries()).sort(
      (a, b) => a[0] - b[0]
    );
    const monthlySlice =
      timeRange === 'all'
        ? sortedMonthly
        : sortedMonthly.slice(-parseInt(timeRange));
    const data = monthlySlice.map(([timestamp, count]) => ({
      name: new Date(timestamp).toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      }),
      Books: count,
      timestamp,
    }));

    return { monthlyData: data, monthlyBooksMap: booksMap };
  }, [books, timeRange]);

  // Auto-select the most recent month with data on first render
  React.useEffect(() => {
    if (monthlyData.length > 0 && !selectedMonth) {
      setSelectedMonth(monthlyData[monthlyData.length - 1].name);
    }
  }, [monthlyData, selectedMonth]);

  const handleBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedMonth(data.activePayload[0].payload.name);
    }
  };

  const selectedMonthBooks = useMemo(() => {
    if (!selectedMonth) return [];
    const booksList = monthlyBooksMap.get(selectedMonth) || [];
    // Sort by end_date descending (most recent first)
    return booksList.sort((a, b) => {
      const dateA = a.review?.end_date ? new Date(a.review.end_date).getTime() : 0;
      const dateB = b.review?.end_date ? new Date(b.review.end_date).getTime() : 0;
      return dateB - dateA;
    });
  }, [selectedMonth, monthlyBooksMap]);

  const timeRangeText =
    timeRange === 'all' ? '전체 기간' : `최근 ${timeRange}개월`;
  const chartTitle = `월별 완독 수 (${timeRangeText})`;

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`w-3 h-3 sm:w-4 sm:h-4 ${
            i <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-slate-300 dark:text-slate-600'
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Chart */}
      <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-dark-text-heading tracking-tight">
            {chartTitle}
          </h3>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <TimeRangeButton
              onClick={() => onTimeRangeChange('6')}
              active={timeRange === '6'}
            >
              6개월
            </TimeRangeButton>
            <TimeRangeButton
              onClick={() => onTimeRangeChange('12')}
              active={timeRange === '12'}
            >
              12개월
            </TimeRangeButton>
            <TimeRangeButton
              onClick={() => onTimeRangeChange('all')}
              active={timeRange === 'all'}
            >
              전체
            </TimeRangeButton>
          </div>
        </div>
        {monthlyData.length === 0 ? (
          <p className="text-slate-400 dark:text-dark-text-body text-center py-8 sm:py-10 text-sm">
            책을 완독하여 월별 독서 기록을 시작하세요.
          </p>
        ) : (
          <div className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                onClick={handleBarClick}
              >
                <CartesianGrid
                  strokeDasharray="0"
                  stroke={chartColors.gridColor}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: chartColors.textColor }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: chartColors.textColor }}
                />
                <Tooltip
                  contentStyle={chartColors.tooltip}
                  cursor={{
                    fill: isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar
                  dataKey="Books"
                  fill={chartColors.bar}
                  name="권"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Selected Month Book List */}
      {selectedMonth && selectedMonthBooks.length > 0 && (
        <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm">
          <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-dark-text-heading mb-4 sm:mb-6 tracking-tight">
            Books Read in {selectedMonth}
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {selectedMonthBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-bg transition-colors"
              >
                {/* Book Cover */}
                <img
                  src={book.coverImageUrl}
                  alt={book.title}
                  className="w-12 sm:w-16 h-auto rounded-lg shadow-md flex-shrink-0"
                />

                {/* Book Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 dark:text-dark-text-heading text-sm sm:text-base line-clamp-1">
                    {book.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-text-body truncate mt-0.5">
                    {book.author.split('(지은이')[0].trim()}
                  </p>
                  {book.review?.rating && book.review.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1 sm:mt-2">
                      {renderStars(Math.round(book.review.rating))}
                    </div>
                  )}
                </div>

                {/* Read Date */}
                <div className="flex-shrink-0 text-right">
                  {book.review?.end_date && (
                    <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-dark-text-body">
                      {format(new Date(book.review.end_date), 'MMM dd')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyBreakdown;
