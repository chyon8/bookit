import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  ActivityIndicator, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Alert
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBooks, ReadingStatus, UserBook } from "../../hooks/useBooks";
import { BookCard } from "../../components/BookCard";
import { HorizontalBookCard } from "../../components/HorizontalBookCard";
import { Stack, useRouter } from "expo-router";
import { BookSearchLoading } from "../../components/BookSearchLoading";
import { SearchIcon, XMarkIcon, SparklesIcon, ChevronDownIcon, TrashIcon } from "../../components/Icons";
import { RandomNoteModal, Note } from "../../components/RandomNoteModal";
import { FilterSheet, SortOption } from "../../components/FilterSheet";
import { useDeleteBook } from "../../hooks/useBookData";
import { ConfirmModal } from "../../components/ConfirmModal";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 44) / 2; // 2 columns: (Screen - 32px padding - 12px gap) / 2

import { useTheme } from "../../context/ThemeContext";

export default function Home() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: userBooks, isLoading, error } = useBooks();
  const deleteBookMutation = useDeleteBook();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "All">("All");

  const [isRandomNoteModalOpen, setRandomNoteModalOpen] = useState(false);
  const [shuffledNotes, setShuffledNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  const [visibleCount, setVisibleCount] = useState(12);

  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isVisible: false,
    title: "",
    message: "",
    onConfirm: () => {},
    bookId: "",
  });

  const closeConfirmModal = () => {
    setConfirmModalConfig(prev => ({ ...prev, isVisible: false }));
  };

  const filterOptions = ["All", ReadingStatus.Reading, ReadingStatus.Finished, ReadingStatus.WantToRead] as const;
  
  // Sub-filter for Finished tab (완독 vs 중단)
  const [subFilter, setSubFilter] = useState<"Finished" | "Dropped">("Finished");

  const readingStatusKorean: Record<string, string> = {
    All: "전체",
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
    [ReadingStatus.WantToRead]: "읽고 싶은",
  };

  // Reset visibleCount when filter changes
  useMemo(() => {
    setVisibleCount(12);
  }, [statusFilter, searchQuery]);

  // Calculate counts for each status
  const statusCounts = useMemo(() => {
    if (!userBooks) return { All: 0, Reading: 0, Finished: 0, Dropped: 0, WantToRead: 0 };
    
    const counts: Record<string, number> = {
      All: userBooks.length,
      [ReadingStatus.Reading]: 0,
      [ReadingStatus.Finished]: 0,
      [ReadingStatus.Dropped]: 0,
      [ReadingStatus.WantToRead]: 0,
    };
    
    for (const book of userBooks) {
      if (book.status) {
        counts[book.status] = (counts[book.status] || 0) + 1;
      }
    }
    return counts;
  }, [userBooks]);

  // Extract Genres
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filters, setFilters] = useState<{
    sort: SortOption;
    reread: boolean | null;
    month: string | null;
    year: string | null;
    genre: string | null;
  }>({
    sort: "date_desc",
    reread: null,
    month: null,
    year: null,
    genre: null
  });

  // Extract Genres
  const genres = useMemo(() => {
    if (!userBooks) return [];
    const g = new Set<string>();
    userBooks.forEach(b => {
        if (b.books.category) g.add(b.books.category);
    });
    return Array.from(g);
  }, [userBooks]);

  // Filter books logic
  const filteredBooksAll = useMemo(() => {
    if (!userBooks) return [];
    
    let result = userBooks.filter(book => {
      // 1. Status Filter
      if (statusFilter === "Finished") {
        // Apply sub-filter for 완독 vs 중단
        if (subFilter === "Finished" && book.status !== ReadingStatus.Finished) return false;
        if (subFilter === "Dropped" && book.status !== ReadingStatus.Dropped) return false;
      } else if (statusFilter !== "All" && book.status !== statusFilter) {
        return false;
      }
      
      // 2. Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        
        // Check title and author
        const basicMatch = 
          book.books.title.toLowerCase().includes(query) || 
          book.books.author?.toLowerCase().includes(query);
        
        if (basicMatch) return true;

        // Check one-line review
        if (book.one_line_review?.toLowerCase().includes(query)) return true;

        // Check overall impression
        if (book.overall_impression?.toLowerCase().includes(query)) return true;

        // Check memos
        if (book.memos?.some(memo => memo.text.toLowerCase().includes(query))) return true;

        // Check memorable quotes
        if (book.memorable_quotes?.some(mq => 
          mq.quote.toLowerCase().includes(query) || 
          mq.thought.toLowerCase().includes(query)
        )) return true;

        return false;
      }

      // 3. Detailed Filters
      if (filters.reread && !book.reread_will) return false;
      if (filters.genre && book.books.category !== filters.genre) return false;
      if (filters.month && book.end_date) {
         const date = new Date(book.end_date);
         if ((date.getMonth() + 1).toString() !== filters.month) return false;
      }
      if (filters.year && book.end_date) {
         const date = new Date(book.end_date);
         if (date.getFullYear().toString() !== filters.year) return false;
      }

      return true;
    });

    // 4. Sort
    result.sort((a, b) => {
        switch (filters.sort) {
            case "date_asc":
                return new Date(a.start_date || a.books.id).getTime() - new Date(b.start_date || b.books.id).getTime();
            case "date_desc":
                return new Date(b.start_date || b.books.id).getTime() - new Date(a.start_date || a.books.id).getTime();
            case "rating_desc": 
                return (b.rating || 0) - (a.rating || 0);
            case "rating_asc":
                return (a.rating || 0) - (b.rating || 0);
            case "title_asc":
                return a.books.title.localeCompare(b.books.title);
            default:
                return 0;
        }
    });

    return result;
  }, [userBooks, statusFilter, subFilter, searchQuery, filters]);

  // Group books for "All" view (using filtered list)
  const groupedBooks = useMemo(() => {
    if (statusFilter !== "All" || !filteredBooksAll) return null;
    
    const groups: Record<string, UserBook[]> = {};
    for (const book of filteredBooksAll) {
      const status = book.status;
      if (status) {
        if (!groups[status]) groups[status] = [];
        groups[status].push(book);
      }
    }
    return groups;
  }, [filteredBooksAll, statusFilter]);

  // Sliced books for pagination
  const displayedBooks = useMemo(() => {
     return filteredBooksAll.slice(0, visibleCount);
  }, [filteredBooksAll, visibleCount]);

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <BookSearchLoading message="서재를 불러오고 있어요" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>Failed to load books</Text>
        <Text style={[styles.errorMessage, { color: colors.textMuted }]}>{String(error)}</Text>
      </View>
    );
  }

  const handleShowRandomNote = () => {
    if (!userBooks || userBooks.length === 0) return;

    const allNotes: Note[] = userBooks.flatMap((book) => {
      const notes: { title: string; content: string }[] = [];

      if (book.one_line_review) {
        notes.push({ title: "한줄평", content: book.one_line_review });
      }
      if (book.memos && Array.isArray(book.memos)) {
        book.memos.forEach((memo, index) => {
          if (memo) notes.push({ title: `메모 #${index + 1}`, content: memo.text });
        });
      }
      if (book.memorable_quotes && Array.isArray(book.memorable_quotes)) {
        book.memorable_quotes.forEach((quoteObj) => {
          if (quoteObj?.quote) {
            let content = `"${quoteObj.quote}"`;
            if (quoteObj.thought) content += `\n\n- 나의 생각: ${quoteObj.thought}`;
            notes.push({ title: `인상 깊은 구절 (p.${quoteObj.page || "?"})`, content });
          }
        });
      }

      return notes
        .filter(n => n.content?.trim())
        .map(note => ({ book, note }));
    });

    if (allNotes.length === 0) return;

    // Fisher-Yates shuffle
    for (let i = allNotes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allNotes[i], allNotes[j]] = [allNotes[j], allNotes[i]];
    }

    setShuffledNotes(allNotes);
    setCurrentNoteIndex(0);
    setRandomNoteModalOpen(true);
  };

  const handleBookPress = (book: UserBook) => {
    router.push(`/book-record/${book.book_id}`);
  };

  const handleDeleteBook = (id: string, title: string) => {
    setConfirmModalConfig({
        isVisible: true,
        title: "기록 삭제",
        message: `"${title}" 기록을 정말 삭제하시겠습니까?`,
        bookId: id,
        onConfirm: async () => {
            try {
                await deleteBookMutation.mutateAsync(id);
                closeConfirmModal();
                // Badge update will happen automatically due to cache invalidation in hook
            } catch (e) {
                Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
                closeConfirmModal();
            }
        }
    });
  };

  const renderHorizontalBookCard = (book: UserBook) => (
    <HorizontalBookCard 
      key={book.id}
      book={book}
      onPress={handleBookPress}
      onDelete={handleDeleteBook}
    />
  );

  const renderBookSection = (title: string, books: UserBook[] | undefined, status: ReadingStatus) => {
    if (!books || books.length === 0) return null;
    const limitedBooks = books.slice(0, 10);

    return (
      <View key={status} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title} <Text style={[styles.sectionCount, { color: colors.textMuted }]}>{books.length}</Text>
          </Text>
          {books.length > 10 && (
            <TouchableOpacity onPress={() => setStatusFilter(status)}>
              <Text style={styles.showAllButton}>전체보기</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {limitedBooks.map(renderHorizontalBookCard)}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.flex1}>
        <ScrollView style={styles.flex1} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
          
          {/* Search Bar & Random Button */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputWrapper, { borderBottomColor: colors.border }]}>
              <SearchIcon size={20} color={colors.textMuted} />
              <TextInput 
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="기록 검색..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <XMarkIcon size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              onPress={handleShowRandomNote}
              style={[styles.sparklesButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}
            >
              <SparklesIcon size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={[styles.filterTabsContainer, { borderBottomColor: colors.border }]}>
            {filterOptions.map((status) => {
              const isActive = statusFilter === status;
              const count = statusCounts[status] || 0;
              return (
                <TouchableOpacity 
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={[
                    styles.filterTab,
                    isActive && { borderBottomColor: colors.primary }
                  ]}
                >
                  <Text 
                    style={[
                      styles.filterTabText,
                      { color: colors.textMuted },
                      isActive && { color: colors.primary, fontWeight: 'bold' }
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {readingStatusKorean[status]} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sub-Tabs for 완독 Tab (완독/중단) */}
          {statusFilter === "Finished" && (
            <View style={styles.subTabsContainer}>
              <TouchableOpacity 
                onPress={() => setSubFilter("Finished")}
                style={[
                  styles.subTab, 
                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                  subFilter === "Finished" && { backgroundColor: isDark ? '#14532D' : '#DCFCE7', borderColor: colors.primary }
                ]}
              >
                <Text style={[
                  styles.subTabText,
                  { color: colors.textMuted },
                  subFilter === "Finished" && { color: isDark ? colors.primary : '#15803D', fontWeight: 'bold' }
                ]}>
                  완독 ({statusCounts[ReadingStatus.Finished] || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setSubFilter("Dropped")}
                style={[
                  styles.subTab, 
                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                  subFilter === "Dropped" && { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2', borderColor: '#EF4444' }
                ]}
              >
                <Text style={[
                  styles.subTabText,
                  { color: colors.textMuted },
                  subFilter === "Dropped" && { color: isDark ? '#F87171' : '#DC2626', fontWeight: 'bold' }
                ]}>
                  중단 ({statusCounts[ReadingStatus.Dropped] || 0})
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.secondaryFilterContainer}>
            <TouchableOpacity 
                style={[
                  styles.filterButton, 
                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                  (filters.month || filters.year || filters.reread || filters.genre) && { borderColor: colors.primary, borderWidth: 1 }
                ]}
                onPress={() => setFilterSheetVisible(true)}
            >
              <Text style={[
                styles.filterButtonText, 
                { color: (filters.month || filters.year || filters.reread || filters.genre) ? colors.primary : colors.text }
              ]}>
                필터 및 정렬 · {
                  filters.sort === "date_desc" ? "최신순" : 
                  filters.sort === "date_asc" ? "오래된순" : 
                  filters.sort === "rating_desc" ? "별점순" : 
                  filters.sort === "rating_asc" ? "낮은별점순" : "제목순"
                }
              </Text>
              <ChevronDownIcon size={16} color={(filters.month || filters.year || filters.reread || filters.genre) ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {statusFilter === "All" && !searchQuery.trim() && groupedBooks ? (
            <View style={styles.sectionsContainer}>
              {renderBookSection("읽는 중", groupedBooks[ReadingStatus.Reading], ReadingStatus.Reading)}
              {renderBookSection("읽고 싶은", groupedBooks[ReadingStatus.WantToRead], ReadingStatus.WantToRead)}
              {renderBookSection("완독", groupedBooks[ReadingStatus.Finished], ReadingStatus.Finished)}
              {renderBookSection("중단", groupedBooks[ReadingStatus.Dropped], ReadingStatus.Dropped)}
            </View>
          ) : (
            <View>
              <View style={styles.gridContainer}>
                {displayedBooks.map((book) => (
                  <View key={book.id} style={styles.gridItem}>
                    <BookCard 
                      book={book} 
                      showStatusBadge={false} 
                      onSelect={handleBookPress}
                      onDelete={handleDeleteBook}
                    />
                  </View>
                ))}
              </View>
              
              {filteredBooksAll.length > visibleCount && (
                <View style={styles.loadMoreContainer}>
                   <TouchableOpacity 
                     onPress={() => setVisibleCount(prev => prev + 12)}
                     style={styles.loadMoreButton}
                   >
                     <Text style={styles.loadMoreText}>더보기</Text>
                   </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {filteredBooksAll.length === 0 && statusFilter !== "All" && (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>책장이 비어있습니다</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>검색 탭을 이용해 첫 책을 추가해보세요!</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <RandomNoteModal 
        isVisible={isRandomNoteModalOpen}
        onClose={() => setRandomNoteModalOpen(false)}
        currentNote={shuffledNotes[currentNoteIndex] || null}
        onNext={() => setCurrentNoteIndex((prev) => (prev + 1) % shuffledNotes.length)}
        onPrev={() => setCurrentNoteIndex((prev) => (prev - 1 + shuffledNotes.length) % shuffledNotes.length)}
        currentIndex={currentNoteIndex}
        totalNotes={shuffledNotes.length}
      />

      <FilterSheet 
        visible={filterSheetVisible} 
        onClose={() => setFilterSheetVisible(false)}
        initialFilters={filters}
        onApply={setFilters}
        genres={genres}
      />

      <ConfirmModal
        isVisible={confirmModalConfig.isVisible}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={closeConfirmModal}
        confirmText="삭제"
        isDestructive={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sparklesButton: {
    padding: 8,
    borderRadius: 20,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
  },
  filterTabText: {
    fontSize: 12,
  },
  filterTabTextActive: {
    fontWeight: 'bold',
  },
  subTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  subTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subTabActive: {
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subTabTextActive: {
    fontWeight: 'bold',
  },
  secondaryFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionsContainer: {
    gap: 24,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  showAllButton: {
    fontSize: 12,
    color: '#6B7280',
  },
  horizontalScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  loadMoreButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
});
