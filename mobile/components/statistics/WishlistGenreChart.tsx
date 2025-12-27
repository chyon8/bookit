import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

const { width } = Dimensions.get("window");

interface WishlistGenreChartProps {
  books: UserBook[];
}

export default function WishlistGenreChart({ books }: WishlistGenreChartProps) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const { colors, isDark } = useTheme();

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
          <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>읽고 싶은 책 장르</Text>
              </View>
              <View style={[styles.chartArea, { height: 100, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: colors.textMuted }}>데이터가 없습니다.</Text>
              </View>
          </View>
      )
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>읽고 싶은 책 장르</Text>
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
              <View key={i} style={[styles.xTickMark, { backgroundColor: colors.border }]} />
            ))}
          </View>

          {/* Axis borders - hide top */}
          <View style={[styles.axisBorders, { borderColor: colors.border }]} />

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
                  <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.yTickMark, { backgroundColor: colors.border }]} />
                </View>
                 <View style={styles.barTrack}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => setSelectedBar(selectedBar === index ? null : index)}
                    style={[
                      styles.bar, 
                      { 
                        width: `${(item.value / roundedMax) * 100}%`,
                        backgroundColor: isDark ? colors.primary : '#334155'
                      },
                      selectedBar === index && styles.activeBar
                    ]} 
                  />
                  {selectedBar === index && (
                    <View style={[
                      styles.tooltip,
                      { 
                        left: `${(item.value / roundedMax) * 100}%`,
                        marginLeft: -40, // Half of minWidth (80/2)
                        backgroundColor: isDark ? colors.border : '#FFFFFF',
                        shadowColor: '#000'
                      }
                    ]}>
                      <Text style={[styles.tooltipDate, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.tooltipCount, { color: colors.text }]}>권 : {item.value}</Text>
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
              <Text key={i} style={[styles.xTick, { color: colors.textMuted }]}>{Math.round(tick)}</Text>
            ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    padding: 24,
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
    left: 70, 
    right: 0,
    zIndex: 0,
    overflow: 'hidden', 
    marginTop: 1, 
  },
  gridLine: {
    width: 1,
    backgroundColor: 'transparent', 
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
  },
  axisBorders: {
    ...StyleSheet.absoluteFillObject,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    left: 70, 
    zIndex: 2, 
    pointerEvents: 'none',
  },
  content: {
    zIndex: 1,
    gap: 12, 
    paddingVertical: 12, 
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0, 
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70, 
    justifyContent: 'flex-end',
    paddingRight: 2, 
  },
  label: {
    fontSize: 12,
    textAlign: 'right',
    marginRight: 2, 
  },
  yTickMark: {
    width: 4,
    height: 1,
    position: 'absolute',
    right: -2, 
  },
  barTrack: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    paddingLeft: 0, 
  },
  bar: {
    height: 24, 
    borderTopRightRadius: 6, 
    borderBottomRightRadius: 6,
  },
  activeBar: {
    opacity: 0.8,
  },
  tooltip: {
    position: 'absolute',
    top: -45, 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    minWidth: 80,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tooltipDate: { 
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipCount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 70, 
    marginTop: 4, 
  },
  xTick: {
    fontSize: 10,
    width: 20,
    textAlign: 'center',
  }
});
