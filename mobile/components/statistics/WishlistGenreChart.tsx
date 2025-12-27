import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity
} from "react-native";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

const { width } = Dimensions.get("window");

interface WishlistGenreChartProps {
  books: UserBook[];
  theme: "light" | "dark";
}

export default function WishlistGenreChart({ books, theme }: WishlistGenreChartProps) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  const genreData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    books.forEach(book => {
      // Filter for WantToRead
      if (book.status === ReadingStatus.WantToRead) {
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

  const maxValue = Math.max(...genreData.map(d => d.value), 4); // Minimal max value for empty/low data
  const roundedMax = Math.ceil(maxValue / 5) * 5 || 5; // Ensure non-zero
  const xAxisTicks = [0, roundedMax / 4, (roundedMax * 2) / 4, (roundedMax * 3) / 4, roundedMax];

  if (genreData.length === 0) {
      return (
          <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.title}>읽고 싶은 책 장르</Text>
              </View>
              <View style={[styles.chartArea, { height: 100, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#94A3B8' }}>데이터가 없습니다.</Text>
              </View>
          </View>
      )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>읽고 싶은 책 장르</Text>
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
          
          {/* X Axis Ticks - Only at bottom */}
          <View style={styles.xAxisTicks}>
            {xAxisTicks.map((_, i) => (
              <View key={i} style={styles.xTickMark} />
            ))}
          </View>

          {/* Axis borders - hide top */}
          <View style={styles.axisBorders} />

          <View style={styles.content}>
            {genreData.map((item, index) => (
              <View 
                key={index} 
                style={[
                  styles.row,
                  selectedBar === index && { zIndex: 100 }
                ]}
              >
                <View style={styles.labelContainer}>
                  <Text style={styles.label} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.yTickMark} />
                </View>
                 <View style={styles.barTrack}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => setSelectedBar(selectedBar === index ? null : index)}
                    style={[
                      styles.bar, 
                      { width: `${(item.value / roundedMax) * 100}%` },
                      selectedBar === index && styles.activeBar
                    ]} 
                  />
                  {selectedBar === index && (
                    <View style={[
                      styles.tooltip,
                      { 
                        left: `${(item.value / roundedMax) * 100}%`,
                        marginLeft: -40 // Half of minWidth (80/2)
                      }
                    ]}>
                      <Text style={styles.tooltipDate}>{item.name}</Text>
                      <Text style={styles.tooltipCount}>권 : {item.value}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* X Axis at bottom */}
        <View style={styles.xAxis}>
            {xAxisTicks.map((tick, i) => (
              <Text key={i} style={styles.xTick}>{Math.round(tick)}</Text>
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
    left: 70, // Reducd offset to match new shorter label width
    right: 0,
    zIndex: 0,
    overflow: 'hidden', // Hide any potential top overflow
    marginTop: 1, // Slight offset to avoid top border touch
  },
  gridLine: {
    width: 1,
    backgroundColor: 'transparent', // Very faint grid or removed
    height: '100%',
  },
  xAxisTicks: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 70,
    right: 0,
    bottom: 0,
    height: 4, 
    zIndex: 1,
    alignItems: 'flex-end',
  },
  xTickMark: {
    width: 1,
    height: 4,
    backgroundColor: '#CBD5E1', // Softer tick color
  },
  axisBorders: {
    ...StyleSheet.absoluteFillObject,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#CBD5E1', // Softer axis color
    left: 70, // Match label width
    zIndex: 2, 
    pointerEvents: 'none',
  },
  content: {
    zIndex: 1,
    gap: 12, // Increased gap for breathing room
    paddingVertical: 12, // Increased padding
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0, 
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70, // Reduced from 80 to minimize gap
    justifyContent: 'flex-end',
    paddingRight: 2, // Minimal space
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'right',
    marginRight: 2, // Minimal gap
  },
  yTickMark: {
    width: 4,
    height: 1,
    backgroundColor: '#CBD5E1', // Softer tick color
    position: 'absolute',
    right: -2, 
  },
  barTrack: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    paddingLeft: 0, // Removed padding to stick bar to axis
  },
  bar: {
    height: 24, // Slightly thicker for better visual weight
    backgroundColor: '#334155',
    borderTopRightRadius: 6, // Softer rounding
    borderBottomRightRadius: 6,
  },
  activeBar: {
    backgroundColor: '#1E293B',
    opacity: 0.8,
  },
  tooltip: {
    position: 'absolute',
    top: -45, 
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    minWidth: 80,
    // left is dynamic now
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipDate: { // Reusing date style name for category
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipCount: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: 'bold',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 70, // Matched label width
    marginTop: 4, // Minimal margin
  },
  xTick: {
    fontSize: 10,
    color: '#94A3B8',
    width: 20,
    textAlign: 'center',
  }
});
