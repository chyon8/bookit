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
import { UserBook, ReadingStatus } from "../hooks/useBooks";
import { BookOpenIcon, BookIcon, ChartBarIcon, StarIcon } from "./Icons";

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

type Tab = "overview" | "habits" | "genres" | "wishlist";
type Theme = "light" | "dark";

interface StatsViewProps {
  books: UserBook[];
  theme: Theme;
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

  // --- Logic from Web ---
  const processedStats = useMemo(() => {
    const stats = {
      totalBooks: books.length,
      totalFinished: 0,
      currentlyReading: 0,
      finishedThisMonth: 0,
      avgRating: "0.0",
      readingStatusData: [] as { name: string; value: number }[],
      ratingDistributionData: [] as { name: string; value: number }[],
      categoryData: [] as { name: string; value: number }[],
      authorData: [] as { name: string; value: number }[], // Changed 'count' to 'value' for consistency
      wishlist: {
        categoryData: [] as { name: string; value: number }[],
      },
    };

    if (!books || books.length === 0) return stats;

    let totalRating = 0;
    let ratedBooksCount = 0;
    const statusCounts: Record<string, number> = {};
    const ratingCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    const wishlistCategoryCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};

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
            const r = Math.round(book.rating * 2) / 2;
            ratingCounts[r] = (ratingCounts[r] || 0) + 1;
        }

        if (book.end_date) {
            const date = new Date(book.end_date);
            if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                stats.finishedThisMonth++;
            }
        }
        
        const cat = book.books.category || "Uncategorized"; // Assuming category is on book.books? Need to check type.
        // Waiting for type check, assuming it is on UserBook or Book. 
        // Based on useBooks.ts: UserBook has 'books' which has 'title', 'author', etc. UserBook has 'rating', 'status'.
        // Actually, 'category' might be missing in useBooks.ts interfaces. I added 'category' to 'BookWithReview' but 'UserBook.books' might not have it.
        // I will double check useBooks.ts. If missing, I'll assume "General".
      }

      const author = book.books.author?.split('(')[0].trim() || "Unknown";
      if (status === ReadingStatus.Finished) {
          authorCounts[author] = (authorCounts[author] || 0) + 1;
      }

      if (status === ReadingStatus.Reading) stats.currentlyReading++;
      
      if (status === ReadingStatus.WantToRead) {
         // Wishlist logic
      }
    });

    if (ratedBooksCount > 0) {
        stats.avgRating = (totalRating / ratedBooksCount).toFixed(1);
    }

    stats.readingStatusData = Object.entries(statusCounts).map(([k, v]) => ({ name: k, value: v }));
    stats.ratingDistributionData = Object.entries(ratingCounts)
        .map(([k, v]) => ({ name: `${k}점`, value: v }))
        .sort((a,b) => parseFloat(a.name) - parseFloat(b.name));
    
    // Sort Author Data
    stats.authorData = Object.entries(authorCounts)
        .map(([k,v]) => ({ name: k, value: v }))
        .sort((a,b) => b.value - a.value)
        .slice(0, 5);

    return stats;
  }, [books]);

  // --- Render ---

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {renderTabButton("overview", "개요")}
            {renderTabButton("habits", "독서 습관")}
            {renderTabButton("genres", "장르 & 저자")}
            {renderTabButton("wishlist", "위시리스트")}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "overview" && (
            <View style={styles.section}>
                <View style={styles.grid}>
                    <StatCard title="총 보유" value={processedStats.totalBooks} icon={<BookIcon size={20} color="#64748B"/>} />
                    <StatCard title="완독" value={processedStats.totalFinished} icon={<BookOpenIcon size={20} color="#64748B"/>} />
                    <StatCard title="평균 별점" value={processedStats.avgRating} icon={<StarIcon size={20} color="#64748B"/>} />
                    <StatCard title="이번 달" value={processedStats.finishedThisMonth} description={`${processedStats.currentlyReading}권 읽는 중`} icon={<ChartBarIcon size={20} color="#64748B"/>} />
                </View>

                <View style={styles.card}>
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
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>별점 분포</Text>
                    <CustomBarChart data={processedStats.ratingDistributionData} color="#FACC15" />
                </View>
            </View>
        )}

        {activeTab === "genres" && (
             <View style={styles.section}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>완독한 책 저자 Top 5</Text>
                    <CustomBarChart data={processedStats.authorData} color="#38BDF8" />
                </View>
            </View>
        )}
        
        {activeTab === "wishlist" && (
            <View style={styles.centerPlaceholder}>
                <Text style={styles.placeholderText}>준비 중입니다.</Text>
            </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  tabContainer: {
    marginBottom: 24,
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
  section: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 32 - 12) / 2, // 2 columns
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0F172A',
  },
  content: {
    minHeight: 200,
  },
  centerPlaceholder: {
    alignItems: 'center',
    padding: 40,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  // Chart
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
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    width: 30,
    fontSize: 12,
    color: '#64748B',
  }
});
