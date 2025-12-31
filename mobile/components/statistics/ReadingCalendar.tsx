import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Dimensions,
  Modal,
  ScrollView
} from "react-native";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  isToday, 
  isSameMonth 
} from "date-fns";
import { ko } from "date-fns/locale";
import { useTheme } from "../../context/ThemeContext";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "../Icons";
import { RatingDisplay } from "../RatingDisplay";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

interface ReadingCalendarProps {
  books: UserBook[];
}

interface DailyBook {
  book: UserBook;
  count: number;
}

export default function ReadingCalendar({ books }: ReadingCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { colors, isDark } = useTheme();

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: ko });
    const calendarEnd = endOfWeek(monthEnd, { locale: ko });

    const calendarDays = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    const booksMap = new Map<string, UserBook[]>();

    books.forEach((book) => {
      if (
        book.status === ReadingStatus.Finished &&
        book.end_date
      ) {
        // Use the date string directly to avoid timezone shifts
        // book.end_date is YYYY-MM-DD
        const dateKey = book.end_date;
        
        // Also ensure we only include books that actually belong to the currently viewed month?
        // Actually, the map is used for displayed days.
        // But we need to make sure the calendar builds dates correctly? 
        // No, current logic iterates `books` and places them into `booksMap` by `dateKey`.
        // Then the calendar grid renders days.
        
        // The issue: 
        // book.end_date = "2024-05-01"
        // Previous logic: new Date("2024-05-01") might be April 30th in some timezones if treated as UTC.
        // format(endDate, "yyyy-MM-dd") might output "2024-04-30".
        
        // Fix: Use the string directly as the key.
        if (!booksMap.has(dateKey)) {
            booksMap.set(dateKey, []);
        }
        booksMap.get(dateKey)!.push(book);
      }
    });

    return { calendarDays, booksMap };
  }, [books, currentDate]);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getDayBooks = (day: Date): DailyBook | null => {
    const dateKey = format(day, "yyyy-MM-dd");
    const booksOnDay = calendarData.booksMap.get(dateKey);
    if (!booksOnDay || booksOnDay.length === 0) return null;
    return {
      book: booksOnDay[booksOnDay.length - 1],
      count: booksOnDay.length,
    };
  };

  const getBooksForDate = (date: Date): UserBook[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return calendarData.booksMap.get(dateKey) || [];
  };

  const handleDateClick = (day: Date) => {
    const booksOnDay = getBooksForDate(day);
    if (booksOnDay.length > 0) {
      setSelectedDate(day);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedDate(null), 200);
  };

  const handleBookClick = (book: UserBook) => {
    router.push(`/book-record/${book.books.id}`);
    handleCloseModal();
  };


  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>독서 캘린더</Text>
        <View style={[styles.nav, { backgroundColor: isDark ? colors.border : '#F8FAFC' }]}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <ChevronLeftIcon size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.dateText, { color: colors.text }]}>
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRightIcon size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {/* Days Header */}
        <View style={styles.daysHeader}>
          {weekDays.map((day) => (
            <Text key={day} style={[styles.dayLabel, { color: colors.textMuted }]}>{day}</Text>
          ))}
        </View>

        {/* Date Cells */}
        <View style={styles.cellsContainer}>
          {calendarData.calendarDays.map((day, index) => {
            const isCurrentM = isSameMonth(day, currentDate);
            if (!isCurrentM) {
              return <View key={index} style={styles.emptyCell} />;
            }

            const dailyBook = getDayBooks(day);
            const isTodayDate = isToday(day);
            const hasBooks = dailyBook !== null;

            return (
              <TouchableOpacity 
                key={index} 
                style={styles.cell}
                onPress={() => handleDateClick(day)}
                disabled={!hasBooks}
              >
                <View 
                  style={[
                    styles.cellContent,
                    hasBooks ? (isDark ? { backgroundColor: colors.border } : styles.cellWithBook) : (isDark ? { backgroundColor: colors.background } : styles.cellEmpty),
                    isTodayDate && (isDark ? { backgroundColor: colors.primary } : styles.todayCell)
                  ]}
                >
                  {hasBooks && dailyBook && (
                    <>
                      <Image 
                        source={{ uri: dailyBook.book.books.cover_image_url }} 
                        style={styles.coverImage}
                        resizeMode="cover"
                      />
                      <View style={styles.overlay} />
                    </>
                  )}
                  
                  <Text 
                    style={[
                      styles.dateNumber,
                      isTodayDate ? (isDark ? { color: '#000' } : styles.todayText) : hasBooks ? styles.bookDateText : { color: colors.textMuted }
                    ]}
                  >
                    {format(day, "d")}
                  </Text>

                  {dailyBook && dailyBook.count > 1 && (
                    <View style={[styles.badge, { backgroundColor: isDark ? colors.card : 'rgba(255, 255, 255, 0.95)' }]}>
                      <Text style={[styles.badgeText, { color: colors.text }]}>+{dailyBook.count - 1}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Modal */}
      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15, 23, 42, 0.2)' }]} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          
          <View style={[styles.modalContent, { backgroundColor: colors.card, shadowColor: '#000' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: isDark ? colors.border : '#FAFAFA', borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Read on</Text>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedDate && format(selectedDate, "yyyy년 M월 d일", { locale: ko })}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={[styles.closeButton, { backgroundColor: colors.card, shadowColor: '#000' }]}>
                <XMarkIcon size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Book List */}
            <ScrollView style={[styles.bookList, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]} showsVerticalScrollIndicator={false}>
              {selectedDate && getBooksForDate(selectedDate).map((book) => (
                <TouchableOpacity
                  key={book.id}
                  style={[styles.bookCard, { backgroundColor: colors.card, shadowColor: '#000' }]}
                  onPress={() => handleBookClick(book)}
                >
                  <Image 
                    source={{ uri: book.books.cover_image_url }}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                  <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
                      {book.books.title}
                    </Text>
                    <Text style={[styles.bookAuthor, { color: colors.textMuted }]} numberOfLines={1}>
                      {book.books.author}
                    </Text>
                    <View style={styles.ratingContainer}>
                      {book.rating && book.rating > 0 ? (
                        <RatingDisplay rating={book.rating} size={14} />
                      ) : (
                        <Text style={[styles.noRating, { color: colors.textMuted }]}>No rating</Text>
                      )}
                    </View>
                  </View>
                  <ChevronRightIcon size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 4,
  },
  navButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 90,
    textAlign: 'center',
  },
  grid: {
    width: '100%',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cellsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: (width - 48 - 48 - 48) / 7,
    aspectRatio: 1,
  },
  emptyCell: {
    width: (width - 48 - 48 - 48) / 7,
    aspectRatio: 1,
  },
  cellContent: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cellEmpty: {
    backgroundColor: '#F8FAFC',
  },
  cellWithBook: {
    backgroundColor: '#E2E8F0',
  },
  todayCell: {
    backgroundColor: '#1E293B',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dateNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    zIndex: 1,
  },
  todayText: {
    color: '#FFFFFF',
  },
  bookDateText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 2,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '70%',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookList: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookCover: {
    width: 64,
    height: 96,
    borderRadius: 8,
    marginRight: 16,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noRating: {
    fontSize: 12,
  },
});
