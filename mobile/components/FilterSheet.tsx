import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView
} from "react-native";
import { XMarkIcon } from "./Icons";

export type SortOption = "date_desc" | "date_asc" | "rating_desc" | "rating_asc" | "title_asc";

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: {
    sort: SortOption;
    reread: boolean | null;
    month: string | null;
    year: string | null;
    genre: string | null;
    readingCount: number | null;
  }) => void;
  initialFilters: {
    sort: SortOption;
    reread: boolean | null;
    month: string | null;
    year: string | null;
    genre: string | null;
    readingCount: number | null;
  };
  genres: string[]; // Pass available genres
}

import { useTheme } from "../context/ThemeContext";

export const FilterSheet = ({ visible, onClose, onApply, initialFilters, genres }: FilterSheetProps) => {
  const { colors, isDark } = useTheme();
  const [sort, setSort] = useState<SortOption>(initialFilters.sort);
  const [reread, setReread] = useState<boolean | null>(initialFilters.reread);
  const [month, setMonth] = useState<string | null>(initialFilters.month);
  const [year, setYear] = useState<string | null>(initialFilters.year);
  const [genre, setGenre] = useState<string | null>(initialFilters.genre);
  const [readingCount, setReadingCount] = useState<number | null>(initialFilters.readingCount);

  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
  const currentYearNum = new Date().getFullYear();
  const years = [currentYearNum, currentYearNum - 1, currentYearNum - 2].map(String);

  const handleApply = () => {
    onApply({ sort, reread, month, year, genre, readingCount });
    onClose();
  };

  const handleReset = () => {
    setSort("date_desc");
    setReread(null);
    setMonth(null);
    setYear(null);
    setGenre(null);
    setReadingCount(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>필터 및 정렬</Text>
                <TouchableOpacity onPress={onClose}>
                    <XMarkIcon size={24} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* Sort Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>정렬 기준</Text>
                    <View style={styles.chipContainer}>
                        {[
                            { id: "date_desc", label: "최신순" },
                            { id: "date_asc", label: "오래된순" },
                            { id: "rating_desc", label: "별점 높은순" },
                            { id: "rating_asc", label: "별점 낮은순" },
                            { id: "title_asc", label: "제목순" },
                        ].map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                onPress={() => setSort(opt.id as SortOption)}
                                style={[
                                  styles.chip, 
                                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                                  sort === opt.id && { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: colors.primary }
                                ]}
                            >
                                <Text style={[
                                  styles.chipText, 
                                  { color: colors.textMuted },
                                  sort === opt.id && { color: isDark ? colors.primary : '#15803D', fontWeight: '600' }
                                ]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Reread Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>다시 읽고 싶어요</Text>
                    <View style={styles.chipContainer}>
                        <TouchableOpacity
                            onPress={() => setReread(reread === true ? null : true)}
                            style={[
                              styles.chip, 
                              { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                              reread === true && { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: colors.primary }
                            ]}
                        >
                            <Text style={[
                              styles.chipText, 
                              { color: colors.textMuted },
                              reread === true && { color: isDark ? colors.primary : '#15803D', fontWeight: '600' }
                            ]}>다시 읽고 싶은 책</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                 <View style={[styles.divider, { backgroundColor: colors.border }]} />
 
                 {/* Year Section */}
                 <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>연도별 보기</Text>
                    <View style={styles.chipContainer}>
                        {years.map((y) => (
                             <TouchableOpacity
                                key={y}
                                onPress={() => setYear(year === y ? null : y)}
                                style={[
                                  styles.chip, 
                                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                                  year === y && { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: colors.primary }
                                ]}
                            >
                                <Text style={[
                                  styles.chipText, 
                                  { color: colors.textMuted },
                                  year === y && { color: isDark ? colors.primary : '#15803D', fontWeight: '600' }
                                ]}>{y}년</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Month Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>월별 보기</Text>
                     <View style={styles.chipContainer}>
                        {months.map((m, i) => (
                             <TouchableOpacity
                                key={m}
                                onPress={() => setMonth(month === String(i+1) ? null : String(i+1))}
                                style={[
                                  styles.chip, 
                                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                                  month === String(i+1) && { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: colors.primary }
                                ]}
                            >
                                <Text style={[
                                  styles.chipText, 
                                  { color: colors.textMuted },
                                  month === String(i+1) && { color: isDark ? colors.primary : '#15803D', fontWeight: '600' }
                                ]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                     </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Reading Count Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>N회차</Text>
                    <View style={styles.chipContainer}>
                        {[1, 2, 3, 4, 5].map((count) => (
                            <TouchableOpacity
                                key={count}
                                onPress={() => setReadingCount(readingCount === count ? null : count)}
                                style={[
                                  styles.chip, 
                                  { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                                  readingCount === count && { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: colors.primary }
                                ]}
                            >
                                <Text style={[
                                  styles.chipText, 
                                  { color: colors.textMuted },
                                  readingCount === count && { color: isDark ? colors.primary : '#15803D', fontWeight: '600' }
                                ]}>{count === 5 ? "5회차+" : `${count}회차`}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Genre Section - Optional, if available */}
                {genres.length > 0 && (
                    <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>장르</Text>
                            <View style={styles.chipContainer}>
                                {genres.map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={() => setGenre(genre === g ? null : g)}
                                        style={[
                                          styles.chip, 
                                          { backgroundColor: isDark ? colors.border : '#F1F5F9' },
                                          genre === g && { backgroundColor: isDark ? '#064E3B' : '#ECFDF5', borderColor: colors.primary }
                                        ]}
                                    >
                                        <Text style={[
                                          styles.chipText, 
                                          { color: colors.textMuted },
                                          genre === g && { color: isDark ? colors.primary : '#15803D', fontWeight: '600' }
                                        ]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                 <TouchableOpacity onPress={handleReset} style={[styles.resetButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}>
                    <Text style={[styles.resetText, { color: colors.textMuted }]}>초기화</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleApply} style={[styles.applyButton, { backgroundColor: colors.text }]}>
                    <Text style={[styles.applyText, { color: colors.card }]}>적용하기</Text>
                </TouchableOpacity>
            </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeChip: {
  },
  chipText: {
    fontSize: 14,
  },
  activeChipText: {
  },
  divider: {
    height: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    paddingBottom: 40,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});
