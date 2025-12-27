import React from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import StatsView from '../../components/StatsView';
import { useBooks } from '../../hooks/useBooks';
import { useTheme } from '../../context/ThemeContext';

export default function StatsPage() {
  const { data: books, isLoading, error } = useBooks();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>통계를 준비하고 있어요...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>데이터를 불러오지 못했습니다.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatsView books={books || []} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
