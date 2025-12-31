import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { UserBook, ReadingStatus } from "../hooks/useBooks";
import { StarIcon, TrashIcon } from "./Icons";

interface BookCardProps {
  book: UserBook;
  onSelect?: (book: UserBook) => void;
  onDelete?: (bookId: string, bookTitle: string) => void;
  showStatusBadge?: boolean;
}

import { useTheme } from "../context/ThemeContext";

export function BookCard({ book, onSelect, onDelete, showStatusBadge }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { colors, isDark } = useTheme();

  const handleSelect = () => {
    onSelect?.(book);
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    onDelete?.(book.id, book.books.title);
  };

  const status = book.status;
  const rating = book.rating;
  const startDate = book.start_date;

  const renderStatusInfo = () => {
    if (status === ReadingStatus.Reading && startDate) {
      const start = new Date(startDate);
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

      return (
        <View style={styles.statusContainer}>
          <Text style={[styles.readingStatus, { color: colors.primary }]}>{diffDays}일째 읽는중</Text>
        </View>
      );
    }

    if (rating && rating > 0) {
      return (
        <View style={styles.statusContainer}>
          <Text style={[styles.ratingText, { color: colors.text }]}>{rating.toFixed(1)}</Text>
          <StarIcon size={16} color="#FACC15" />
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        <Text style={[styles.ratingText, { color: colors.textMuted, fontWeight: 'normal' }]}>평점 없음</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.7}
      onPress={handleSelect}
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } : {
        onPressIn: () => setIsHovered(true),
        onPressOut: () => setIsHovered(false),
      })}
    >
      {/* Image Container */}
      <View style={[styles.imageContainer, { backgroundColor: isDark ? colors.border : '#E5E7EB', borderColor: isDark ? colors.border : '#E5E7EB' }]}>
        {showStatusBadge && status === ReadingStatus.Dropped && (
          <View style={styles.droppedBadge}>
            <Text style={styles.droppedText}>중단</Text>
          </View>
        )}
        <Image
          source={{ uri: book.books.cover_image_url }}
          style={styles.bookImage}
          resizeMode="cover"
        />
        {isHovered && (
          <TouchableOpacity 
            style={[styles.deleteIconButton, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]} 
            onPress={handleDelete}
            activeOpacity={0.6}
          >
            <TrashIcon size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Text Container */}
      <View style={[styles.textContainer, { backgroundColor: colors.background }]}>
        <Text 
          style={[styles.bookTitle, { color: colors.text }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {book.books.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: colors.textMuted }]} numberOfLines={1}>
          {book.books.author?.split("(지은이")[0].trim()}
        </Text>
        {renderStatusInfo()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    aspectRatio: 2/3,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  droppedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    zIndex: 10,
  },
  droppedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  textContainer: {
    padding: 8,
    paddingBottom: 4, 
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 0, 
    height: 20, 
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 12,
    marginTop: 0,
    marginBottom: 4,
    height: 16,
    lineHeight: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    height: 20,
  },
  statusPlaceholder: {
    height: 20,
    marginTop: 2,
  },
  readingStatus: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  deleteIconButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
});
