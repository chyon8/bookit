import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions 
} from "react-native";
import { 
  format, 
} from "date-fns";
import { ko } from "date-fns/locale";
import { UserBook, ReadingStatus } from "../../hooks/useBooks";

const { width } = Dimensions.get("window");

interface MonthlyCompletionChartProps {
  books: UserBook[];
  theme: "light" | "dark";
}

type TimeRange = "6" | "12" | "all";

export default function MonthlyCompletionChart({ books, theme }: MonthlyCompletionChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("12");

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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
            <Text style={styles.title}>월별 완독 수 ({timeRange === 'all' ? '전체' : `최근 ${timeRange}개월`})</Text>
        </View>
        <View style={styles.tabContainer}>
            {(["6", "12", "all"] as TimeRange[]).map((range) => (
            <TouchableOpacity
                key={range}
                onPress={() => setTimeRange(range)}
                style={[styles.tab, timeRange === range && styles.activeTab]}
            >
                <Text style={[styles.tabText, timeRange === range && styles.activeTabText]}>
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
            <Text key={i} style={styles.yTick}>{tick}</Text>
          ))}
        </View>

        {/* Bars and Grid */}
        <View style={styles.barsContainer}>
          <View style={styles.gridLines}>
            {[1, 2, 3, 4].map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>

          <View style={styles.barsWrapper}>
            {chartData.map((item, index) => {
              // Show label for every few bars depending on density
              const labelInterval = Math.max(1, Math.floor(chartData.length / 4));
              const showLabel = index % labelInterval === 0 || index === chartData.length - 1;

              return (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barTrack}>
                    <View 
                      style={[
                        styles.bar, 
                        { height: `${(item.value / roundedMax) * 100}%` }
                      ]} 
                    />
                  </View>
                  <View style={styles.xLabelWrapper}>
                    {showLabel ? (
                      <Text style={styles.xLabel} numberOfLines={1}>
                        {item.label}
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
    marginBottom: 20,
  },
  titleRow: {
      marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  chartArea: {
    flexDirection: 'row',
    height: 240,
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 40,
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
    bottom: 40,
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
    width: '70%',
    height: 200,
    justifyContent: 'flex-end',
  },
  bar: {
    backgroundColor: '#334155',
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
    fontSize: 9,
    color: '#94A3B8',
    textAlign: 'center',
    transform: [{ rotate: '-15deg' }], // Slight rotation for overlap
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#E2E8F0',
  }
});
