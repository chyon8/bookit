import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { UserBook, ReadingStatus } from "../hooks/useBooks";
import { StarIcon } from "./Icons";

interface BookCardProps {
  book: UserBook;
  onSelect?: (book: UserBook) => void;
  onDelete?: (bookId: string, bookTitle: string) => void;
  showStatusBadge?: boolean;
}

export function BookCard({ book, onSelect, showStatusBadge }: BookCardProps) {
  const handleSelect = () => {
    onSelect?.(book);
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
          <Text style={styles.readingStatus}>{diffDays}일째 읽는중</Text>
        </View>
      );
    }

    if (rating && rating > 0) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          <StarIcon size={16} color="#FACC15" />
        </View>
      );
    }

    return <View style={styles.statusPlaceholder} />;
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      activeOpacity={0.7}
      onPress={handleSelect}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
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
      </View>
      
      {/* Text Container */}
      <View style={styles.textContainer}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.books.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
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
    backgroundColor: '#FFFFFF',
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
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    height: 20,
  },
  statusPlaceholder: {
    height: 20,
    marginTop: 4,
  },
  readingStatus: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4ADE80',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#03314B',
    marginRight: 4,
  },
});
