import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

const { width } = Dimensions.get("window");

interface StarDistributionChartProps {
  books: UserBook[];
}

const AnimatedBar = ({ targetHeight, color, delay }: { targetHeight: string, color: string, delay: number }) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedHeight.setValue(0);
    Animated.timing(animatedHeight, {
      toValue: 1,
      duration: 1000,
      delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [targetHeight]);

  return (
    <Animated.View 
      style={[
        styles.bar, 
        { 
          backgroundColor: color,
          height: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', targetHeight],
          })
        }
      ]} 
    />
  );
};

export default function StarDistributionChart({ books }: StarDistributionChartProps) {
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const { colors, isDark } = useTheme();

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

    // Sort by rating to ensure correct bar order
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
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>별점 분포</Text>
      </View>

      <View style={styles.chartArea}>
        {/* Y Axis */}
        <View style={styles.yAxis}>
          {yAxisTicks.map((tick, i) => (
            <Text key={i} style={[styles.yTick, { color: colors.textMuted }]}>{tick}</Text>
          ))}
        </View>

        {/* Bars and Labels */}
        <View style={styles.barsContainer}>
          {/* Grid Lines */}
          <View style={styles.gridLines}>
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={[styles.gridLine, { backgroundColor: colors.border }]} />
            ))}
          </View>

          <View style={styles.barsWrapper}>
            {distributionData.map((item, index) => {
              // We want to show labels for 1.0, 2.0, 3.5, 5.0 to match web exactly
              const showLabel = [1.0, 2.0, 3.5, 5.0].includes(item.rating);
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.barColumn,
                    selectedBar === index && { zIndex: 100 }
                  ]}
                >
                  <View style={styles.barTrack}>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => setSelectedBar(selectedBar === index ? null : index)}
                      style={[
                        styles.barWrapper, 
                        selectedBar === index && styles.activeBar
                      ]} 
                    >
                      <AnimatedBar 
                        targetHeight={`${(item.count / roundedMax) * 100}%`}
                        color={isDark ? colors.primary : '#334155'}
                        delay={index * 50}
                      />
                    </TouchableOpacity>
                    {selectedBar === index && (
                      <View style={[
                        styles.tooltip,
                        { 
                          bottom: `${(item.count / roundedMax) * 100 + 12}%` as any,
                          backgroundColor: isDark ? colors.border : '#FFFFFF',
                          shadowColor: '#000'
                        }
                      ]}>
                        <Text style={[styles.tooltipDate, { color: colors.text }]}>{item.rating.toFixed(1)}점</Text>
                        <Text style={[styles.tooltipCount, { color: colors.text }]}>권 : {item.count}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.xLabelWrapper}>
                    {showLabel ? (
                      <Text style={[styles.xLabel, { color: colors.textMuted }]} numberOfLines={1}>
                        {item.rating.toFixed(1)} <Text style={styles.starText}>★</Text>
                      </Text>
                    ) : (
                        <View style={[styles.dot, { backgroundColor: colors.border }]} />
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
    borderRadius: 32,
    padding: 24,
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
  },
  chartArea: {
    flexDirection: 'row',
    height: 220, 
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 40, 
  },
  yTick: {
    fontSize: 12,
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
    bottom: 40, 
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
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
    width: '80%', 
    height: 180,
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    width: '100%',
  },
  activeBar: {
    opacity: 0.8,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    minWidth: 60,
    left: '50%',
    marginLeft: -30,
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
  xLabelWrapper: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  xLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  starText: {
    fontSize: 9,
  },
  dot: {
      width: 2,
      height: 2,
      borderRadius: 1,
  }
});
