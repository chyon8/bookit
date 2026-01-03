import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Alert
} from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { SearchIcon, XMarkIcon } from "../../components/Icons";
import { useAladinSearch } from "../../hooks/useAladinSearch";
import { useSearchHistory } from "../../hooks/useSearchHistory";
import { BookSearchLoading } from "../../components/BookSearchLoading";
import { SearchBookCard } from "../../components/SearchBookCard";
import { InspirationView } from "../../components/InspirationView";
import { SearchHistory } from "../../components/SearchHistory";
import { BookWithReview, useBooks, UserBook } from "../../hooks/useBooks";

import { useTheme } from "../../context/ThemeContext";

export default function Search() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { results, loading, error, searchBooks, setResults } = useAladinSearch();
  const { data: userBooks } = useBooks();
  
  const { history, addHistory, removeHistory, clearHistory } = useSearchHistory();
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim()) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      searchBooks(text);
    }, 500);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    // Keep focus if user just cleared text to type something else
  };

  const handleCancel = () => {
    setQuery("");
    setResults([]);
    Keyboard.dismiss();
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleSubmit = () => {
      if (query.trim()) {
          addHistory(query.trim());
          searchBooks(query.trim());
      }
  };

  const handleHistorySelect = (selectedQuery: string) => {
      setQuery(selectedQuery);
      addHistory(selectedQuery); // Bring to top
      searchBooks(selectedQuery);
      Keyboard.dismiss(); // Optional: Dismiss keyboard on selection
      // Note: We might want to keep isFocused true if we want to show results in the search "mode",
      // but usually selecting history implies entering "Result Mode".
      // Our logic: Show Results if query !== "". isFocused doesn't hide results, only hides Curation.
      // So this is fine.
  };

  // Helper to find book in local library
  const findInLibrary = (targetIsbn: string) => {
      if (!userBooks || !targetIsbn) return undefined;
      
      const normalize = (s: string) => s ? s.replace(/-/g, '') : '';
      const normalizedTarget = normalize(targetIsbn);

      return userBooks.find((ub: UserBook) => normalize(ub.books?.isbn13) === normalizedTarget);
  };

  const handleSelectBook = (book: BookWithReview) => {
      // Add to history when book is selected if it serves as a "successful search"
      if (query.trim()) addHistory(query.trim());

      let searchResult = book as BookWithReview & { isInBookshelf?: boolean };

      // Client-side fallback check using shared logic
      const matched = findInLibrary(book.isbn13);
      if (matched) {
           searchResult = {
               ...book,
               isInBookshelf: true,
               review: matched
           };
      }

      if (searchResult.isInBookshelf) {
           const bookId = searchResult.review?.book_id || (searchResult.review as any)?.id;
           if (bookId) {
               router.push(`/book-record/${bookId}`);
           } else {
                Alert.alert("오류", "책 정보를 찾을 수 없습니다.");
           }
      } else {
         if (book.isbn13) {
             router.push(`/books/${book.isbn13}`);
         } else {
             Alert.alert("오류", "ISBN 정보가 없습니다.");
         }
      }
  };

  const renderItem = ({ item }: { item: BookWithReview }) => {
      // Enrich item with local data if available
      let enrichedItem = item as BookWithReview & { isInBookshelf?: boolean };
      
      const matched = findInLibrary(item.isbn13);
          
      if (matched) {
          enrichedItem = {
              ...item,
              isInBookshelf: true,
              review: matched
          };
      }

    return (
      <SearchBookCard
        book={enrichedItem}
        onSelect={handleSelectBook}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Animated.View 
            layout={LinearTransition.springify().damping(15)}
            style={[
            styles.searchHeader, 
            { backgroundColor: colors.card, borderBottomColor: colors.border }
        ]}>
          <View style={[
              styles.searchContainer, 
              { backgroundColor: isDark ? colors.background : '#F1F5F9' }
          ]}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="책 제목이나 저자로 검색..."
              value={query}
              onChangeText={handleQueryChange}
              onFocus={handleFocus}
              onSubmitEditing={handleSubmit}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <XMarkIcon size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          
          {isFocused && (
              <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(500)}>
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                      <Text style={[styles.cancelText, { color: colors.primary }]}>취소</Text>
                  </TouchableOpacity>
              </Animated.View>
          )}
        </Animated.View>

        {/* 
            Logic:
            1. Query exists -> Show Results (or Loading/Error)
            2. No Query AND Focused -> Show History
            3. No Query AND Not Focused -> Show Inspiration (Curation)
         */}
        <View style={{ flex: 1 }}>
            {query.length > 0 ? (
            <Animated.View 
                key="results"
                entering={FadeIn.duration(500)} 
                exiting={FadeOut.duration(500)}
                style={{ flex: 1 }}
            >
                {error ? (
                <View style={styles.centerContainer}>
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    <TouchableOpacity onPress={() => searchBooks(query)} style={[styles.retryButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}>
                    <Text style={[styles.retryText, { color: colors.text }]}>다시 시도</Text>
                    </TouchableOpacity>
                </View>
                ) : loading ? (
                <BookSearchLoading />
                ) : (
                <FlatList
                    data={results}
                    extraData={userBooks} // Force re-render when userBooks changes
                    keyExtractor={(item) => item.isbn13 || item.id}
                    renderItem={renderItem}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
                    ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>검색 결과가 없습니다.</Text>
                    }
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={Keyboard.dismiss} // Optional: hide keyboard on scroll
                />
                )}
            </Animated.View>
            ) : isFocused ? (
             <Animated.View 
                key="history"
                entering={FadeIn.duration(600)} 
                exiting={FadeOut.duration(500)}
                style={{ flex: 1 }}
             >
                <SearchHistory 
                    history={history}
                    onSelect={handleHistorySelect}
                    onDelete={removeHistory}
                    onClearAll={clearHistory}
                />
             </Animated.View>
            ) : (
             <Animated.View 
                key="inspiration"
                entering={FadeIn.duration(600)} 
                exiting={FadeOut.duration(500)}
                style={{ flex: 1 }}
             >
                <InspirationView />
             </Animated.View>
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent', 
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    paddingVertical: 4, 
  },
  cancelButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontWeight: '600',
  },
});

