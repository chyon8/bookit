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
    // Initialize possible ratings from 1 to 5 with 0.5 steps
    for (let i = 0.5; i <= 5; i += 0.5) {
      counts[i] = 0;
    }

    books.forEach(book => {
      if (book.status === ReadingStatus.Finished && book.rating && book.rating > 0) {
        // Round to nearest 0.5
        const r = Math.round(book.rating * 2) / 2;
        if (r >= 0.5 && r <= 5) {
          counts[r] = (counts[r] || 0) + 1;
        }
      }
    });

    return Object.entries(counts).map(([rating, count]) => ({
      rating: parseFloat(rating),
      count
    }));
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

        {/* Bars */}
        <View style={styles.barsContainer}>
          {/* Grid Lines */}
          <View style={styles.gridLines}>
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.barsWrapper}>
            {distributionData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: `${(item.count / roundedMax) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* X Axis labels */}
      <View style={styles.xAxis}>
        {[1.0, 2.0, 3.5, 5.0].map((val, i) => (
          <View key={i} style={styles.xLabelContainer}>
            <Text style={styles.xLabel}>{val.toFixed(1)} ★</Text>
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
    flexDirection: 'row',
    height: 180,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 4,
  },
  yTick: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    width: 20,
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barsWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: '70%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#334155',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 32,
    marginTop: 8,
  },
  xLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  xLabel: {
    fontSize: 10,
    color: '#94A3B8',
  }
});
