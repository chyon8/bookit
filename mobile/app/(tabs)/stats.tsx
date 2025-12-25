import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import StatsView from '../../components/StatsView';
import { useBooks } from '../../hooks/useBooks';

export default function StatsPage() {
  const { data: books, isLoading } = useBooks();

  if (isLoading) {
    return <View style={styles.container} />; // Or a skeleton/loader
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatsView books={books || []} theme="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
