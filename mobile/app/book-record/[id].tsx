import React, { useState, useEffect, useRef } from "react";
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
import { useTheme } from "../../context/ThemeContext";
import { useLocalSearchParams, useRouter, Stack, useNavigation } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { useBookData, useUpdateBookReview, useDeleteBook } from "../../hooks/useBookData";
import { UserBook, ReadingStatus, MemorableQuote, Memo } from "../../hooks/useBooks";
import { ChevronLeftIcon, TrashIcon, CameraIcon, PhotoIcon } from "../../components/Icons";
import { StarRating } from "../../components/StarRating";
import { QuoteCard } from "../../components/QuoteCard";
import { MemoCard } from "../../components/MemoCard";
import { supabase } from "../../lib/supabase";
import { BookRecordSkeleton } from "../../components/BookRecordSkeleton";
import { ConfirmModal } from "../../components/ConfirmModal";
import { ScanPreviewModal } from "../../components/ScanPreviewModal";
import { performOCR } from "../../utils/ocr";

export default function BookRecordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const { colors, isDark } = useTheme();

  // Get user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const { data: book, isLoading } = useBookData(id, user?.id);
  const updateReviewMutation = useUpdateBookReview();
  const deleteBookMutation = useDeleteBook();

  const [review, setReview] = useState<Partial<UserBook>>({});
  const [isDirty, setIsDirty] = useState(false);
  const initialReviewState = useRef<string>("");
  const isSaving = useRef(false);
  const isDeleting = useRef(false);
  const navigation = useNavigation();

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isVisible: false,
    title: "",
    message: "",
    confirmText: "확인",
    cancelText: "취소",
    isDestructive: false,
    onConfirm: () => {},
  });

  // OCR State
  const [isScanModalVisible, setIsScanModalVisible] = useState(false);
  const [scannedText, setScannedText] = useState("");
  const [scanImageUri, setScanImageUri] = useState<string | null>(null);
  const [scanImageBase64, setScanImageBase64] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [newlyAddedQuoteIndex, setNewlyAddedQuoteIndex] = useState<number | null>(null);

  const showConfirmModal = (
    title: string, 
    message: string, 
    onConfirm: () => void,
    options: { confirmText?: string; cancelText?: string; isDestructive?: boolean } = {}
  ) => {
    setModalConfig({
      isVisible: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isVisible: false }));
      },
      confirmText: options.confirmText || "확인",
      cancelText: options.cancelText || "취소",
      isDestructive: options.isDestructive || false,
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    if (book && !initialReviewState.current) {
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

  // Handle all back navigation (swipe, system back, etc.)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If no changes or we're saving, don't show alert
      if (!isDirty || isSaving.current) {
        return;
      }

      // Prevent default behavior
      e.preventDefault();

      showConfirmModal(
        "저장되지 않은 변경사항",
        "수정 중인 내용이 저장되지 않았습니다. 정말 나가시겠습니까?",
        () => navigation.dispatch(e.data.action),
        { confirmText: "나가기", cancelText: "계속 수정", isDestructive: true }
      );
    });

    return unsubscribe;
  }, [navigation, isDirty]);

  if (isLoading || !book) {
    return <BookRecordSkeleton />;
  }

  const handleSave = async () => {
    if (!review || !book) return;
    try {
      isSaving.current = true;
      await updateReviewMutation.mutateAsync({
        reviewId: book.review.id,
        reviewData: review,
      });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (e) {
      isSaving.current = false;
      Alert.alert("오류", "저장 중 문제가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!book) return;
    
    showConfirmModal(
        "기록 삭제",
        "정말 이 독서 기록을 삭제하시겠습니까? 삭제된 기록은 복구할 수 없습니다.",
        async () => {
            try {
                isDeleting.current = true;
                await deleteBookMutation.mutateAsync(book.review.id);
                router.replace('/'); // Go back to library
            } catch (e) {
                isDeleting.current = false;
                Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
            }
        },
        { confirmText: "삭제", isDestructive: true }
    );
  };

  const handleBack = () => {
    if (isDirty && !isSaving.current) {
      // Manual trigger fallback
      if (router.canGoBack()) {
        router.back(); 
      } else {
         router.replace('/');
      }
    } else {
       if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
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
    setReview(prev => {
      const newQuotes = [...(prev.memorable_quotes || []), newQuote];
      setNewlyAddedQuoteIndex(newQuotes.length - 1);
      return {
        ...prev,
        memorable_quotes: newQuotes
      };
    });
  };

  const updateQuote = (index: number, field: keyof MemorableQuote, value: string) => {
    setReview(prev => {
      const quotes = [...(prev.memorable_quotes || [])];
      quotes[index] = { ...quotes[index], [field]: value };
      return { ...prev, memorable_quotes: quotes };
    });
  };

  const deleteQuote = (index: number) => {
    showConfirmModal(
      "삭제 확인",
      "정말 삭제하시겠습니까?",
      () => {
        setReview(prev => {
           const quotes = [...(prev.memorable_quotes || [])];
           quotes.splice(index, 1);
           return { ...prev, memorable_quotes: quotes };
        });
      },
      { confirmText: "삭제", isDestructive: true }
    );
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
    showConfirmModal(
        "삭제 확인",
        "정말 삭제하시겠습니까?",
        () => {
          setReview(prev => {
            const memos = [...(prev.memos || [])];
            memos.splice(index, 1);
            return { ...prev, memos: memos };
          });
        },
        { confirmText: "삭제", isDestructive: true }
      );
  };

  // OCR Logic
  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '이미지를 선택하기 위해 갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Crop option for better OCR
        quality: 1, // High quality for OCR
        base64: true, // Request base64 directly
      });

      if (!result.canceled) {
        setScanImageUri(result.assets[0].uri);
        setScanImageBase64(result.assets[0].base64 || null);
        setScannedText("");
        setScanError(null);
        setIsScanModalVisible(true);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '이미지를 불러오는 중 문제가 발생했습니다.');
    }
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 촬영하기 위해 카메라 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        base64: true, // Request base64 directly
      });

      if (!result.canceled) {
        setScanImageUri(result.assets[0].uri);
        setScanImageBase64(result.assets[0].base64 || null);
        setScannedText("");
        setScanError(null);
        setIsScanModalVisible(true);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '카메라를 실행하는 중 문제가 발생했습니다.');
    }
  };

  const handleScan = async () => {
    if (!scanImageBase64) {
         setScanError("이미지 데이터를 불러올 수 없습니다.");
         return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      const result = await performOCR(scanImageBase64);

      if (result.error) {
        throw new Error(result.error);
      }

      setScannedText(result.text);
    } catch (e: any) {
      console.error(e);
      setScanError(e.message || "OCR 처리 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyScan = (text: string) => {
    // Add new quote
    const newQuote: MemorableQuote = { quote: text, page: "", thought: "" };
    setReview(prev => {
      const newQuotes = [...(prev.memorable_quotes || []), newQuote];
      setNewlyAddedQuoteIndex(newQuotes.length - 1);
      return {
        ...prev,
        memorable_quotes: newQuotes
      };
    });
    
    setIsScanModalVisible(false);
    setTimeout(() => {
      setScanImageUri(null);
      setScanImageBase64(null);
      setScannedText("");
    }, 500);
  };

  const statusOptions = {
    [ReadingStatus.WantToRead]: "읽고 싶은",
    [ReadingStatus.Reading]: "읽는 중",
    [ReadingStatus.Finished]: "완독",
    [ReadingStatus.Dropped]: "중단",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ConfirmModal
        isVisible={modalConfig.isVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        isDestructive={modalConfig.isDestructive}
      />

      <ScanPreviewModal
        isVisible={isScanModalVisible}
        onClose={() => setIsScanModalVisible(false)}
        onApply={handleApplyScan}
        scannedText={scannedText}
        imageUri={scanImageUri}
        onScan={handleScan}
        isScanning={isScanning}
        error={scanError}
      />
      
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <ChevronLeftIcon size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>독서 기록</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={!isDirty}
        >
          <Text style={[styles.saveButton, !isDirty && styles.disabledSave]}>저장</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Section with Blur Background */}
          <View style={styles.topSection}>
            <Image 
              source={{ uri: book.coverImageUrl }} 
              style={[styles.backgroundImage, StyleSheet.absoluteFill]} 
              blurRadius={10}
            />
            <View style={[styles.overlay, StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)' }]} />
            
            <View style={styles.bookInfoContainer}>
              <View style={styles.coverWrapper}>
                <Image 
                  source={{ uri: book.coverImageUrl }} 
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author}</Text>
            </View>
          </View>

          <View style={[styles.contentArea, { backgroundColor: colors.background }]}>
            
            {/* Description Card */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>책 소개</Text>
              <Text style={[styles.bookDescription, { color: colors.textMuted }]}>
                {book.description}
              </Text>
            </View>

            {/* Rating */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.centerRow}>
                <StarRating 
                  rating={review.rating || 0} 
                  setRating={(r) => updateReview('rating', r)} 
                />
              </View>
            </View>

             {/* Status & Options */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.text }]}>독서 상태</Text>
              {/* Simple dropdown simulation */}
              <View style={styles.statusRow}>
                  {Object.entries(statusOptions).map(([key, label]) => (
                      <TouchableOpacity 
                        key={key} 
                        onPress={() => handleStatusChange(key as ReadingStatus)}
                        style={[
                            styles.statusChip, 
                            { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                            review.status === key && (isDark ? { backgroundColor: '#064E3B', borderColor: colors.primary, borderWidth: 1 } : styles.activeStatusChip)
                        ]}
                      >
                          <Text style={[
                              styles.statusText,
                              { color: colors.textMuted },
                              review.status === key && (isDark ? { color: colors.primary, fontWeight: 'bold' } : styles.activeStatusText)
                          ]}>{label}</Text>
                      </TouchableOpacity>
                  ))}
              </View>

              <Text style={[styles.label, { color: colors.text }]}>한 줄 평</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: isDark ? colors.border : '#F1F5F9', color: colors.text }]}
                value={review.one_line_review || ""}
                onChangeText={(text) => updateReview('one_line_review', text)}
                placeholder="짧은 감상평을 남겨주세요"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => updateReview('is_rereading', !review.is_rereading)}
              >
                  <View style={[styles.checkbox, { borderColor: colors.border }, review.is_rereading && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {review.is_rereading && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: colors.textMuted }]}>다시 읽고 싶은 책으로 표시</Text>
              </TouchableOpacity>
            </View>

            {/* Quotes */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>인상 깊은 구절</Text>
              </View>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={addQuote} style={[styles.addButton, { backgroundColor: isDark ? colors.border : '#ECFDF5' }]}>
                    <Text style={[styles.addButtonIcon, { color: colors.primary }]}>+</Text>
                    <Text style={[styles.addButtonText, { color: colors.primary }]}>인용구 추가</Text>
                </TouchableOpacity>
                
                <View style={styles.mediaButtonRow}>
                  <TouchableOpacity onPress={handleCamera} style={[styles.mediaButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}>
                     <CameraIcon size={20} color={colors.primary} />
                     <Text style={[styles.mediaButtonText, { color: colors.text }]}>카메라</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handlePickImage} style={[styles.mediaButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}>
                     <PhotoIcon size={20} color={colors.primary} />
                     <Text style={[styles.mediaButtonText, { color: colors.text }]}>갤러리</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.listContainer}>
                  {review.memorable_quotes?.map((quote, idx) => (
                      <QuoteCard 
                          key={idx}
                          quote={quote}
                          onChange={(field, val) => updateQuote(idx, field, val)}
                          onDelete={() => deleteQuote(idx)}
                          initialIsEditing={idx === newlyAddedQuoteIndex}
                      />
                  ))}
              </View>
            </View>

             {/* Memos */}
             <View style={[styles.card, { backgroundColor: colors.card }]}>
               <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>메모</Text>
              </View>
              
              <TouchableOpacity onPress={addMemo} style={[styles.addButton, { backgroundColor: isDark ? colors.border : '#ECFDF5' }]}>
                  <Text style={[styles.addButtonText, { color: colors.primary }]}>+ 메모 추가</Text>
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

            {/* Delete Button */}
            <TouchableOpacity 
                onPress={handleDelete} 
                style={[styles.deleteButton, { backgroundColor: isDark ? '#451a1a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FEE2E2' }]}
                disabled={isDeleting.current}
            >
                <TrashIcon size={20} color="#EF4444" />
                <Text style={styles.deleteButtonText}>독서 기록 삭제하기</Text>
            </TouchableOpacity>

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
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  card: {
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
    marginBottom: 8,
  },
  bookDescription: {
    fontSize: 14,
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
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
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
  },
  activeStatusChip: {
    backgroundColor: '#DCFCE7', // green-100
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  statusText: {
    fontSize: 13,
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
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
  },
  checkboxCheck: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  
  // Lists
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
  addButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  mediaButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mediaButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 24,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
