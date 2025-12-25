import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useBookData, useUpdateBookReview } from "../../hooks/useBookData";
import { UserBook, ReadingStatus, MemorableQuote, Memo } from "../../hooks/useBooks";
import { ChevronLeftIcon, PlusIcon, ChevronDownIcon } from "../../components/Icons";
import { StarRating } from "../../components/StarRating";
import { QuoteCard } from "../../components/QuoteCard";
import { MemoCard } from "../../components/MemoCard";
import { BlurView } from "expo-blur"; // You need to install expo-blur if not present, otherwise use a semi-transparent view

// Mocking useAppContext mostly for the 'user' ID. Assuming we have a way to get user.
// For now, hardcoding or fetching session.
import { supabase } from "../../lib/supabase";

export default function BookRecordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);

  // Get user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const { data: book, isLoading } = useBookData(id, user?.id);
  const updateReviewMutation = useUpdateBookReview();

  const [review, setReview] = useState<Partial<UserBook>>({});
  const [isDirty, setIsDirty] = useState(false);
  const initialReviewState = useRef<string>("");

  useEffect(() => {
    if (book) {
      setReview(book.review);
      initialReviewState.current = JSON.stringify(book.review);
    }
  }, [book]);

  // Dirty checking
  useEffect(() => {
    if (!initialReviewState.current) return;
    const current = JSON.stringify(review);
    setIsDirty(current !== initialReviewState.current);
  }, [review]);

  const handleSave = async () => {
    if (!review || !book) return;
    try {
      await updateReviewMutation.mutateAsync({
        reviewId: book.review.id,
        reviewData: review,
      });
      router.back();
    } catch (e) {
      Alert.alert("오류", "저장 중 문제가 발생했습니다.");
    }
  };

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        "저장되지 않은 변경사항",
        "변경사항이 사라집니다. 정말 나가시겠습니까?",
        [
          { text: "취소", style: "cancel" },
          { text: "나가기", style: "destructive", onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  const updateReview = (field: keyof UserBook, value: any) => {
    setReview(prev => ({ ...prev, [field]: value }));
  };

  // Status Logic
  const handleStatusChange = (newStatus: ReadingStatus) => {
      const today = new Date().toISOString().split("T")[0];
      const oldStatus = review.status;
  
      let updates: Partial<UserBook> = { status: newStatus };
  
      if (newStatus === ReadingStatus.Reading && oldStatus === ReadingStatus.WantToRead) {
        updates.start_date = today;
      }
  
      if (newStatus === ReadingStatus.Finished) {
         updates.end_date = today;
         if (!review.start_date) updates.start_date = today;
      }
      
      setReview(prev => ({ ...prev, ...updates }));
  };

  // Quote Handlers
  const addQuote = () => {
    const newQuote: MemorableQuote = { quote: "", page: "", thought: "" };
    setReview(prev => ({
      ...prev,
      memorable_quotes: [...(prev.memorable_quotes || []), newQuote]
    }));
  };

  const updateQuote = (index: number, field: keyof MemorableQuote, value: string) => {
    setReview(prev => {
      const quotes = [...(prev.memorable_quotes || [])];
      quotes[index] = { ...quotes[index], [field]: value };
      return { ...prev, memorable_quotes: quotes };
    });
  };

  const deleteQuote = (index: number) => {
    setReview(prev => {
      const quotes = [...(prev.memorable_quotes || [])];
      quotes.splice(index, 1);
      return { ...prev, memorable_quotes: quotes };
    });
  };

  // Memo Handlers
  const addMemo = () => {
    const newMemo: Memo = { text: "", createdAt: new Date().toISOString() };
    setReview(prev => ({
      ...prev,
      memos: [...(prev.memos || []), newMemo]
    }));
  };

  const updateMemo = (index: number, text: string) => {
    setReview(prev => {
      const memos = [...(prev.memos || [])];
      memos[index] = { ...memos[index], text };
      return { ...prev, memos: memos };
    });
  };

  const deleteMemo = (index: number) => {
    setReview(prev => {
      const memos = [...(prev.memos || [])];
      memos.splice(index, 1);
      return { ...prev, memos: memos };
    });
  };

  if (isLoading || !book) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ADE80" />
      </View>
    );
  }

  const statusOptions = {
    [ReadingStatus.WantToRead]: "읽고 싶은",
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ChevronLeftIcon size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>독서 기록</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={[styles.saveButton, !isDirty && styles.disabledSave]}>저장</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Top Section with Blur Background */}
          {/* Note: React Native implementation of blur might differ. 
              Using simple absolute view with opacity if BlurView fails. 
              Using View for simplicty first. */}
          <View style={styles.topSection}>
            <Image 
              source={{ uri: book.coverImageUrl }} 
              style={[StyleSheet.absoluteFill, styles.backgroundImage]} 
              blurRadius={10} 
            />
            <View style={[StyleSheet.absoluteFill, styles.overlay]} />

            <View style={styles.bookInfoContainer}>
              <View style={styles.coverWrapper}>
                <Image source={{ uri: book.coverImageUrl }} style={styles.coverImage} resizeMode="cover" />
              </View>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author}</Text>
            </View>
          </View>

          {/* White Content Area */}
          <View style={styles.contentArea}>
            
            {/* Description Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>책 소개</Text>
              <Text style={styles.bookDescription} numberOfLines={isDirty ? 3 : undefined}>
                {book.description}
              </Text>
            </View>

            {/* Rating */}
            <View style={styles.card}>
              <View style={styles.centerRow}>
                <StarRating 
                  rating={review.rating || 0} 
                  setRating={(r) => updateReview('rating', r)} 
                />
              </View>
            </View>

             {/* Status & Options */}
            <View style={styles.card}>
              <Text style={styles.label}>독서 상태</Text>
              {/* Simple dropdown simulation */}
              <View style={styles.statusRow}>
                  {Object.entries(statusOptions).map(([key, label]) => (
                      <TouchableOpacity 
                        key={key} 
                        onPress={() => handleStatusChange(key as ReadingStatus)}
                        style={[
                            styles.statusChip, 
                            review.status === key && styles.activeStatusChip
                        ]}
                      >
                          <Text style={[
                              styles.statusText,
                              review.status === key && styles.activeStatusText
                          ]}>{label}</Text>
                      </TouchableOpacity>
                  ))}
              </View>

              <Text style={styles.label}>한 줄 평</Text>
              <TextInput 
                style={styles.input}
                value={review.one_line_review || ""}
                onChangeText={(text) => updateReview('one_line_review', text)}
                placeholder="짧은 감상평을 남겨주세요"
              />

              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => updateReview('is_rereading', !review.is_rereading)}
              >
                  <View style={[styles.checkbox, review.is_rereading && styles.checkboxChecked]}>
                    {review.is_rereading && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>다시 읽고 싶은 책으로 표시</Text>
              </TouchableOpacity>
            </View>

            {/* Quotes */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>인상 깊은 구절</Text>
            </View>
            
            <TouchableOpacity onPress={addQuote} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ 인용구 추가</Text>
            </TouchableOpacity>

            <View style={styles.listContainer}>
                {review.memorable_quotes?.map((quote, idx) => (
                    <QuoteCard 
                        key={idx}
                        quote={quote}
                        onChange={(field, val) => updateQuote(idx, field, val)}
                        onDelete={() => deleteQuote(idx)}
                    />
                ))}
            </View>

             {/* Memos */}
             <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>메모</Text>
            </View>
            
            <TouchableOpacity onPress={addMemo} style={styles.addButton}>
                <Text style={styles.addButtonText}>+ 메모 추가</Text>
            </TouchableOpacity>

            <View style={styles.listContainer}>
                {review.memos?.map((memo, idx) => (
                    <MemoCard 
                        key={idx}
                        memo={memo}
                        onChange={(val) => updateMemo(idx, val)}
                        onDelete={() => deleteMemo(idx)}
                    />
                ))}
            </View>

          </View>
          
          <View style={{ height: 40 }} /> 
        </ScrollView>
      </KeyboardAvoidingView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60, // Safe Area top approximation
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerButton: {
    padding: 4,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  disabledSave: {
    color: '#94A3B8',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Top Section
  topSection: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bookInfoContainer: {
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 20,
  },
  coverWrapper: {
    width: 120,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  
  // Content
  contentArea: {
    marginTop: -20, // Overlap
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  bookDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  centerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeStatusChip: {
    backgroundColor: '#DCFCE7', // green-100
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  statusText: {
    fontSize: 13,
    color: '#64748B',
  },
  activeStatusText: {
    color: '#15803D', // green-700
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#4ADE80',
    borderColor: '#4ADE80',
  },
  checkboxCheck: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#475569',
  },
  
  // Lists
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#10B981', // green-600
    fontWeight: 'bold',
    fontSize: 15,
  },
  listContainer: {
    marginBottom: 16,
  },
});
