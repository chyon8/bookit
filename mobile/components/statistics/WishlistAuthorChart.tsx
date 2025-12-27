import React, { useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet 
} from "react-native";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

interface WishlistAuthorChartProps {
  books: UserBook[];
  theme: "light" | "dark";
}

export default function WishlistAuthorChart({ books, theme }: WishlistAuthorChartProps) {
  const authorData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    books.forEach(book => {
      if (book.status === ReadingStatus.WantToRead) {
        const author = book.books.author?.split('(')[0].trim() || "Unknown";
        counts[author] = (counts[author] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [books]);

  if (authorData.length === 0) {
      return (
          <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>읽고 싶은 책 저자 Top 10</Text>
              </View>
              <View style={[styles.list, { height: 100, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#94A3B8' }}>데이터가 없습니다.</Text>
              </View>
          </View>
      )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>읽고 싶은 책 저자 Top 10</Text>
      </View>

      <View style={styles.list}>
        {authorData.map((item, index) => (
          <View key={index} style={styles.row}>
            <View style={styles.rankContainer}>
              <Text style={styles.rank}>{index + 1}</Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={styles.countContainer}>
              <Text style={styles.countValue}>{item.value}</Text>
              <Text style={styles.countUnit}> 권</Text>
            </View>
          </View>
        ))}
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
    marginBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  list: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 32,
  },
  rank: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#CBD5E1',
    fontWeight: 'bold',
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  countUnit: {
    fontSize: 12,
    color: '#94A3B8',
  }
});
