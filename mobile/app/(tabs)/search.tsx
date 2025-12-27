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
import { useRouter } from "expo-router";
import { SearchIcon, XMarkIcon } from "../../components/Icons";
import { useAladinSearch } from "../../hooks/useAladinSearch";
import { BookSearchLoading } from "../../components/BookSearchLoading";
import { SearchBookCard } from "../../components/SearchBookCard";
import { BookWithReview, useBooks, UserBook } from "../../hooks/useBooks";

export default function Search() {
  const router = useRouter();
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

  const handleSelectBook = (book: BookWithReview) => {
      // Cast to any to access isInBookshelf which comes from the search hook
      let searchResult = book as BookWithReview & { isInBookshelf?: boolean };

      // Client-side fallback check
      if (userBooks) {
           const matched = userBooks.find((ub: UserBook) => ub.books.isbn13 === book.isbn13);
           if (matched) {
               searchResult = {
                   ...book,
                   isInBookshelf: true,
                   review: matched
               };
           }
      }

      if (searchResult.isInBookshelf) {
           // If in bookshelf, navigate to record
           // We prioritize the ID from the matched user book if available
           const bookId = searchResult.review?.book_id || (searchResult.review as any)?.id; // user_books.book_id
           
           if (bookId) {
               router.push(`/book-record/${bookId}`);
           } else {
                Alert.alert("오류", "책 정보를 찾을 수 없습니다.");
           }
      } else {
         // Not in bookshelf -> Go to Preview/Add screen
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
      
      if (userBooks) {
          // Normalize ISBNs for comparison (strip dashes just in case)
          const normalize = (s: string) => s ? s.replace(/-/g, '') : '';
          const targetIsbn = normalize(item.isbn13);

          const matched = userBooks.find((ub: UserBook) => normalize(ub.books?.isbn13) === targetIsbn);
          
          if (matched) {
              enrichedItem = {
                  ...item,
                  isInBookshelf: true,
                  review: matched // UserBook has rating etc.
              };
          }
      }

    return (
      <SearchBookCard
        book={enrichedItem}
        onSelect={handleSelectBook}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color="#94A3B8" />
          <TextInput
            style={styles.input}
            placeholder="책 제목이나 저자로 검색..."
            value={query}
            onChangeText={handleQueryChange}
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <XMarkIcon size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => searchBooks(query)} style={styles.retryButton}>
               <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <BookSearchLoading />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.isbn13 || item.id}
            renderItem={({ item }) => (
              <SearchBookCard 
                book={item} 
                onSelect={handleSelectBook} 
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              query.length > 0 ? (
                <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
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
    backgroundColor: '#F8FAFC',
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
    borderBottomColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 8,
    ...Platform.select({
      web: {
        // @ts-ignore
        outlineStyle: 'none',
      },
    }),
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748B',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  retryText: {
    color: '#475569',
    fontWeight: '600',
  },
});
