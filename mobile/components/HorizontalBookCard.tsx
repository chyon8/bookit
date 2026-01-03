import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { UserBook, ReadingStatus } from "../hooks/useBooks";
import { StarIcon } from "./Icons";

interface HorizontalBookCardProps {
  book: UserBook;
  onPress: (book: UserBook) => void;
  onDelete: (id: string, title: string) => void;
}

import { useTheme } from "../context/ThemeContext";

export function HorizontalBookCard({ book, onPress, onDelete }: HorizontalBookCardProps) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity 
      style={styles.horizontalCard}
      onPress={() => onPress(book)}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]}>
        <Image
          source={{ uri: book.books.cover_image_url }}
          style={styles.bookImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardTextContainer}>
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
        <View style={styles.statusContainer}>
          {book.status === ReadingStatus.Reading && book.start_date ? (
            <Text style={[styles.readingStatus, { color: colors.primary }]}>
              {Math.floor((new Date().setHours(0,0,0,0) - new Date(book.start_date).setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)) + 1}일째 읽는중
            </Text>
          ) : (
            <View style={styles.ratingContainer}>
              {(book.rating && book.rating > 0) ? (
                <>
                  <Text style={[styles.ratingText, { color: colors.text }]}>{book.rating.toFixed(1)}</Text>
                  <StarIcon size={12} color="#FACC15" />
                </>
              ) : (
                <Text style={[styles.ratingText, { color: colors.textMuted, fontWeight: 'normal', fontSize: 11 }]}>평점 없음</Text>
              )}
            </View>
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
  cardTextContainer: {
    paddingVertical: 8,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2, 
    height: 20, 
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 12,
    height: 16,
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
