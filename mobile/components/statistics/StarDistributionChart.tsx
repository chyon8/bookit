import React, { useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions 
} from "react-native";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

const { width } = Dimensions.get("window");

interface StarDistributionChartProps {
  books: UserBook[];
  theme: "light" | "dark";
}

export default function StarDistributionChart({ books, theme }: StarDistributionChartProps) {
  const distributionData = useMemo(() => {
    const counts: Record<number, number> = {};
    // Match web version: 1.0 to 5.0 with 0.5 steps (9 bars)
    for (let i = 1.0; i <= 5.0; i += 0.5) {
      counts[i] = 0;
    }

    books.forEach(book => {
      if (book.status === ReadingStatus.Finished && book.rating && book.rating > 0) {
        // Round to nearest 0.5
        const r = Math.round(book.rating * 2) / 2;
        if (r >= 1.0 && r <= 5.0) {
          counts[r] = (counts[r] || 0) + 1;
        }
      }
    });

    // CRITICAL: Sort by rating to ensure correct bar order
    return Object.entries(counts)
      .map(([rating, count]) => ({
        rating: parseFloat(rating),
        count
      }))
      .sort((a, b) => a.rating - b.rating);
  }, [books]);

  const maxValue = Math.max(...distributionData.map(d => d.count), 60);
  const roundedMax = Math.ceil(maxValue / 20) * 20;
  const yAxisTicks = [roundedMax, (roundedMax * 3) / 4, (roundedMax * 2) / 4, roundedMax / 4, 0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>별점 분포</Text>
      </View>

      <View style={styles.chartArea}>
        {/* Y Axis */}
        <View style={styles.yAxis}>
          {yAxisTicks.map((tick, i) => (
            <Text key={i} style={styles.yTick}>{tick}</Text>
          ))}
        </View>

        {/* Bars and Labels */}
        <View style={styles.barsContainer}>
          {/* Grid Lines */}
          <View style={styles.gridLines}>
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.barsWrapper}>
            {distributionData.map((item, index) => {
              // We want to show labels for 1.0, 2.0, 3.5, 5.0 to match web exactly
              const showLabel = [1.0, 2.0, 3.5, 5.0].includes(item.rating);
              
              return (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View 
                      style={[
                        styles.bar, 
                        { height: `${(item.count / roundedMax) * 100}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.xLabelWrapper}>
                    {showLabel ? (
                      <Text style={styles.xLabel} numberOfLines={1}>
                        {item.rating.toFixed(1)} <Text style={styles.starText}>★</Text>
                      </Text>
                    ) : (
                        <View style={styles.dot} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  chartArea: {
    flexDirection: 'row',
    height: 220, // Increased height for labels
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 40, // Match bar bottom padding
  },
  yTick: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    width: 25,
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 40, // Match bar bottom padding
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barsWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    width: '80%', // Thicker bars to match web
    height: 180,
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#334155', // Navy color from web design
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
  },
  xLabelWrapper: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  xLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  starText: {
    fontSize: 9,
  },
  dot: {
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: '#E2E8F0',
  }
});
