import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { UserBook } from "../hooks/useBooks";
import { TrashIcon } from "./Icons";

interface HorizontalBookCardProps {
  book: UserBook;
  onPress: (book: UserBook) => void;
  onDelete: (id: string, title: string) => void;
}

export function HorizontalBookCard({ book, onPress, onDelete }: HorizontalBookCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: book.books.cover_image_url }}
          style={styles.bookImage}
          resizeMode="cover"
        />
        {isHovered && (
          <TouchableOpacity 
            style={styles.deleteIconButtonSmall} 
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
        <Text style={styles.bookTitle} numberOfLines={2}>{book.books.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {book.books.author?.split("(지은이")[0].trim()}
        </Text>
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
    color: '#03314B',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#475569',
  },
});
