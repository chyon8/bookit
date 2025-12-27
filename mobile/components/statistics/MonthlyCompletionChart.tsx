import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Animated,
  Easing
} from "react-native";
import { 
  format, 
} from "date-fns";
import { ko } from "date-fns/locale";
import { useTheme } from "../../context/ThemeContext";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

const { width } = Dimensions.get("window");

interface MonthlyCompletionChartProps {
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

type TimeRange = "6" | "12" | "all";

export default function MonthlyCompletionChart({ books }: MonthlyCompletionChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("12");
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const { colors, isDark } = useTheme();

  const chartData = useMemo(() => {
    const monthlyMap = new Map<number, number>();

    books.forEach((book) => {
      if (book.status === ReadingStatus.Finished && book.end_date) {
        const date = new Date(book.end_date);
        if (!isNaN(date.getTime())) {
          const key = new Date(date.getFullYear(), date.getMonth()).getTime();
          monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
        }
      }
    });

    const sortedMonthly = Array.from(monthlyMap.entries()).sort(
      (a, b) => a[0] - b[0]
    );

    const monthlySlice =
      timeRange === "all"
        ? sortedMonthly
        : sortedMonthly.slice(-(parseInt(timeRange)));

    return monthlySlice.map(([timestamp, count]) => {
      const date = new Date(timestamp);
      return {
        label: format(date, "yy년 M월", { locale: ko }),
        value: count,
        timestamp
      };
    });
  }, [books, timeRange]);

  const maxValue = Math.max(...chartData.map(d => d.value), 4);
  const roundedMax = Math.ceil(maxValue / 4) * 4;
  const yAxisTicks = [roundedMax, (roundedMax * 3) / 4, (roundedMax * 2) / 4, roundedMax / 4, 0];

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>월별 완독 수 ({timeRange === 'all' ? '전체' : `최근 ${timeRange}개월`})</Text>
        </View>
        <View style={styles.tabContainer}>
            {(["6", "12", "all"] as TimeRange[]).map((range) => (
            <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={[
                  styles.tab, 
                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                  timeRange === range && (isDark ? { backgroundColor: colors.primary } : styles.activeTab)
                ]}
            >
                <Text style={[
                  styles.tabText, 
                  { color: colors.textMuted },
                  timeRange === range && (isDark ? { color: '#000' } : styles.activeTabText)
                ]}>
                {range === "all" ? "전체" : `${range}개월`}
                </Text>
            </TouchableOpacity>
            ))}
        </View>
      </View>

      <View style={styles.chartArea}>
        {/* Y Axis */}
        <View style={styles.yAxis}>
          {yAxisTicks.map((tick, i) => (
            <Text key={i} style={[styles.yTick, { color: colors.textMuted }]}>{tick}</Text>
          ))}
        </View>

        {/* Bars and Grid */}
        <View style={styles.barsContainer}>
          <View style={styles.gridLines}>
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={[styles.gridLine, { backgroundColor: colors.border }]} />
            ))}
          </View>

          <View style={styles.barsWrapper}>
            {chartData.map((item, index) => {
              // Show fewer labels to prevent overlap
              const labelInterval = chartData.length > 8 ? 2 : 1;
              const showLabel = index % labelInterval === 0 || index === chartData.length - 1;

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
                        targetHeight={`${(item.value / roundedMax) * 100}%`}
                        color={isDark ? colors.primary : '#334155'}
                        delay={index * 50}
                      />
                    </TouchableOpacity>
                    {selectedBar === index && (
                      <View style={[
                        styles.tooltip,
                        { 
                          bottom: `${(item.value / roundedMax) * 100 + 12}%` as any,
                          backgroundColor: isDark ? colors.border : '#FFFFFF',
                          shadowColor: '#000'
                        }
                      ]}>
                        <Text style={[styles.tooltipDate, { color: colors.text }]}>{item.label}</Text>
                        <Text style={[styles.tooltipCount, { color: colors.text }]}>권 : {item.value}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.xLabelWrapper}>
                    {showLabel ? (
                      <Text style={[styles.xLabel, { color: colors.textMuted }]}>
                        {item.label}
                      </Text>
                    ) : (
                      <View style={styles.labelSpacer} />
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
    marginBottom: 20,
  },
  titleRow: {
      marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  chartArea: {
    flexDirection: 'row',
    height: 300, 
    paddingTop: 40, 
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 50,
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
    top: 40, 
    left: 0,
    right: 0,
    bottom: 50,
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
    width: '70%',
    height: 200,
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
    minWidth: 80,
    left: '50%',
    marginLeft: -40,
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
    height: 50, 
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
  },
  xLabel: {
    fontSize: 8,
    textAlign: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  labelSpacer: {
    height: 1,
  },
});
