import React, { useMemo, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { G, Circle, Path } from 'react-native-svg';
import { UserBook, ReadingStatus } from "../hooks/useBooks";
import { BookOpenIcon, BookIcon, ChartBarIcon, StarIcon } from "./Icons";
import ReadingCalendar from "./statistics/ReadingCalendar";
import MonthlyCompletionChart from "./statistics/MonthlyCompletionChart";
import StarDistributionChart from "./statistics/StarDistributionChart";
import GenreChart from "./statistics/GenreChart";
import TopAuthorsList from "./statistics/TopAuthorsList";
import WishlistGenreChart from "./statistics/WishlistGenreChart";
import WishlistAuthorChart from "./statistics/WishlistAuthorChart";

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

type Tab = "overview" | "habits" | "genres" | "wishlist";

interface StatsViewProps {
  books: UserBook[];
}

// --- Components ---

import { useTheme } from "../context/ThemeContext";

const StatCard = ({ title, value, description, icon }: { title: string, value: string | number, description?: string, icon?: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={styles.statCardHeader}>
        <Text style={[styles.statCardTitle, { color: colors.textMuted }]}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <View style={styles.statCardContent}>
        <Text style={[styles.statCardValue, { color: colors.text }]}>{value}</Text>
        {description && <Text style={[styles.statCardDesc, { color: colors.textMuted }]}>{description}</Text>}
      </View>
    </View>
  );
};

const DonutChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
  const { colors, isDark } = useTheme();
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const size = 150; // Reduced from 200
  const strokeWidth = 20; // Reduced from 25
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90; // Start from top

  return (
    <View style={styles.donutContainer}>
      <View style={styles.donutWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation={0} origin={`${center}, ${center}`}>
            {data.map((item, index) => {
              const percentage = item.value / (total || 1);
              const angle = percentage * 360;

              const x1 = center + radius * Math.cos((currentAngle * Math.PI) / 180);
              const y1 = center + radius * Math.sin((currentAngle * Math.PI) / 180);

              currentAngle += angle;

              const x2 = center + radius * Math.cos((currentAngle * Math.PI) / 180);
              const y2 = center + radius * Math.sin((currentAngle * Math.PI) / 180);

              const largeArcFlag = percentage > 0.5 ? 1 : 0;
              const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

              if (percentage === 1) {
                  return (
                    <Circle
                        key={index}
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                  )
              }

              if (percentage === 0) return null;

              return (
                <Path
                  key={index}
                  d={d}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={[styles.donutTotal, { color: colors.text }]}>{total}</Text>
          <Text style={[styles.donutLabel, { color: colors.textMuted }]}>전체 도서</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>{item.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// --- Main Component ---

export default function StatsView({ books }: StatsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const processedStats = useMemo(() => {
    const stats = {
      totalBooks: books.length,
      totalFinished: 0,
      currentlyReading: 0,
      finishedThisMonth: 0,
      avgRating: "0.0",
      readingStatusData: [] as { name: string; value: number }[],
    };

    if (!books || books.length === 0) return stats;

    let totalRating = 0;
    let ratedBooksCount = 0;
    const statusCounts: Record<string, number> = {};

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    books.forEach((book) => {
      const status = book.status || ReadingStatus.WantToRead;
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (status === ReadingStatus.Finished) {
        stats.totalFinished++;

        if (book.rating && book.rating > 0) {
            totalRating += book.rating;
            ratedBooksCount++;
        }

        if (book.end_date) {
            const date = new Date(book.end_date);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                stats.finishedThisMonth++;
            }
        }
      }

      if (status === ReadingStatus.Reading) stats.currentlyReading++;
    });

    if (ratedBooksCount > 0) {
        stats.avgRating = (totalRating / ratedBooksCount).toFixed(1);
    }

    stats.readingStatusData = Object.entries(statusCounts).map(([k, v]) => ({ name: k, value: v }));

    return stats;
  }, [books]);

  const renderTabButton = (tab: Tab, label: string) => (
    <TouchableOpacity 
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
      }}
      style={[
        styles.tabButton, 
        { backgroundColor: isDark ? colors.border : '#F1F5F9' },
        activeTab === tab && { backgroundColor: isDark ? colors.primary : '#1E293B' }
      ]}
    >
        <Text style={[
          styles.tabText, 
          { color: colors.textMuted },
          activeTab === tab && { color: isDark ? '#000000' : '#FFFFFF' }
        ]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tab Navigation */}
      <View style={[styles.tabContainerWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={styles.tabContentContainer}>
              {renderTabButton("overview", "개요")}
              {renderTabButton("habits", "독서 습관")}
              {renderTabButton("genres", "장르 & 저자")}
              {renderTabButton("wishlist", "위시리스트")}
          </ScrollView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: 100 + insets.bottom }]}
      >
        {activeTab === "overview" && (
            <View style={styles.section}>
                <View style={styles.grid}>
                    <StatCard title="총 보유" value={processedStats.totalBooks} icon={<BookIcon size={20} color={colors.textMuted}/>} />
                    <StatCard title="완독" value={processedStats.totalFinished} icon={<BookOpenIcon size={20} color={colors.textMuted}/>} />
                    <StatCard title="평균 별점" value={processedStats.avgRating} icon={<StarIcon size={20} color={colors.textMuted}/>} />
                    <StatCard title="이번 달" value={processedStats.finishedThisMonth} description={`${processedStats.currentlyReading}권 읽는 중`} icon={<ChartBarIcon size={20} color={colors.textMuted}/>} />
                </View>

                <View style={[styles.simpleCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>내 서재 현황</Text>
                     <DonutChart 
                        data={processedStats.readingStatusData.map(d => ({
                            name: d.name === "Reading" ? "읽는 중" : 
                                  d.name === "Finished" ? "완독" : 
                                  d.name === "Want to Read" ? "읽고 싶은" : 
                                  d.name === "Dropped" ? "중단" : d.name,
                            value: d.value,
                            color: d.name === "Finished" ? (isDark ? "#4ADE80" : "#334155") :
                                   d.name === "Want to Read" ? (isDark ? "#94A3B8" : "#94A3B8") :
                                   d.name === "Reading" ? "#22C55E" :
                                   d.name === "Dropped" ? (isDark ? "#334155" : "#CBD5E1") : colors.border
                        }))} 
                    />
                </View>
            </View>
        )}

        {activeTab === "habits" && (
            <View style={styles.section}>
                <ReadingCalendar books={books} />
                <MonthlyCompletionChart books={books} />
                <StarDistributionChart books={books} />
            </View>
        )}

        {activeTab === "genres" && (
             <View style={styles.section}>
                <GenreChart books={books} />
                <TopAuthorsList books={books} />
            </View>
        )}
        
        {activeTab === "wishlist" && (
             <View style={styles.section}>
                <WishlistGenreChart books={books} />
                <WishlistAuthorChart books={books} />
            </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainerWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tabContainer: {
    paddingHorizontal: 16,
  },
  tabContentContainer: {
    paddingRight: 32,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontWeight: '600',
  },
  scrollContentContainer: {
    padding: 16,
  },
  section: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 32 - 12) / 2,
    borderRadius: 20,
    padding: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 90,
    justifyContent: 'center',
    gap: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  statCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    opacity: 0.08,
    transform: [{ scale: 1.8 }],
  },
  statCardContent: {
    alignItems: 'center',
    paddingTop: 0,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statCardDesc: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  simpleCard: {
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  donutWrapper: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutTotal: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 0,
  },
  donutLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  legend: {
    marginLeft: 16,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '500',
  },
});
