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
import { SafeAreaView } from "react-native-safe-area-context";
import { UserBook, ReadingStatus } from "../hooks/useBooks";
import { BookOpenIcon, BookIcon, ChartBarIcon, StarIcon } from "./Icons";
import ReadingCalendar from "./statistics/ReadingCalendar";
import MonthlyCompletionChart from "./statistics/MonthlyCompletionChart";
import StarDistributionChart from "./statistics/StarDistributionChart";
import GenreChart from "./statistics/GenreChart";
import TopAuthorsList from "./statistics/TopAuthorsList";

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
  theme: "light" | "dark";
}

// --- Components ---

const StatCard = ({ title, value, description, icon }: { title: string, value: string | number, description?: string, icon?: React.ReactNode }) => (
  <View style={styles.statCard}>
    <View style={styles.statCardHeader}>
         <Text style={styles.statCardTitle}>{title}</Text>
         {icon && <View style={styles.iconContainer}>{icon}</View>}
    </View>
    <Text style={styles.statCardValue}>{value}</Text>
    {description && <Text style={styles.statCardDesc}>{description}</Text>}
  </View>
);

const CustomBarChart = ({ data, color }: { data: { name: string; value: number }[], color: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.chartContainer}>
      {data.map((item, index) => (
        <View key={index} style={styles.barRow}>
          <Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar, 
                { 
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: color 
                }
              ]} 
            />
          </View>
          <Text style={styles.barValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

// --- Main Component ---

export default function StatsView({ books, theme }: StatsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
    >
        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainerWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer} contentContainerStyle={styles.tabContentContainer}>
              {renderTabButton("overview", "개요")}
              {renderTabButton("habits", "독서 습관")}
              {renderTabButton("genres", "장르 & 저자")}
              {renderTabButton("wishlist", "위시리스트")}
          </ScrollView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {activeTab === "overview" && (
            <View style={styles.section}>
                <View style={styles.grid}>
                    <StatCard title="총 보유" value={processedStats.totalBooks} icon={<BookIcon size={20} color="#64748B"/>} />
                    <StatCard title="완독" value={processedStats.totalFinished} icon={<BookOpenIcon size={20} color="#64748B"/>} />
                    <StatCard title="평균 별점" value={processedStats.avgRating} icon={<StarIcon size={20} color="#64748B"/>} />
                    <StatCard title="이번 달" value={processedStats.finishedThisMonth} description={`${processedStats.currentlyReading}권 읽는 중`} icon={<ChartBarIcon size={20} color="#64748B"/>} />
                </View>

                <View style={styles.simpleCard}>
                    <Text style={styles.cardTitle}>내 서재 현황</Text>
                     <CustomBarChart 
                        data={processedStats.readingStatusData.map(d => ({
                            ...d,
                            name: d.name === "Reading" ? "읽는 중" : 
                                  d.name === "Finished" ? "완독" : 
                                  d.name === "Want to Read" ? "읽고 싶은" : d.name
                        }))} 
                        color="#4ADE80" 
                    />
                </View>
            </View>
        )}

        {activeTab === "habits" && (
            <View style={styles.section}>
                <ReadingCalendar books={books} theme={theme} />
                <MonthlyCompletionChart books={books} theme={theme} />
                <StarDistributionChart books={books} theme={theme} />
            </View>
        )}

        {activeTab === "genres" && (
             <View style={styles.section}>
                <GenreChart books={books} theme={theme} />
                <TopAuthorsList books={books} theme={theme} />
            </View>
        )}
        
        {activeTab === "wishlist" && (
            <View style={styles.centerPlaceholder}>
                <Text style={styles.placeholderText}>준비 중입니다.</Text>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabContainerWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  activeTabButton: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    color: '#64748B',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 40,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCardTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  iconContainer: {
    opacity: 0.5,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statCardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  simpleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32, // Matches new components
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
    color: '#1E293B',
  },
  centerPlaceholder: {
    alignItems: 'center',
    padding: 100,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  chartContainer: {
    gap: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 60,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  barWrapper: {
    flex: 1,
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 6,
  },
  barValue: {
    width: 30,
    fontSize: 12,
    color: '#64748B',
  }
});
