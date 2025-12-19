import React, { useMemo, useState } from "react";
import { BookWithReview, ReadingStatus, UserBook } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";
import {
  BookOpenIcon,
  BookshelfIcon,
  ChartBarIcon,
  StarIcon,
} from "./Icons";

type Tab = "overview" | "habits" | "genres" | "wishlist";
type Theme = "light" | "dark";

interface StatsViewProps {
  books: BookWithReview[];
  theme: Theme;
}

const ChartContainer: React.FC<{
  title: string;
  children: React.ReactNode;
  empty: boolean;
  emptyText: string;
}> = ({ title, children, empty, emptyText }) => (
  <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm">
    <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-dark-text-heading mb-4 sm:mb-6 tracking-tight">
      {title}
    </h3>
    {empty ? (
      <p className="text-slate-400 dark:text-dark-text-body text-center py-8 sm:py-10 text-sm">
        {emptyText}
      </p>
    ) : (
      <div className="h-[250px] sm:h-[300px] w-full">{children}</div>
    )}
  </div>
);

const StatCard: React.FC<{
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}> = ({ title, value, description, icon }) => (
  <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm text-center relative overflow-hidden">
    {icon && (
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 text-slate-100 dark:text-dark-text-muted opacity-20">
        {React.cloneElement(icon as React.ReactElement, { className: "w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16" })}
      </div>
    )}
    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-dark-text-body uppercase tracking-wider mb-2 sm:mb-3">
      {title}
    </p>
    <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 dark:text-dark-text-heading truncate">
      {value}
    </p>
    {description && (
      <p className="text-xs sm:text-sm text-slate-400 dark:text-dark-text-muted mt-1 sm:mt-2">
        {description}
      </p>
    )}
  </div>
);

const TopAuthors: React.FC<{
  authorData: { name: string; count: number }[];
}> = ({ authorData }) => {
  if (!authorData || authorData.length === 0)
    return (
      <p className="text-slate-400 dark:text-dark-text-body text-center py-8 sm:py-10 text-sm">
        데이터가 없습니다.
      </p>
    );

  return (
    <div className="space-y-3 sm:space-y-4">
      {authorData.map((author, index) => (
        <div key={author.name} className="flex items-center justify-between group">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
            <span className="text-lg sm:text-xl md:text-2xl font-serif text-slate-300 dark:text-dark-text-muted italic w-6 sm:w-8 flex-shrink-0">
              {index + 1}
            </span>
            <span className="text-slate-700 dark:text-dark-text-heading font-medium text-sm sm:text-base md:text-lg truncate">
              {author.name.split("(지은이")[0].trim()}
            </span>
          </div>
          <div className="text-slate-400 dark:text-dark-text-body font-light text-xs sm:text-sm ml-2 flex-shrink-0">
            <span className="text-slate-900 dark:text-dark-text-heading font-bold">{author.count}</span> 권
          </div>
        </div>
      ))}
    </div>
  );
};

const SpeedReadCard: React.FC<{
  title: string;
  book: BookWithReview | null;
  days: number | null;
}> = ({ title, book, days }) => (
  <div className="bg-white dark:bg-dark-card p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
    <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-dark-text-body uppercase tracking-wider mb-3 sm:mb-4">
      {title}
    </p>
    {book && days != null ? (
      <div className="flex items-center gap-3 sm:gap-4">
        <img
          src={book.coverImageUrl}
          alt={book.title}
          className="w-12 sm:w-14 h-auto rounded-md sm:rounded-lg shadow-md flex-shrink-0"
        />
        <div className="flex-grow overflow-hidden min-w-0">
          <p className="font-semibold text-slate-800 dark:text-dark-text-heading line-clamp-2 text-sm sm:text-base">
            {book.title}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-text-body truncate mt-0.5 sm:mt-1">
            {book.author.split("(지은이")[0].trim()}
          </p>
          <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-primary mt-1 sm:mt-2">{days}일</p>
        </div>
      </div>
    ) : (
      <div className="flex justify-center items-center h-[60px] sm:h-[80px]">
        <p className="text-slate-400 dark:text-dark-text-body text-center text-sm">
          데이터 없음
        </p>
      </div>
    )}
  </div>
);

const TimeRangeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
      active
        ? "bg-slate-800 dark:bg-primary text-white dark:text-text-heading"
        : "text-slate-500 dark:text-dark-text-body hover:bg-slate-100 dark:hover:bg-dark-bg"
    }`}
  >
    {children}
  </button>
);

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
      active
        ? "bg-slate-800 dark:bg-primary text-white dark:text-text-heading"
        : "text-slate-600 dark:text-dark-text-body hover:bg-slate-100 dark:hover:bg-dark-bg"
    }`}
  >
    {children}
  </button>
);

const StatsView: React.FC<StatsViewProps> = ({ books, theme }) => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [timeRange, setTimeRange] = useState("12");
  const isDark = theme === "dark";

  const readingStatusKorean = {
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
    [ReadingStatus.WantToRead]: "읽고 싶은",
  };

  const chartColors = {
    textColor: isDark ? "#D1D5DB" : "#64748b",
    gridColor: isDark ? "#374151" : "#f1f5f9",
    tooltip: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderColor: isDark ? "#374151" : "#f1f5f9",
    },
    pie: isDark
      ? ["#4ADE80", "#38BDF8", "#94A3B8", "#475569"]
      : ["#334155", "#059669", "#94A3B8", "#cbd5e1"],
    bar: {
      booksFinished: isDark ? "#4ADE80" : "#334155",
      ratingDist: isDark ? "#A7F3D0" : "#334155",
      categoryDist: isDark ? "#38BDF8" : "#334155",
      wishlist: isDark ? "#F472B6" : "#334155",
    },
  };

  const processedStats = useMemo(() => {
    const stats = {
      totalBooks: books?.length || 0,
      totalFinished: 0,
      currentlyReading: 0,
      finishedThisMonth: 0,
      avgRating: "N/A",
      readingStatusData: [] as { name: string; value: number }[],
      ratingDistributionData: [] as { name: string; Count: number }[],
      monthlyData: [] as { name: string; Books: number }[],
      categoryData: [] as { name: string; value: number }[],
      authorData: [] as { name: string; count: number }[],
      readingSpeed: {
        avgDays: 0,
        fastest: null as { book: BookWithReview; days: number } | null,
        slowest: null as { book: BookWithReview; days: number } | null,
      },

      wishlist: {
        categoryData: [] as { name: string; value: number }[],
        authorData: [] as { name: string; count: number }[],
      },
    };

    if (!books || books.length === 0) {
      return stats;
    }

    let totalRating = 0;
    let ratedBooksCount = 0;
    const statusCounts: { [key: string]: number } = {
      [ReadingStatus.Finished]: 0,
      [ReadingStatus.Reading]: 0,
      [ReadingStatus.WantToRead]: 0,
      [ReadingStatus.Dropped]: 0,
    };
    const ratingCounts: { [key: number]: number } = {};
    const monthlyMap = new Map<number, number>();
    const categoryCounts: { [key: string]: number } = {};
    const authorCounts: { [key: string]: number } = {};

    let totalReadingDays = 0;
    let booksWithReadingDays = 0;
    let fastestRead: { book: BookWithReview; days: number } | null = null;
    let slowestRead: { book: BookWithReview; days: number } | null = null;

    const wishlistCategoryCounts: { [key: string]: number } = {};
    const wishlistAuthorCounts: { [key: string]: number } = {};

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    books.forEach((book) => {
      const status = book.review?.status || ReadingStatus.WantToRead;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === ReadingStatus.Finished) {
        stats.totalFinished++;

        if (book.review?.rating && book.review.rating > 0) {
          const rating = Math.round(book.review.rating * 2) / 2;
          ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
          totalRating += book.review.rating;
          ratedBooksCount++;
        }

        if (book.review?.end_date) {
          const date = new Date(book.review.end_date);
          if (!isNaN(date.getTime())) {
            const key = new Date(date.getFullYear(), date.getMonth()).getTime();
            monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);

            if (
              date.getMonth() === currentMonth &&
              date.getFullYear() === currentYear
            ) {
              stats.finishedThisMonth++;
            }
          }
        }

        const category = book.category || "Uncategorized";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;

        if (book.review?.start_date && book.review?.end_date) {
          const startDate = new Date(book.review.start_date);
          const endDate = new Date(book.review.end_date);
          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const diffDays = Math.round(
              (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays >= 0) {
              totalReadingDays += diffDays;
              booksWithReadingDays++;
              if (fastestRead === null || diffDays < fastestRead.days) {
                fastestRead = { book, days: diffDays };
              }
              if (slowestRead === null || diffDays > slowestRead.days) {
                slowestRead = { book, days: diffDays };
              }
            }
          }
        }


      }

      if (status === ReadingStatus.Reading) {
        stats.currentlyReading++;
      }

      if (status === ReadingStatus.WantToRead) {
        const category = book.category || "Uncategorized";
        wishlistCategoryCounts[category] =
          (wishlistCategoryCounts[category] || 0) + 1;
        wishlistAuthorCounts[book.author] =
          (wishlistAuthorCounts[book.author] || 0) + 1;
      }
    });

    if (ratedBooksCount > 0) {
      stats.avgRating = (totalRating / ratedBooksCount).toFixed(1);
    }

    stats.readingStatusData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);

    stats.ratingDistributionData = Object.entries(ratingCounts)
      .map(([rating, count]) => ({
        name: `${parseFloat(rating).toFixed(1)} ★`,
        Count: count,
      }))
      .sort((a, b) => parseFloat(a.name) - parseFloat(b.name));

    const sortedMonthly = Array.from(monthlyMap.entries()).sort(
      (a, b) => a[0] - b[0]
    );
    const monthlySlice =
      timeRange === "all"
        ? sortedMonthly
        : sortedMonthly.slice(-parseInt(timeRange));
    stats.monthlyData = monthlySlice.map(([timestamp, count]) => ({
      name: new Date(timestamp).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      }),
      Books: count,
    }));

    stats.categoryData = Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    stats.authorData = Object.entries(authorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    if (booksWithReadingDays > 0) {
      stats.readingSpeed.avgDays = Math.round(
        totalReadingDays / booksWithReadingDays
      );
    }
    stats.readingSpeed.fastest = fastestRead;
    stats.readingSpeed.slowest = slowestRead;



    stats.wishlist.categoryData = Object.entries(wishlistCategoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    stats.wishlist.authorData = Object.entries(wishlistAuthorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }, [books, timeRange]);

  if (books?.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-dark-bg min-h-screen flex items-center justify-center">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-dark-text-heading">
            통계 정보 없음
          </h2>
          <p className="text-slate-500 dark:text-dark-text-body mt-2">
            책을 추가하여 통계를 확인해보세요!
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        const translatedReadingStatusData =
          processedStats.readingStatusData.map((item) => ({
            ...item,
            name:
              readingStatusKorean[
                item.name as keyof typeof readingStatusKorean
              ] || item.name,
          }));

        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                title="총 보유"
                value={processedStats.totalBooks}
                icon={<BookshelfIcon className="w-5 h-5 text-text-body dark:text-dark-text-body" />}
              />
              <StatCard
                title="완독"
                value={processedStats.totalFinished}
                icon={<BookOpenIcon className="w-5 h-5 text-text-body dark:text-dark-text-body" />}
              />
              <StatCard
                title="평균 별점"
                value={processedStats.avgRating}
                icon={<StarIcon className="w-5 h-5 text-text-body dark:text-dark-text-body" />}
              />
              <StatCard
                title="이번 달"
                value={processedStats.finishedThisMonth}
                description={`${processedStats.currentlyReading}권 읽는 중`}
                icon={<ChartBarIcon className="w-5 h-5 text-text-body dark:text-dark-text-body" />}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ChartContainer
                title="내 서재 현황"
                empty={processedStats.readingStatusData.length === 0}
                emptyText="서재가 비어있습니다."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={translatedReadingStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={3}
                    >
                      {processedStats.readingStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors.pie[index % chartColors.pie.length]}
                        />
                      ))}
                      <Label
                        value={`${books?.length}권`}
                        position="center"
                        className="fill-slate-800 dark:fill-dark-text-heading text-3xl font-bold"
                      />
                    </Pie>
                    <Tooltip contentStyle={chartColors.tooltip} />
                    <Legend
                      wrapperStyle={{ color: chartColors.textColor }}
                      align="right"
                      verticalAlign="middle"
                      layout="vertical"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

            </div>
          </div>
        );
      case "habits":
        const timeRangeText =
          timeRange === "all" ? "전체 기간" : `최근 ${timeRange}개월`;
        const chartTitle = `월별 완독 수 (${timeRangeText})`;

        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-dark-text-heading tracking-tight">
                    {chartTitle}
                  </h3>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <TimeRangeButton
                      onClick={() => setTimeRange("6")}
                      active={timeRange === "6"}
                    >
                      6개월
                    </TimeRangeButton>
                    <TimeRangeButton
                      onClick={() => setTimeRange("12")}
                      active={timeRange === "12"}
                    >
                      12개월
                    </TimeRangeButton>
                    <TimeRangeButton
                      onClick={() => setTimeRange("all")}
                      active={timeRange === "all"}
                    >
                      전체
                    </TimeRangeButton>
                  </div>
                </div>
                {processedStats.monthlyData.length === 0 ? (
                  <p className="text-slate-400 dark:text-dark-text-body text-center py-8 sm:py-10 text-sm">
                    책을 완독하여 월별 독서 기록을 시작하세요.
                  </p>
                ) : (
                  <div className="h-[250px] sm:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processedStats.monthlyData}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
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
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.05)",
                          }}
                        />
                        <Bar
                          dataKey="Books"
                          fill={chartColors.bar.booksFinished}
                          name="권"
                          radius={[6, 6, 0, 0]}
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              <ChartContainer
                title="별점 분포"
                empty={processedStats.ratingDistributionData.length === 0}
                emptyText="완독한 책의 별점을 매겨보세요."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={processedStats.ratingDistributionData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
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
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)",
                      }}
                    />
                    <Bar
                      dataKey="Count"
                      fill={chartColors.bar.ratingDist}
                      name="권 수"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                title="평균 완독 기간"
                value={`${processedStats.readingSpeed.avgDays}일`}
                description="1권의 책을 읽는데 걸리는 평균 시간"
              />
              <SpeedReadCard
                title="가장 빨리 읽은 책"
                book={processedStats.readingSpeed.fastest?.book ?? null}
                days={processedStats.readingSpeed.fastest?.days ?? null}
              />
              <SpeedReadCard
                title="가장 오래 읽은 책"
                book={processedStats.readingSpeed.slowest?.book ?? null}
                days={processedStats.readingSpeed.slowest?.days ?? null}
              />
            </div>
          </div>
        );
      case "genres":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartContainer
              title="완독한 책 장르"
              empty={processedStats.categoryData.length === 0}
              emptyText="다양한 장르의 책을 완독하여 차트를 채워보세요."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processedStats.categoryData.slice(0, 7)}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke={chartColors.gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: chartColors.textColor, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fill: chartColors.textColor, textAnchor: "end", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={chartColors.tooltip}
                    cursor={{
                      fill: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={chartColors.bar.categoryDist}
                    name="권"
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-dark-text-heading mb-4 sm:mb-6 tracking-tight">
                완독한 책 저자 Top 10
              </h3>
              <TopAuthors authorData={processedStats.authorData} />
            </div>
          </div>
        );
      case "wishlist":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartContainer
              title="읽고 싶은 책 장르"
              empty={processedStats.wishlist.categoryData.length === 0}
              emptyText="읽고 싶은 책을 추가해 취향을 분석해보세요."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processedStats.wishlist.categoryData.slice(0, 7)}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="0"
                    stroke={chartColors.gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: chartColors.textColor, fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fill: chartColors.textColor, textAnchor: "end", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={chartColors.tooltip}
                    cursor={{
                      fill: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={chartColors.bar.wishlist}
                    name="권"
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="bg-white dark:bg-dark-card p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-3xl shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-dark-text-heading mb-4 sm:mb-6 tracking-tight">
                읽고 싶은 책 저자 Top 10
              </h3>
              <TopAuthors authorData={processedStats.wishlist.authorData} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 bg-slate-50 dark:bg-dark-bg min-h-screen p-3 sm:p-4 md:p-6">
      <div className="bg-white dark:bg-dark-card p-2 sm:p-3 rounded-2xl sm:rounded-3xl shadow-sm flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
        <TabButton
          onClick={() => setActiveTab("overview")}
          active={activeTab === "overview"}
        >
          개요
        </TabButton>
        <TabButton
          onClick={() => setActiveTab("habits")}
          active={activeTab === "habits"}
        >
          독서 습관
        </TabButton>
        <TabButton
          onClick={() => setActiveTab("genres")}
          active={activeTab === "genres"}
        >
          장르 & 저자
        </TabButton>
        <TabButton
          onClick={() => setActiveTab("wishlist")}
          active={activeTab === "wishlist"}
        >
          위시리스트
        </TabButton>
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default StatsView;
