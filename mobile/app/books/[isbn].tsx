import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ChevronLeftIcon } from "../../components/Icons";
import { useAddBookToLibrary } from "../../hooks/useBookData";
import { supabase } from "../../lib/supabase";
import { BookWithReview, ReadingStatus, UserBook } from "../../hooks/useBooks";
import { BASE_URL } from "../../constants/Config";

export default function BookPreviewScreen() {
  const router = useRouter();
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const [book, setBook] = useState<BookWithReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingBookId, setExistingBookId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const addBookMutation = useAddBookToLibrary();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    const fetchBook = async () => {
      if (!isbn || !user) return;
      setIsLoading(true);
      console.log("Fetching book info for ISBN:", isbn);
      try {
        // 1. Fetch from Aladin Proxy
        const apiUrl = `${BASE_URL}/api/aladin-detail?isbn=${encodeURIComponent(isbn)}`;
        console.log("Fetching from API:", apiUrl);
        const response = await fetch(apiUrl);
        console.log("Response status:", response.status);
        const data = await response.json();
        
        if (!data.book) {
            console.error("No book data found in response", data);
            throw new Error("책 정보를 찾을 수 없습니다.");
        }
        
        console.log("Book data received:", data.book.title);

        // 2. Check overlap logic (already in library?)
        // Similar to web: check books table -> check user_books table
        const { data: bookInDb, error: dbError } = await supabase
          .from("books")
          .select("id")
          .eq("isbn13", isbn)
          .single();
        
        if (dbError && dbError.code !== 'PGRST116') {
             console.error("DB Error checking books:", dbError);
        }

        let foundUserBookId = null;
        if (bookInDb) {
           console.log("Book found in DB, checking user_books...");
           const { data: userBookLink, error: userBookError } = await supabase
             .from("user_books")
             .select("book_id")
             .eq("user_id", user.id)
             .eq("book_id", bookInDb.id)
             .single();
            
           if (userBookError && userBookError.code !== 'PGRST116') {
               console.error("DB Error checking user_books:", userBookError);
           } 

           if (userBookLink) {
               console.log("User has this book:", userBookLink.book_id);
               foundUserBookId = userBookLink.book_id;
           }
        }

        setExistingBookId(foundUserBookId);
        setBook(data.book);

      } catch (e) {
        console.error("Error in fetchBook:", e);
        Alert.alert("Error", "책 정보를 불러오는데 실패했습니다.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [isbn, user]);

  const handleAdd = async () => {
    if (!book || !user) return;
    try {
       const bookToSave = {
           ...book,
           review: {
               status: ReadingStatus.WantToRead,
               rating: 0
           } as Partial<UserBook>
       };

       await addBookMutation.mutateAsync({
           bookData: bookToSave as any,
           reviewData: bookToSave.review,
           userId: user.id
       });

       // Close window immediately after successful save
       router.back();
        
    } catch (e) {
        Alert.alert("오류", "저장 중 문제가 발생했습니다.");
    }
  };

  const handleGoToRecord = () => {
      // If we know the book_id (which is UUID in user_books), go there.
      // But typically `existingBookId` is the `book_id` (foreign key to books table).
      // Wait, `user_books` primary key is `id`. `book_id` column is FK to `books`. 
      // The `book-record/[id]` page expects... let's check. 
      // `useBookData` in [id].tsx uses `.eq("book_id", bookId)`.
      // So it expects the BOOK UUID (from books table), NOT the user_books primary key.
      // Yes: `.eq("book_id", bookId)` in useBookData.ts
      
      if (existingBookId) {
          router.replace(`/book-record/${existingBookId}`);
      }
  };



  if (isLoading || !book) {
      return (
          <View style={styles.container}>
             <Stack.Screen options={{ headerShown: false }} />
             
             {/* Background Skeleton */}
             <View style={styles.backgroundContainer}>
                 <View style={[styles.backgroundImage, { backgroundColor: '#334155' }]} />
                 <View style={styles.backgroundOverlay} />
             </View>

             <SafeAreaView style={styles.safeArea}>
                 {/* Header */}
                 <View style={styles.header}>
                   <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                     <ChevronLeftIcon size={24} color="#FFFFFF" />
                   </TouchableOpacity>
                 </View>

                 <ScrollView contentContainerStyle={styles.scrollContent}>
                     {/* Hero Section Skeleton */}
                     <View style={styles.heroSection}>
                         <View style={styles.coverShadow}>
                           <View style={[styles.coverImage, { backgroundColor: '#475569' }]} />
                         </View>
                         <View style={{ width: '80%', height: 24, backgroundColor: '#475569', borderRadius: 4, marginBottom: 8 }} />
                         <View style={{ width: '60%', height: 18, backgroundColor: '#475569', borderRadius: 4 }} />
                     </View>

                     {/* Card Skeleton */}
                     <View style={styles.cardContainer}>
                         <View style={styles.cardContent}>
                             <View style={{ width: 80, height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
                             <View style={{ width: 120, height: 20, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 24 }} />
                             
                             <View style={styles.divider} />
                             
                             <View style={{ width: 80, height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
                             <View style={{ width: '100%', height: 60, backgroundColor: '#E2E8F0', borderRadius: 4 }} />
                         </View>
                     </View>
                 </ScrollView>
             </SafeAreaView>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Background Image with Blur */}
      <View style={styles.backgroundContainer}>
          <Image 
            source={{ uri: book.coverImageUrl }} 
            style={styles.backgroundImage} 
            blurRadius={20}
          />
          <View style={styles.backgroundOverlay} />
      </View>

      <SafeAreaView style={styles.safeArea}>
          {/* Header Actions */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <ChevronLeftIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Hero Section */}
              <View style={styles.heroSection}>
                  <View style={styles.coverShadow}>
                    <Image 
                        source={{ uri: book.coverImageUrl }} 
                        style={styles.coverImage} 
                        resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.heroTitle}>{book.title}</Text>
                  <Text style={styles.heroAuthor}>{book.author}</Text>
              </View>

              {/* White Card Section */}
              <View style={styles.cardContainer}>
                  <View style={styles.cardContent}>
                      <Text style={styles.label}>카테고리</Text>
                      <Text style={styles.valueText}>{book.category}</Text>

                      <View style={styles.divider} />

                      {book.description && (
                          <>
                           <Text style={styles.label}>책 소개</Text>
                           <Text style={styles.description}>{book.description}</Text>
                           <View style={styles.divider} />
                          </>
                      )}

                      <View style={styles.row}>
                          <Text style={styles.label}>ISBN</Text>
                          <Text style={styles.isbnText}>{book.isbn13}</Text>
                      </View>
                  </View>
              </View>
          </ScrollView>

          {/* Bottom Button */}
          <View style={styles.footer}>
              {existingBookId ? (
                   <TouchableOpacity style={styles.actionButton} onPress={handleGoToRecord}>
                      <Text style={styles.actionButtonText}>기록 보러가기</Text>
                   </TouchableOpacity>
              ) : (
                    <TouchableOpacity 
                        style={[styles.actionButton, addBookMutation.isPending && styles.buttonDisabled]} 
                        onPress={handleAdd}
                        disabled={addBookMutation.isPending}
                    >
                      <Text style={styles.actionButtonText}>
                          {addBookMutation.isPending ? "저장 중..." : "내 서재에 담기"}
                      </Text>
                   </TouchableOpacity>
              )}
          </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
      ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
      flex: 1,
      opacity: 0.6,
  },
  backgroundOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
  },
  safeArea: {
      flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  scrollContent: {
      paddingBottom: 100,
  },
  heroSection: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 40,
      paddingHorizontal: 20,
  },
  coverShadow: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 10,
      marginBottom: 24,
  },
  coverImage: {
      width: 140,
      height: 200,
      borderRadius: 8,
  },
  heroTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
  },
  heroAuthor: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
  },
  cardContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 32,
      paddingHorizontal: 24,
      paddingBottom: 40,
      minHeight: 400, // Ensure it fills some space
  },
  cardContent: {
      paddingBottom: 20,
  },
  label: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#94A3B8',
      marginBottom: 8,
  },
  valueText: {
      fontSize: 18,
      fontWeight: "semibold",
      color: '#0F172A',
      marginBottom: 0,
  },
  description: {
      fontSize: 16,
      color: '#334155',
      lineHeight: 26,
  },
  divider: {
      height: 1,
      backgroundColor: '#E2E8F0',
      marginVertical: 24,
  },
  row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  isbnText: {
      fontSize: 16,
      color: '#475569',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontWeight: '500',
  },
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFFFFF',
      padding: 16,
      paddingBottom: 32, // For safe area
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
  },
  actionButton: {
      backgroundColor: '#4ADE80',
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: "#4ADE80",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  actionButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
  },
  buttonDisabled: {
      opacity: 0.7,
      shadowOpacity: 0.1,
  }
});
