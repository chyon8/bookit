import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChartBarIcon } from "../../components/Icons";

export default function Stats() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ChartBarIcon size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.title}>독서 통계</Text>
        <Text style={styles.subtitle}>
          나의 독서 기록을 한눈에 확인하세요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#03314B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
