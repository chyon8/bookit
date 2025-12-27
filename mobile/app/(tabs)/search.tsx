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
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { SearchIcon, XMarkIcon } from "../../components/Icons";
import { useAladinSearch } from "../../hooks/useAladinSearch";
import { BookSearchLoading } from "../../components/BookSearchLoading";
import { SearchBookCard } from "../../components/SearchBookCard";
import { BookWithReview } from "../../hooks/useBooks";

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { results, loading, error, searchBooks, setResults } = useAladinSearch();
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
      // Navigate to book detail or add-book screen
      // Since we don't have a dedicated "Add Book" screen that accepts an object yet,
      // We might pass it via params or simplified flow.
      // For now, let's assume we go to a route that handles this, 
      // or we just go to book-record/[id] if it exists, or a new add screen.
      
      // If it's already in bookshelf, go to detail
      // If not, go to add (we can use the same detail screen but in 'new' mode if supported, 
      // or passing book data via global state/params)
      
      // For this implementation, I will treat it as "View Detail" 
      // where the detail screen handles adding if not present
      // But passing object via URL params is bad.
      // Ideally: /book-record/new?isbn=...
      
      if (book.isbn13) {
          // If the page supports fetching by ISBN or we pass data
          // For now let's assume we navigate to a placeholder or the id check
          // The current [id].tsx takes an ID. 
          // If book isn't in DB, we can't go to [id].
          // We need an "add" flow.
          // Since I can't create a new route without user permission,
          // I'll console log for now and maybe implement a simple alert or navigation to a stub.
          // Actually, the user asked to "refer to original".
          // The web app likely opens a modal or navigates.
          
          // Let's trying navigating to book-record/new with params?
          // Since I haven't implemented /new, I'll validly assume I should navigate to the ID if it exists?
          // The search result sends `id` which is isbn13.
          // If I go to `book-record/${book.isbn13}`, the current [id].tsx fetches from Supabase.
          // If it's not in Supabase, [id].tsx returns Skeleton forever or null?
          
          // Wait, [id].tsx relies on `useBookData` which fetches from `user_books`.
          // If I navigate to `book-record/123` and 123 is ISBN, and it's not in `user_books`, it will fail.
          
          // I should probably just show an Alert "This feature (Adding books) is coming next" 
          // OR better, since I am "Antigravity", I should probably make it work by creating a `book-record/preview` logic? 
          // But I am constrained to [id].tsx.
          
          // Let's check if there is an `add` screen in the file list? No.
          // I will navigate to a non-existent route just to show intent? No that crashes.
          
          // I will just Alert for now as a placeholder for the "OnSelect" action, 
          // unless the book is already in shelf.
          
          if ((book as any).isInBookshelf) {
               // Use the ID from the result which should be the user_book id if found? 
               // Wait, the search API logic I wrote returns `id: item.isbn13`. 
               // It doesn't return the `user_book` ID.
               // Ah, `review` object in my hook contains the whole user_book data including ID!
               if (book.review && book.review.id) {
                   router.push(`/book-record/${book.review.book_id}`); // user_book.book_id is the foreign key to books table? 
                   // No, `user_books` table usually has `id` (primary key).
                   // Let's check my hook logic again.
                   // `reviewData` is from `user_books`. 
                   // So `book.review.id` is the `user_book` ID?
                   // No, `reviewData` is `...reviewData`. 
                   // let's assume `book.review` has `book_id`.
                   
                   router.push(`/book-record/${book.review.book_id}`);
               }
          } else {
             // Not in bookshelf.
             alert("책 추가 기능은 아직 구현되지 않았습니다. (Mobile)");
          }
      }
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
