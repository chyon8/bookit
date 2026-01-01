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
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useBookData, useUpdateBookReview, useDeleteBook } from "../../hooks/useBookData";
import { UserBook, ReadingStatus, MemorableQuote, Memo } from "../../hooks/useBooks";
import { useReadingSessions, useCreateReadingSession } from "../../hooks/useReadingSessions";
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
  
  // Fetch reading sessions for this book
  const { data: readingSessions } = useReadingSessions(book?.review?.id || "");
  const createSessionMutation = useCreateReadingSession();

  const [review, setReview] = useState<Partial<UserBook>>({});
  const [isDirty, setIsDirty] = useState(false);
  const initialReviewState = useRef<string>("");
  const isSaving = useRef(false);
  const isDeleting = useRef(false);
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

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

  // DatePicker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'start_date' | 'end_date' | null>(null);
  
  const handleDatePress = (field: 'start_date' | 'end_date') => {
    setActiveDateField(field);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate && activeDateField) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Validation: end_date cannot be earlier than start_date
      if (activeDateField === 'end_date' && review.start_date && formattedDate < review.start_date) {
        Alert.alert("날짜 확인", "완료일은 시작일보다 빠를 수 없습니다.");
        if (Platform.OS === 'ios') setShowDatePicker(false);
        return;
      }
      
      // Validation: start_date cannot be later than end_date
      if (activeDateField === 'start_date' && review.end_date && formattedDate > review.end_date) {
        Alert.alert("날짜 확인", "시작일은 완료일보다 늦을 수 없습니다.");
        if (Platform.OS === 'ios') setShowDatePicker(false);
        return;
      }

      updateReview(activeDateField, formattedDate);
    } else if (event.type === 'dismissed') {
       setShowDatePicker(false);
    }
  };

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
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
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
  
      if (newStatus === ReadingStatus.Reading) {
        if (!review.start_date || oldStatus === ReadingStatus.WantToRead) {
           updates.start_date = today;
        }
      }
  
      if (newStatus === ReadingStatus.Finished || newStatus === ReadingStatus.Dropped) {
         updates.end_date = today;
         // Ensure start_date is not after end_date (today)
         if (!review.start_date || review.start_date > today) {
           updates.start_date = today;
         }
      }
      
      setReview(prev => ({ ...prev, ...updates }));
  };

  // Quote Handlers
  const addQuote = () => {
    // Format date as YYYY-MM-DD HH:mm
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newQuote: MemorableQuote = { 
      quote: "", 
      page: "", 
      thought: "",
      date: formattedDate
    };
    
    setReview(prev => {
      const newQuotes = [...(prev.memorable_quotes || []), newQuote];
      setNewlyAddedQuoteIndex(newQuotes.length - 1);
      return {
        ...prev,
        memorable_quotes: newQuotes
      };
    });
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
        allowsEditing: false, // Customized in ScanPreviewModal
        quality: 1, 
        base64: true, 
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
        allowsEditing: false,
        quality: 1,
        base64: true, 
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
      scrollViewRef.current?.scrollToEnd({ animated: true });
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
      <Stack.Screen options={{ 
        headerShown: false,
        gestureEnabled: !isDirty // Disable swipe gesture when dirty to avoid native conflict
      }} />
      
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
        onUpdateImage={(uri, base64) => {
            setScanImageBase64(base64);
        }}
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
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
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

              {/* Reading History Timeline - Combined Current + Past */}
              <View>
                <Text style={[styles.label, { color: colors.text }]}>독서 기록</Text>
                <ScrollView 
                  style={[styles.historyContainer, { maxHeight: 220 }]} 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  {(() => {
                    // Calculate current session number
                    const archiveCount = readingSessions?.length || 0;
                    const latestArchive = readingSessions?.[0];
                    
                    // Check if this is a genuine re-read or just duplicate from migration
                    // A genuine re-read means: archives exist with Finished/Dropped status, and current is Reading
                    const isGenuineReread = 
                      archiveCount > 0 && 
                      review.status === ReadingStatus.Reading && 
                      latestArchive?.status !== ReadingStatus.Reading;
                    
                    // Check if archive is just a duplicate of current state (from migration)
                    const isDuplicateFromMigration = 
                      archiveCount > 0 && 
                      !isGenuineReread;
                    
                    // Determine what to show:
                    // If the current status is Finished or Dropped, we want to show it in the history
                    // so that users can see their changes immediately.
                    const shouldShowCurrentSession = 
                      (review.status === ReadingStatus.Finished || review.status === ReadingStatus.Dropped);
                    
                    const currentSessionNumber = isGenuineReread ? archiveCount + 1 : 1;

                    // Create current session object from review state
                    const currentSession = shouldShowCurrentSession ? {
                      id: 'current',
                      session_number: currentSessionNumber,
                      status: review.status,
                      start_date: review.start_date,
                      end_date: review.end_date,
                      rating: review.rating,
                      isCurrent: true
                    } : null;

                    // If we are showing the current session and it's not a genuine new reread (i.e., we are editing 
                    // the latest record), we should exclude the corresponding archive from the list 
                    // to avoid duplication and show the live version.
                    // If isGenuineReread is true, currentSession is NEW text to the archives.
                    // If isGenuineReread is false, currentSession replaces the latest archive.
                    const archivesToShow = (readingSessions || []).filter((_, index) => {
                         if (shouldShowCurrentSession && !isGenuineReread && index === 0) return false;
                         return true;
                    });

                    const allSessions = [
                      ...(currentSession ? [currentSession] : []),
                      ...archivesToShow
                    ].filter((s: any) => s.status === ReadingStatus.Finished || s.status === ReadingStatus.Dropped);

                    if (allSessions.length === 0) return <Text style={{ color: colors.textMuted, marginTop: 8 }}>기록된 독서 활동이 없습니다.</Text>;

                    return allSessions.map((session: any, index) => {
                      const isFirst = index === 0;
                      const statusLabel = 
                        session.status === ReadingStatus.Reading ? "읽는 중" :
                        session.status === ReadingStatus.Finished ? "완독" :
                        session.status === ReadingStatus.Dropped ? "중단" : "";
                      
                      return (
                        <View key={session.id} style={styles.historyItem}>
                          <View style={styles.historyMarker}>
                            <View style={[
                              styles.historyDot, 
                              { backgroundColor: isFirst ? colors.primary : colors.textMuted }
                            ]} />
                            {index < allSessions.length - 1 && (
                              <View style={[styles.historyLine, { backgroundColor: colors.border }]} />
                            )}
                          </View>
                          <View style={[
                            styles.historyContent,
                            { backgroundColor: isDark ? colors.border : '#F1F5F9' }
                          ]}>
                            <View style={styles.historyHeader}>
                              <Text style={[styles.historySession, { color: colors.text }]}>
                                {session.session_number}회차
                                {session.isCurrent && <Text style={{fontSize: 12, fontWeight: 'normal', color: colors.primary}}> (현재)</Text>}
                              </Text>
                              <Text style={[styles.historyStatus, { 
                                color: session.status === ReadingStatus.Finished ? colors.primary : colors.textMuted 
                              }]}>
                                {statusLabel}
                              </Text>
                            </View>
                            <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                              {session.start_date || "시작일 미정"} ~ {session.end_date || (session.status === ReadingStatus.Reading ? "(진행 중)" : "")}
                            </Text>
                            <Text style={[styles.historyRating, { color: session.rating && session.rating > 0 ? colors.text : colors.textMuted, fontWeight: session.rating && session.rating > 0 ? 'bold' : 'normal' }]}>
                              {session.rating && session.rating > 0 ? `★ ${session.rating.toFixed(1)}` : "평점 없음"}
                            </Text>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </ScrollView>
              </View>

              {/* Current session date inputs (editable) */}
              {(review.status === ReadingStatus.Reading || 
                review.status === ReadingStatus.Finished || 
                review.status === ReadingStatus.Dropped) && (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>현재 독서 기간</Text>
                  <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                      <Text style={[styles.dateLabel, { color: colors.textMuted }]}>시작일</Text>
                      <TouchableOpacity 
                        style={[styles.dateInput, { backgroundColor: isDark ? colors.border : '#F1F5F9', justifyContent: 'center' }]}
                        onPress={() => handleDatePress('start_date')}
                      >
                        <Text style={{ color: review.start_date ? colors.text : colors.textMuted }}>
                          {review.start_date || "YYYY-MM-DD"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {(review.status === ReadingStatus.Finished || review.status === ReadingStatus.Dropped) && (
                      <View style={styles.dateInputContainer}>
                        <Text style={[styles.dateLabel, { color: colors.textMuted }]}>
                          {review.status === ReadingStatus.Finished ? "완독일" : "중단일"}
                        </Text>
                         <TouchableOpacity 
                          style={[styles.dateInput, { backgroundColor: isDark ? colors.border : '#F1F5F9', justifyContent: 'center' }]}
                          onPress={() => handleDatePress('end_date')}
                        >
                          <Text style={{ color: review.end_date ? colors.text : colors.textMuted }}>
                            {review.end_date || "YYYY-MM-DD"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  
                  {showDatePicker && (
                    <DateTimePicker
                    locale="ko-KR" 
                      testID="dateTimePicker"
                      value={(() => {
                        const dateString = activeDateField === 'start_date' ? review.start_date : review.end_date;
                        return dateString ? new Date(dateString) : new Date();
                      })()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()} // Future dates allowed? Maybe limit to today for reading records. Let's limit to today.
                    />
                  )}

                </>
              )}

              {/* Start Reread Button - Show for finished or dropped books */}
              {(review.status === ReadingStatus.Finished || review.status === ReadingStatus.Dropped) && (
                <TouchableOpacity 
                  style={[styles.rereadButton, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: colors.primary }]}
                  onPress={() => {
                    showConfirmModal(
                      "다시 읽기 시작",
                      "이 책을 다시 읽으시겠어요? 현재 기록은 히스토리에 저장됩니다.",
                      async () => {
                        // Implementation: Save current session and start new reading
                        try {
                          const archiveCount = readingSessions?.length || 0;
                          // If current is 1st reading (0 archive), we save it as session #1.
                          // If current is 2nd reading (1 archive), we save it as session #2.
                          const sessionNumberToArchive = archiveCount + 1;
                          const nextSessionNumber = sessionNumberToArchive + 1;
                          
                          // Save current session to history
                          await createSessionMutation.mutateAsync({
                            userBookId: book.review.id,
                            sessionNumber: sessionNumberToArchive,
                            startDate: review.start_date || null,
                            endDate: review.end_date || null,
                            rating: review.rating || null,
                            status: review.status || null, // Save actual status (Finished or Dropped)
                          });

                          // Reset current session: new start date, clear end date, change status to Reading
                          const today = new Date().toISOString().split("T")[0];
                          setReview(prev => ({
                            ...prev,
                            status: ReadingStatus.Reading,
                            start_date: today,
                            end_date: null,
                          }));

                          Alert.alert("성공", `${nextSessionNumber}회차 독서를 시작합니다!`);
                        } catch (e) {
                          console.error("Error creating reading session:", e);
                          Alert.alert("오류", "세션 생성 중 문제가 발생했습니다.");
                        }
                      },
                      { confirmText: "시작하기" }
                    );
                  }}
                >
                  <Text style={[styles.rereadButtonText, { color: colors.primary }]}>📚 다시 읽기</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.label, { color: colors.text }]}>한 줄 평</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: isDark ? colors.border : '#F1F5F9', color: colors.text, minHeight: 100, textAlignVertical: 'top' }]}
                value={review.one_line_review || ""}
                onChangeText={(text) => updateReview('one_line_review', text)}
                placeholder="책에 대한 짧은 감상평이나 기억하고 싶은 내용을 남겨주세요"
                placeholderTextColor={colors.textMuted}
                multiline={true}
              />

              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => updateReview('reread_will', !review.reread_will)}
              >
                  <View style={[styles.checkbox, { borderColor: colors.border }, review.reread_will && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {review.reread_will && <Text style={styles.checkboxCheck}>✓</Text>}
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
              
              <TouchableOpacity onPress={addMemo} style={[styles.addButton, { backgroundColor: isDark ? colors.border : '#ECFDF5', marginBottom: 12 }]}>
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
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 22,
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
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  // Reading History Timeline
  historyContainer: {
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  historyMarker: {
    alignItems: 'center',
    marginRight: 12,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  historyLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historySession: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyRating: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  rereadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  rereadButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
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
