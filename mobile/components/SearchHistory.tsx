import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SearchIcon, XMarkIcon } from './Icons';
import { Feather } from '@expo/vector-icons';

interface SearchHistoryProps {
  history: string[];
  onSelect: (query: string) => void;
  onDelete: (query: string) => void;
  onClearAll: () => void;
}

export function SearchHistory({ history, onSelect, onDelete, onClearAll }: SearchHistoryProps) {
  const { colors } = useTheme();

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>최근 검색 내역이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>최근 검색어</Text>
        <TouchableOpacity onPress={onClearAll}>
          <Text style={[styles.clearAllText, { color: colors.textMuted }]}>전체 삭제</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {history.map((item, index) => (
          <TouchableOpacity 
            key={`${item}-${index}`} 
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => onSelect(item)}
          >
            <View style={styles.itemLeft}>
              <Feather name="clock" size={16} color={colors.textMuted} style={styles.icon} />
              <Text style={[styles.itemText, { color: colors.text }]} numberOfLines={1}>
                {item}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <XMarkIcon size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearAllText: {
    fontSize: 13,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  icon: {
    marginRight: 10,
  },
  itemText: {
    fontSize: 15,
  },
});
