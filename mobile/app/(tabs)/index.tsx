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
  Dimensions
} from "react-native";
import { useBooks, ReadingStatus, UserBook } from "../../hooks/useBooks";
import { BookCard } from "../../components/BookCard";
import { Stack, useRouter } from "expo-router";
import { SearchIcon, XMarkIcon, SparklesIcon, ChevronDownIcon } from "../../components/Icons";
import { RandomNoteModal, Note } from "../../components/RandomNoteModal";

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 44) / 2; // 2 columns: (Screen - 32px padding - 12px gap) / 2

export default function Home() {
  const router = useRouter();
  const { data: userBooks, isLoading, error } = useBooks();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | "All">("All");

  const [isRandomNoteModalOpen, setRandomNoteModalOpen] = useState(false);
  const [shuffledNotes, setShuffledNotes] = useState<Note[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);

  const [visibleCount, setVisibleCount] = useState(12);

  const filterOptions = ["All", ReadingStatus.Reading, ReadingStatus.Finished, ReadingStatus.WantToRead] as const;
  
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

  // Group books for "All" view
  const groupedBooks = useMemo(() => {
    if (statusFilter !== "All" || !userBooks) return null;
    
    const groups: Record<string, UserBook[]> = {};
    for (const book of userBooks) {
      const status = book.status;
      if (status) {
        if (!groups[status]) groups[status] = [];
        groups[status].push(book);
      }
    }
    return groups;
  }, [userBooks, statusFilter]);

  // Filter books logic
  const filteredBooksAll = useMemo(() => {
    if (!userBooks) return [];
    return userBooks.filter(book => {
      if (statusFilter !== "All" && book.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return book.books.title.toLowerCase().includes(query) || 
               book.books.author?.toLowerCase().includes(query);
      }
      return true;
    });
  }, [userBooks, statusFilter, searchQuery]);

  // Sliced books for pagination
  const displayedBooks = useMemo(() => {
     return filteredBooksAll.slice(0, visibleCount);
  }, [filteredBooksAll, visibleCount]);

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

  const renderHorizontalBookCard = (book: UserBook) => (
    <TouchableOpacity 
      key={book.id} 
      style={styles.horizontalCard}
      onPress={() => handleBookPress(book)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: book.books.cover_image_url }}
          style={styles.bookImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.bookTitle} numberOfLines={2}>{book.books.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {book.books.author?.split("(지은이")[0].trim()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBookSection = (title: string, books: UserBook[] | undefined, status: ReadingStatus) => {
    if (!books || books.length === 0) return null;
    const limitedBooks = books.slice(0, 10);

    return (
      <View key={status} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {title} <Text style={styles.sectionCount}>{books.length}</Text>
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

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4ADE80" />
        <Text style={styles.loadingText}>Loading your library...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Failed to load books</Text>
        <Text style={styles.errorMessage}>{String(error)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex1}>
        <ScrollView style={styles.flex1} contentContainerStyle={styles.scrollContent}>
          
          {/* Search Bar & Random Button */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <SearchIcon size={20} color="#9CA3AF" />
              <TextInput 
                style={styles.searchInput}
                placeholder="기록 검색..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <XMarkIcon size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              onPress={handleShowRandomNote}
              style={styles.sparklesButton}
            >
              <SparklesIcon size={20} color="#4ADE80" />
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabsContainer}>
            {filterOptions.map((status) => {
              const isActive = statusFilter === status;
              const count = statusCounts[status] || 0;
              return (
                <TouchableOpacity 
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={[
                    styles.filterTab,
                    isActive && styles.filterTabActive
                  ]}
                >
                  <Text 
                    style={[
                      styles.filterTabText,
                      isActive && styles.filterTabTextActive
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

          {/* Secondary Filter Buttons */}
          <View style={styles.secondaryFilterContainer}>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>초기화</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>상세 필터</Text>
              <ChevronDownIcon size={16} color="#4B5563" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterButtonText}>최신 추가순</Text>
              <ChevronDownIcon size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {statusFilter === "All" && groupedBooks ? (
            <View style={styles.sectionsContainer}>
              {renderBookSection("읽는 중", groupedBooks[ReadingStatus.Reading], ReadingStatus.Reading)}
              {renderBookSection("읽고 싶은", groupedBooks[ReadingStatus.WantToRead], ReadingStatus.WantToRead)}
              {renderBookSection("완독", groupedBooks[ReadingStatus.Finished], ReadingStatus.Finished)}
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
              <Text style={styles.emptyTitle}>책장이 비어있습니다</Text>
              <Text style={styles.emptySubtitle}>검색 탭을 이용해 첫 책을 추가해보세요!</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#94A3B8',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#6B7280',
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
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#03314B',
  },
  sparklesButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    borderBottomColor: '#4ADE80',
  },
  filterTabText: {
    fontSize: 12,
    color: '#475569',
  },
  filterTabTextActive: {
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  secondaryFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1F2937',
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
    color: '#03314B',
  },
  sectionCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
  },
  showAllButton: {
    fontSize: 12,
    color: '#6B7280',
  },
  horizontalScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  horizontalCard: {
    width: 140,
  },
  imageContainer: {
    aspectRatio: 2/3,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  cardTextContainer: {
    paddingVertical: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#03314B',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#475569',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12, // Keep gap for modern RN, but rely on space-between for main axis if calc is correct
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
    color: '#03314B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#475569',
  },
});
