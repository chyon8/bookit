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
import { UserBook, ReadingStatus } from "../../hooks/useBooks";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "../Icons";
import { RatingDisplay } from "../RatingDisplay";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 32 - 48) / 7; // Adjusted for padding and gaps

interface ReadingCalendarProps {
  books: UserBook[];
  theme: "light" | "dark";
}

interface DailyBook {
  book: UserBook;
  count: number;
}

export default function ReadingCalendar({ books, theme }: ReadingCalendarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        const endDate = new Date(book.end_date);
        if (!isNaN(endDate.getTime())) {
          const dateKey = format(endDate, "yyyy-MM-dd");
          if (!booksMap.has(dateKey)) {
            booksMap.set(dateKey, []);
          }
          booksMap.get(dateKey)!.push(book);
        }
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
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>독서 캘린더</Text>
        <View style={styles.nav}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <ChevronLeftIcon size={16} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {format(currentDate, "yyyy년 M월", { locale: ko })}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRightIcon size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {/* Days Header */}
        <View style={styles.daysHeader}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.dayLabel}>{day}</Text>
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
                    hasBooks ? styles.cellWithBook : styles.cellEmpty,
                    isTodayDate && styles.todayCell
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
                      isTodayDate ? styles.todayText : hasBooks ? styles.bookDateText : styles.emptyDateText
                    ]}
                  >
                    {format(day, "d")}
                  </Text>

                  {dailyBook && dailyBook.count > 1 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>+{dailyBook.count - 1}</Text>
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
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={handleCloseModal}
          />
          
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>Read on</Text>
                <Text style={styles.modalTitle}>
                  {selectedDate && format(selectedDate, "yyyy년 M월 d일", { locale: ko })}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <XMarkIcon size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Book List */}
            <ScrollView style={styles.bookList} showsVerticalScrollIndicator={false}>
              {selectedDate && getBooksForDate(selectedDate).map((book) => (
                <TouchableOpacity
                  key={book.id}
                  style={styles.bookCard}
                  onPress={() => handleBookClick(book)}
                >
                  <Image 
                    source={{ uri: book.books.cover_image_url }}
                    style={styles.bookCover}
                    resizeMode="cover"
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.books.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {book.books.author}
                    </Text>
                    <View style={styles.ratingContainer}>
                      {book.rating && book.rating > 0 ? (
                        <RatingDisplay rating={book.rating} size={14} />
                      ) : (
                        <Text style={styles.noRating}>No rating</Text>
                      )}
                    </View>
                  </View>
                  <ChevronRightIcon size={20} color="#94A3B8" />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
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
    color: '#1E293B',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 4,
  },
  navButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
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
    color: '#94A3B8',
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
  emptyDateText: {
    color: '#94A3B8',
  },
  badge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 2,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '70%',
    overflow: 'hidden',
    shadowColor: '#000',
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
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookList: {
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
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
    color: '#1E293B',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 14,
    color: '#FBBF24',
  },
  noRating: {
    fontSize: 12,
    color: '#CBD5E1',
  },
});
