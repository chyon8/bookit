import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { UserBook } from '../hooks/useBooks';

export interface SearchResultItem {
  type: 'memo' | 'quote';
  content: string;
  subContent?: string; // 인용구의 "나의 생각" 또는 페이지
  page?: string;
  date?: string;
  book: UserBook;
}

interface SearchResultCardProps {
  item: SearchResultItem;
  query: string;
  onPress: () => void;
}

// 키워드 하이라이트 함수
const HighlightText: React.FC<{ text: string; query: string; color: string; highlightColor: string }> = ({
  text,
  query,
  color,
  highlightColor,
}) => {
  if (!query.trim()) {
    return <Text style={{ color }}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <Text style={{ color }}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={index} style={{ backgroundColor: highlightColor, fontWeight: 'bold' }}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ item, query, onPress }) => {
  const { colors, isDark } = useTheme();

  const icon = item.type === 'memo' ? '📝' : '✨';
  const highlightBg = isDark ? 'rgba(74, 222, 128, 0.3)' : 'rgba(74, 222, 128, 0.4)';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.bookTitle, { color: colors.textMuted }]} numberOfLines={1}>
          {item.book.books.title}
        </Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.content, { color: colors.text }]} numberOfLines={3}>
          <HighlightText
            text={item.content}
            query={query}
            color={colors.text}
            highlightColor={highlightBg}
          />
        </Text>
      </View>

      {item.subContent && (
        <Text style={[styles.subContent, { color: colors.textMuted }]} numberOfLines={2}>
          💭 {item.subContent}
        </Text>
      )}

      <View style={styles.footer}>
        {item.page && <Text style={[styles.pageText, { color: colors.textMuted }]}>p. {item.page}</Text>}
        {item.date && <Text style={[styles.dateText, { color: colors.textMuted }]}>{item.date}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  icon: {
    fontSize: 14,
  },
  bookTitle: {
    fontSize: 12,
    flex: 1,
  },
  contentContainer: {
    marginBottom: 8,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  subContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageText: {
    fontSize: 11,
  },
  dateText: {
    fontSize: 11,
  },
});
