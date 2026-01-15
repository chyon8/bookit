import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { UserBook } from '../../hooks/useBooks';
import { HeartFilledIcon } from '../Icons';

type FavoriteTab = 'all' | 'quotes' | 'memos';

interface FavoriteItem {
  type: 'quote' | 'memo';
  content: string;
  book: UserBook;
  createdAt?: string;
}

interface FavoritesSectionProps {
  books: UserBook[];
}

export function FavoritesSection({ books }: FavoritesSectionProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FavoriteTab>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  // Collect all favorite quotes and memos from all books
  const allFavorites = useMemo(() => {
    const favorites: FavoriteItem[] = [];
    
    books.forEach(book => {
      // Collect favorite quotes
      book.memorable_quotes?.forEach((quote) => {
        if (quote.isFavorite) {
          favorites.push({
            type: 'quote',
            content: quote.quote,
            book,
            createdAt: quote.date,
          });
        }
      });

      // Collect favorite memos
      book.memos?.forEach((memo) => {
        if (memo.isFavorite) {
          favorites.push({
            type: 'memo',
            content: memo.text,
            book,
            createdAt: memo.createdAt,
          });
        }
      });
    });

    // Sort by time (recent first)
    return favorites.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [books]);

  // Filter by active tab
  const filteredFavorites = useMemo(() => {
    if (activeTab === 'all') return allFavorites;
    if (activeTab === 'quotes') return allFavorites.filter(f => f.type === 'quote');
    return allFavorites.filter(f => f.type === 'memo');
  }, [allFavorites, activeTab]);

  // Counts for tabs
  const counts = useMemo(() => ({
    all: allFavorites.length,
    quotes: allFavorites.filter(f => f.type === 'quote').length,
    memos: allFavorites.filter(f => f.type === 'memo').length,
  }), [allFavorites]);

  // Reset pagination when tab changes
  const handleTabChange = (tab: FavoriteTab) => {
    setActiveTab(tab);
    setVisibleCount(10);
  };

  // Paginated items
  const displayedItems = filteredFavorites.slice(0, visibleCount);
  const hasMore = filteredFavorites.length > visibleCount;

  if (allFavorites.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
        <HeartFilledIcon size={40} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          아직 즐겨찾기한 내용이 없어요
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          인용구나 메모에서 하트를 눌러{'\n'}즐겨찾기에 추가해보세요
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: isDark ? colors.border : '#F1F5F9' },
            activeTab === 'all' && { backgroundColor: isDark ? colors.primary : '#1E293B' }
          ]}
          onPress={() => handleTabChange('all')}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textMuted },
            activeTab === 'all' && { color: isDark ? '#000' : '#FFF' }
          ]}>
            전체 ({counts.all})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: isDark ? colors.border : '#F1F5F9' },
            activeTab === 'quotes' && { backgroundColor: '#8B5CF6' }
          ]}
          onPress={() => handleTabChange('quotes')}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textMuted },
            activeTab === 'quotes' && { color: '#FFF' }
          ]}>
            인용구 ({counts.quotes})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            { backgroundColor: isDark ? colors.border : '#F1F5F9' },
            activeTab === 'memos' && { backgroundColor: '#3B82F6' }
          ]}
          onPress={() => handleTabChange('memos')}
        >
          <Text style={[
            styles.tabText,
            { color: colors.textMuted },
            activeTab === 'memos' && { color: '#FFF' }
          ]}>
            메모 ({counts.memos})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {displayedItems.map((item, index) => (
          <TouchableOpacity
            key={`${item.book.id}-${item.type}-${index}`}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/book-record/${item.book.book_id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.typeLabel, { 
                color: item.type === 'quote' ? '#8B5CF6' : '#3B82F6',
                backgroundColor: isDark 
                  ? (item.type === 'quote' ? '#5B21B61A' : '#1E40AF1A')
                  : (item.type === 'quote' ? '#EDE9FE' : '#DBEAFE')
              }]}>
                {item.type === 'quote' ? '인용구' : '메모'}
              </Text>
              <HeartFilledIcon size={14} color="#EF4444" />
            </View>
            
            <Text 
              style={[styles.content, { color: colors.text }]}
              numberOfLines={3}
            >
              {item.content}
            </Text>
            
            <Text style={[styles.bookTitle, { color: colors.textMuted }]} numberOfLines={1}>
              📖 {item.book.books.title}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <TouchableOpacity
            style={[styles.loadMoreButton, { borderColor: colors.border }]}
            onPress={() => setVisibleCount(prev => prev + 10)}
          >
            <Text style={[styles.loadMoreText, { color: colors.textMuted }]}>
              더보기 ({filteredFavorites.length - visibleCount}개 남음)
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  bookTitle: {
    fontSize: 12,
  },
  loadMoreButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    margin: 16,
    borderRadius: 16,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
