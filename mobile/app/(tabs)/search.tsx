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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { SearchIcon, XMarkIcon } from "../../components/Icons";
import { useAladinSearch } from "../../hooks/useAladinSearch";
import { BookSearchLoading } from "../../components/BookSearchLoading";
import { SearchBookCard } from "../../components/SearchBookCard";
import { BookWithReview, useBooks, UserBook } from "../../hooks/useBooks";

import { useTheme } from "../../context/ThemeContext";

export default function Search() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const { results, loading, error, searchBooks, setResults } = useAladinSearch();
  const { data: userBooks } = useBooks();
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
    Keyboard.dismiss();
  };

  // Helper to find book in local library
  const findInLibrary = (targetIsbn: string) => {
      if (!userBooks || !targetIsbn) return undefined;
      
      const normalize = (s: string) => s ? s.replace(/-/g, '') : '';
      const normalizedTarget = normalize(targetIsbn);

      return userBooks.find((ub: UserBook) => normalize(ub.books?.isbn13) === normalizedTarget);
  };

  const handleSelectBook = (book: BookWithReview) => {
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
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <SearchIcon size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="책 제목이나 저자로 검색..."
            value={query}
            onChangeText={handleQueryChange}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <XMarkIcon size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

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
              query.length > 0 ? (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>검색 결과가 없습니다.</Text>
              ) : null
            }
          />
        )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    paddingVertical: 8,
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
