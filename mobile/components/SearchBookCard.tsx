import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { StarIcon } from "./Icons";
import { BookWithReview } from "../hooks/useBooks";

interface SearchBookCardProps {
  book: BookWithReview & { isInBookshelf?: boolean };
  onSelect: (book: BookWithReview) => void;
}

import { useTheme } from "../context/ThemeContext";

export const SearchBookCard: React.FC<SearchBookCardProps> = ({ book, onSelect }) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onSelect(book)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: book.coverImageUrl }}
        style={[styles.cover, { backgroundColor: isDark ? colors.border : "#E5E7EB" }]}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
            <View style={styles.textColumn}>
                <Text style={[styles.category, { color: colors.textMuted }]}>{book.category}</Text>
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{book.title}</Text>
                <Text style={[styles.author, { color: colors.textMuted }]} numberOfLines={1}>저자: {book.author}</Text>
            </View>
             {book.isInBookshelf && (
                <View style={[styles.badge, { backgroundColor: isDark ? "#064E3B" : "#ECFDF5" }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>내 서재에 있음</Text>
                </View>
             )}
        </View>

        <View style={styles.ratingRow}>
          {book.review && book.review.rating && book.review.rating > 0 ? (
            <>
              <Text style={[styles.ratingText, { color: colors.text }]}>{book.review.rating.toFixed(1)}</Text>
              <StarIcon size={16} color="#FACC15" />
            </>
          ) : (
            <Text style={[styles.ratingText, { color: colors.textMuted, fontWeight: 'normal' }]}>평점 없음</Text>
          )}
        </View>

        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {book.description}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
  },
  cover: {
    width: 80,
    height: 112,
    borderRadius: 6,
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
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
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
    marginRight: 4,
    fontSize: 14,
  },
  description: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
});
