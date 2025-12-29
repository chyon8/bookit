import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { UserBook, ReadingStatus } from "../hooks/useBooks";
import { TrashIcon, StarIcon } from "./Icons";

interface HorizontalBookCardProps {
  book: UserBook;
  onPress: (book: UserBook) => void;
  onDelete: (id: string, title: string) => void;
}

import { useTheme } from "../context/ThemeContext";

export function HorizontalBookCard({ book, onPress, onDelete }: HorizontalBookCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity 
      style={styles.horizontalCard}
      onPress={() => onPress(book)}
      activeOpacity={0.7}
      {...(Platform.OS === 'web' ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      } : {
        onPressIn: () => setIsHovered(true),
        onPressOut: () => setIsHovered(false),
      })}
    >
      <View style={[styles.imageContainer, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]}>
        <Image
          source={{ uri: book.books.cover_image_url }}
          style={styles.bookImage}
          resizeMode="cover"
        />
        {isHovered && (
          <TouchableOpacity 
            style={[styles.deleteIconButtonSmall, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)' }]} 
            onPress={(e) => {
              e.stopPropagation();
              onDelete(book.id, book.books.title);
            }}
            activeOpacity={0.6}
          >
            <TrashIcon size={14} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>{book.books.title}</Text>
        <Text style={[styles.bookAuthor, { color: colors.textMuted }]} numberOfLines={1}>
          {book.books.author?.split("(지은이")[0].trim()}
        </Text>
        <View style={styles.statusContainer}>
          {book.status === ReadingStatus.Reading && book.start_date ? (
            <Text style={[styles.readingStatus, { color: colors.primary }]}>
              {Math.floor((new Date().setHours(0,0,0,0) - new Date(book.start_date).setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)) + 1}일째 읽는중
            </Text>
          ) : (book.rating && book.rating > 0) ? (
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingText, { color: colors.text }]}>{book.rating.toFixed(1)}</Text>
              <StarIcon size={12} color="#FACC15" />
            </View>
          ) : (
            <View />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  horizontalCard: {
    width: 140,
  },
  imageContainer: {
    aspectRatio: 2/3,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  bookImage: {
    width: '100%',
    height: '100%',
  },
  deleteIconButtonSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 20,
  },
  cardTextContainer: {
    paddingVertical: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    height: 40, // 2 lines * 20
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 12,
    height: 16, // 1 line * 16
    lineHeight: 16,
  },
  statusContainer: {
    height: 16,
    justifyContent: 'center',
    marginTop: 4,
  },
  readingStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 2,
  },
});
