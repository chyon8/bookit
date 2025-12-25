import React, { useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions 
} from "react-native";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

const { width } = Dimensions.get("window");

interface GenreChartProps {
  books: UserBook[];
  theme: "light" | "dark";
}

export default function GenreChart({ books, theme }: GenreChartProps) {
  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    books.forEach(book => {
      if (book.status === ReadingStatus.Finished) {
        const cat = book.books.category || "기타";
        // Simple grouping like web
        let displayCat = cat.split('>')[0].trim();
        counts[displayCat] = (counts[displayCat] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7); // Show top 7 genres
  }, [books]);

  const maxValue = Math.max(...genreData.map(d => d.value), 100);
  const roundedMax = Math.ceil(maxValue / 25) * 25;
  const xAxisTicks = [0, roundedMax / 4, (roundedMax * 2) / 4, (roundedMax * 3) / 4, roundedMax];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>완독한 책 장르</Text>
      </View>

      <View style={styles.chartArea}>
        {/* Horizontal Bars */}
        <View style={styles.barsContainer}>
          {/* Vertical Grid Lines */}
          <View style={styles.gridLines}>
            {xAxisTicks.map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.content}>
            {genreData.map((item, index) => (
              <View key={index} style={styles.row}>
                <Text style={styles.label} numberOfLines={1}>{item.name}</Text>
                <View style={styles.barTrack}>
                  <View 
                    style={[
                      styles.bar, 
                      { width: `${(item.value / roundedMax) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* X Axis at bottom */}
        <View style={styles.xAxis}>
            {xAxisTicks.map((tick, i) => (
              <Text key={i} style={styles.xTick}>{tick}</Text>
            ))}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  chartArea: {
    paddingLeft: 4,
  },
  barsContainer: {
    position: 'relative',
    paddingBottom: 4,
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 80, // Offset for labels
    right: 0,
    zIndex: 0,
  },
  gridLine: {
    width: 1,
    backgroundColor: '#F1F5F9',
    height: '100%',
  },
  content: {
    zIndex: 1,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    width: 80,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  bar: {
    height: 24,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 80 + 12, // Same as label offset + gap
    marginTop: 8,
  },
  xTick: {
    fontSize: 10,
    color: '#94A3B8',
    width: 20,
    textAlign: 'center',
  }
});
