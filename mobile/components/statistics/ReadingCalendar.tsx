import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Dimensions,
  Modal
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
  const [currentDate, setCurrentDate] = useState(new Date());

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
              <View key={index} style={styles.cell}>
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
              </View>
            );
          })}
        </View>
      </View>
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
    width: (width - 48 - 48 - 48) / 7, // Adjusting for padding and gaps
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
  }
});
