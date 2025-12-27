import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { StarIcon } from "./Icons";
import { BookWithReview } from "../hooks/useBooks";

interface SearchBookCardProps {
  book: BookWithReview & { isInBookshelf?: boolean };
  onSelect: (book: BookWithReview) => void;
}

export const SearchBookCard: React.FC<SearchBookCardProps> = ({ book, onSelect }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelect(book)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: book.coverImageUrl }}
        style={styles.cover}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
            <View style={styles.textColumn}>
                <Text style={styles.category}>{book.category}</Text>
                <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.author} numberOfLines={1}>저자: {book.author}</Text>
            </View>
             {book.isInBookshelf && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>내 서재에 있음</Text>
                </View>
             )}
        </View>

        {book.review && book.review.rating && book.review.rating > 0 ? (
           <View style={styles.ratingRow}>
             <Text style={styles.ratingText}>{book.review.rating.toFixed(1)}</Text>
             <StarIcon size={16} color="#FACC15" />
           </View>
        ) : null}

        <Text style={styles.description} numberOfLines={2}>
          {book.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cover: {
    width: 80,
    height: 112,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
  },
  content: {
    flex: 1,
    marginLeft: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textColumn: {
      flex: 1,
      marginRight: 8,
  },
  category: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    color: "#475569",
  },
  badge: {
    backgroundColor: "#ECFDF5", // primary/10
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: "#10B981", // primary
    fontSize: 10,
    fontWeight: "bold",
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontWeight: "bold",
    color: "#1E293B",
    marginRight: 4,
    fontSize: 14,
  },
  description: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
    lineHeight: 18,
  },
});
