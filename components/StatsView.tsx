import React, { useMemo, useState } from "react";
import { BookWithReview, ReadingStatus } from "../types";
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

type Tab = "overview" | "habits" | "genres";
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
  <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm border border-border dark:border-dark-border">
    <h3 className="text-lg font-bold text-text-heading dark:text-dark-text-heading mb-4">
      {title}
    </h3>
    {empty ? (
      <p className="text-text-body dark:text-dark-text-body text-center py-10">
        {emptyText}
      </p>
    ) : (
      <div className="h-[300px] w-full">{children}</div>
    )}
  </div>
);

const StatCard: React.FC<{ title: string; value: string | number }> = ({
  title,
  value,
}) => (
  <div className="bg-white dark:bg-dark-card p-4 rounded-lg text-center shadow-sm border border-border dark:border-dark-border">
    <p className="text-sm font-semibold text-text-body dark:text-dark-text-body uppercase tracking-wider">
      {title}
    </p>
    <p className="text-3xl font-bold text-text-heading dark:text-dark-text-heading mt-1 truncate">
      {value}
    </p>
  </div>
);

const TopAuthors: React.FC<{ authorData: { name: string; count: number }[] }> = ({ authorData }) => {
  if (!authorData || authorData.length === 0) return null;

  return (
    <div className="space-y-2">
      {authorData.map((author, index) => (
        <div
          key={author.name}
          className="flex justify-between items-center bg-light-gray dark:bg-dark-bg p-2 rounded-md"
        >
          <p className="font-semibold text-text-heading dark:text-dark-text-heading">
            <span className="text-text-body dark:text-dark-text-body mr-2">
              {index + 1}.
            </span>
            {author.name}
          </p>
          <p className="font-bold text-text-heading dark:text-dark-text-heading">
            {author.count}
          </p>
        </div>
      ))}
    </div>
  );
};

const TimeRangeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
      active
        ? "bg-text-heading dark:bg-primary text-white dark:text-text-heading"
        : "text-text-body dark:text-dark-text-body hover:bg-light-gray dark:hover:bg-dark-bg"
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
    className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
      active
        ? "bg-text-heading dark:bg-primary text-white dark:text-text-heading"
        : "text-text-body dark:text-dark-text-body hover:bg-light-gray dark:hover:bg-dark-bg"
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
    [ReadingStatus.Reading]: '읽는 중',
    [ReadingStatus.Finished]: '완독',
    [ReadingStatus.Dropped]: '중단',
    [ReadingStatus.WantToRead]: '읽고 싶은',
  };

  const chartColors = {
    textColor: isDark ? "#D1D5DB" : "#475569",
    gridColor: isDark ? "#374151" : "#E2E8F0",
    tooltip: {
      backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
      borderColor: isDark ? "#374151" : "#E2E8F0",
    },
    pie: isDark
      ? ["#4ADE80", "#38BDF8", "#94A3B8", "#475569"]
      : ["#03314B", "#4ADE80", "#94A3B8", "#E2E8F0"],
    bar: {
      booksFinished: isDark ? "#4ADE80" : "#4ADE80",
      ratingDist: isDark ? "#A7F3D0" : "#03314B",
      categoryDist: isDark ? "#38BDF8" : "#475569",
    },
  };

  const processedStats = useMemo(() => {
    const stats = {
      totalBooks: books?.length || 0,
      totalFinished: 0,
      currentlyReading: 0,
      avgRating: "N/A",
      readingStatusData: [] as { name: string; value: number }[],
      ratingDistributionData: [] as { name: string; Count: number }[],
      monthlyData: [] as { name: string; Books: number }[],
      categoryData: [] as { name: string; value: number }[],
      authorData: [] as { name: string; count: number }[],
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

    books.forEach((book) => {
      const status = book.review?.status || ReadingStatus.WantToRead;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === ReadingStatus.Finished) {
        stats.totalFinished++;

        // Rating stats
        if (book.review?.rating && book.review.rating > 0) {
          const rating = Math.round(book.review.rating * 2) / 2;
          ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
          totalRating += book.review.rating;
          ratedBooksCount++;
        }

        // Monthly stats
        if (book.review?.end_date) {
          const date = new Date(book.review.end_date);
          if (!isNaN(date.getTime())) {
            const key = new Date(date.getFullYear(), date.getMonth()).getTime();
            monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
          }
        }

        // Category stats
        const category = book.category || "Uncategorized";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        
        // Author stats
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
      }

      if (status === ReadingStatus.Reading) {
        stats.currentlyReading++;
      }
    });

    // Finalize and format stats
    if (ratedBooksCount > 0) {
      stats.avgRating = (totalRating / ratedBooksCount).toFixed(1);
    }

    stats.readingStatusData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);

    stats.ratingDistributionData = Object.entries(ratingCounts)
      .map(([rating, count]) => ({ name: `${parseFloat(rating).toFixed(1)} ★`, Count: count }))
      .sort((a, b) => parseFloat(a.name) - parseFloat(b.name));

    const sortedMonthly = Array.from(monthlyMap.entries()).sort((a, b) => a[0] - b[0]);
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

    return stats;
  }, [books, timeRange]);

  if (books?.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-text-heading dark:text-dark-text-heading">
          통계 정보 없음
        </h2>
        <p className="text-text-body dark:text-dark-text-body mt-2">
          책을 추가하여 통계를 확인해보세요!
        </p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        const translatedReadingStatusData = processedStats.readingStatusData.map(item => ({
            ...item,
            name: readingStatusKorean[item.name as keyof typeof readingStatusKorean] || item.name
        }));

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="총 보유" value={processedStats.totalBooks} />
              <StatCard
                title="완독"
                value={processedStats.totalFinished}
              />
              <StatCard title="평균 별점" value={processedStats.avgRating} />
              <StatCard
                title="읽는 중"
                value={processedStats.currentlyReading}
              />
            </div>
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
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                  >
                    {translatedReadingStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors.pie[index % chartColors.pie.length]}
                      />
                    ))}
                    <Label
                      value={`${books?.length}권`}
                      position="center"
                      className="fill-text-heading dark:fill-dark-text-heading text-2xl font-bold"
                    />
                  </Pie>
                  <Tooltip contentStyle={chartColors.tooltip} />
                  <Legend wrapperStyle={{ color: chartColors.textColor }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        );
      case "habits":
        const timeRangeText = timeRange === 'all' ? '전체 기간' : `최근 ${timeRange}개월`;
        const chartTitle = `월별 완독 수 (${timeRangeText})`;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm border border-border dark:border-dark-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-text-heading dark:text-dark-text-heading">
                  {chartTitle}
                </h3>
                <div className="flex items-center space-x-2">
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
                <p className="text-text-body dark:text-dark-text-body text-center py-10">
                  책을 완독하여 월별 독서 기록을 시작하세요.
                </p>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={processedStats.monthlyData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartColors.gridColor}
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
                            : "rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="Books"
                        fill={chartColors.bar.booksFinished}
                        name="권"
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
                    strokeDasharray="3 3"
                    stroke={chartColors.gridColor}
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
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="Count"
                    fill={chartColors.bar.ratingDist}
                    name="권 수"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        );
      case "genres":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              title="장르 분포"
              empty={processedStats.categoryData.length === 0}
              emptyText="다양한 장르의 책을 완독하여 차트를 채워보세요."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processedStats.categoryData.slice(0, 7)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartColors.gridColor}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: chartColors.textColor }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: chartColors.textColor }}
                  />
                  <Tooltip
                    contentStyle={chartColors.tooltip}
                    cursor={{
                      fill: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill={chartColors.bar.categoryDist}
                    name="완독한 책"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-sm border border-border dark:border-dark-border">
              <h3 className="text-lg font-bold text-text-heading dark:text-dark-text-heading mb-4">
                상위 저자
              </h3>
              <TopAuthors authorData={processedStats.authorData} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-dark-card p-2 rounded-lg shadow-sm border border-border dark:border-dark-border flex items-center space-x-2">
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
      </div>
      <div>{renderContent()}</div>
    </div>
  );
};

export default StatsView;
