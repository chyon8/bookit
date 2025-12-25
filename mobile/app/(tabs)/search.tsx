import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SearchIcon } from "../../components/Icons";

export default function Search() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <SearchIcon size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.title}>도서 검색</Text>
        <Text style={styles.subtitle}>
          새로운 책을 검색하고 내 책장에 추가하세요
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
