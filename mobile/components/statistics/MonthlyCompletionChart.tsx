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
  subMonths, 
  eachMonthOfInterval, 
  startOfMonth, 
  isSameMonth 
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
    const now = new Date();
    let startDate: Date;
    
    if (timeRange === "all") {
      const finishedBooks = books.filter(b => b.status === ReadingStatus.Finished && b.end_date);
      if (finishedBooks.length === 0) {
        startDate = subMonths(now, 11);
      } else {
        const dates = finishedBooks.map(b => new Date(b.end_date!).getTime());
        startDate = new Date(Math.min(...dates));
      }
    } else {
      startDate = subMonths(now, parseInt(timeRange) - 1);
    }

    const months = eachMonthOfInterval({
      start: startOfMonth(startDate),
      end: startOfMonth(now),
    });

    return months.map(month => {
      const count = books.filter(book => 
        book.status === ReadingStatus.Finished && 
        book.end_date && 
        isSameMonth(new Date(book.end_date), month)
      ).length;

      return {
        label: format(month, "yy년 M월", { locale: ko }),
        shortLabel: format(month, "M월"),
        yearLabel: format(month, "yy년"),
        value: count,
        date: month
      };
    });
  }, [books, timeRange]);

  const maxValue = Math.max(...chartData.map(d => d.value), 4);
  const roundedMax = Math.ceil(maxValue / 4) * 4;
  const yAxisTicks = [roundedMax, (roundedMax * 3) / 4, (roundedMax * 2) / 4, roundedMax / 4, 0];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
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
            {chartData.map((item, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: `${(item.value / roundedMax) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* X Axis labels (Simplified for mobile) */}
      <View style={styles.xAxis}>
        {chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 4)) === 0).map((item, i) => (
          <Text key={i} style={styles.xLabel}>{item.label}</Text>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeTab: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#FFFFFF',
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
    width: '60%',
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
  xLabel: {
    fontSize: 10,
    color: '#94A3B8',
  }
});
