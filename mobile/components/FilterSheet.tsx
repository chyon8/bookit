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
    genre: string | null;
  }) => void;
  initialFilters: {
    sort: SortOption;
    reread: boolean | null;
    month: string | null;
    genre: string | null;
  };
  genres: string[]; // Pass available genres
}

export const FilterSheet = ({ visible, onClose, onApply, initialFilters, genres }: FilterSheetProps) => {
  const [sort, setSort] = useState<SortOption>(initialFilters.sort);
  const [reread, setReread] = useState<boolean | null>(initialFilters.reread);
  const [month, setMonth] = useState<string | null>(initialFilters.month);
  const [genre, setGenre] = useState<string | null>(initialFilters.genre);

  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

  const handleApply = () => {
    onApply({ sort, reread, month, genre });
    onClose();
  };

  const handleReset = () => {
    setSort("date_desc");
    setReread(null);
    setMonth(null);
    setGenre(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
            
            <View style={styles.header}>
                <Text style={styles.title}>필터 및 정렬</Text>
                <TouchableOpacity onPress={onClose}>
                    <XMarkIcon size={24} color="#64748B" />
                </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* Sort Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>정렬 기준</Text>
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
                                style={[styles.chip, sort === opt.id && styles.activeChip]}
                            >
                                <Text style={[styles.chipText, sort === opt.id && styles.activeChipText]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Reread Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>N회차 읽기 상태</Text>
                    <View style={styles.chipContainer}>
                        <TouchableOpacity
                            onPress={() => setReread(reread === true ? null : true)}
                            style={[styles.chip, reread === true && styles.activeChip]}
                        >
                            <Text style={[styles.chipText, reread === true && styles.activeChipText]}>N회차 읽기만</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                 <View style={styles.divider} />

                {/* Month Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>월별 보기</Text>
                     <View style={styles.chipContainer}>
                        {months.map((m, i) => (
                             <TouchableOpacity
                                key={m}
                                onPress={() => setMonth(month === String(i+1) ? null : String(i+1))}
                                style={[styles.chip, month === String(i+1) && styles.activeChip]}
                            >
                                <Text style={[styles.chipText, month === String(i+1) && styles.activeChipText]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                     </View>
                </View>

                {/* Genre Section - Optional, if available */}
                {genres.length > 0 && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>장르</Text>
                            <View style={styles.chipContainer}>
                                {genres.map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={() => setGenre(genre === g ? null : g)}
                                        style={[styles.chip, genre === g && styles.activeChip]}
                                    >
                                        <Text style={[styles.chipText, genre === g && styles.activeChipText]}>{g}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}

            </ScrollView>

            <View style={styles.footer}>
                 <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                    <Text style={styles.resetText}>초기화</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
                    <Text style={styles.applyText}>적용하기</Text>
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F1F5F9',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
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
    color: '#334155',
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeChip: {
    backgroundColor: '#ECFDF5',
    borderColor: '#4ADE80',
  },
  chipText: {
    fontSize: 14,
    color: '#64748B',
  },
  activeChipText: {
    color: '#15803D',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: 40, // Safe area
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748B',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  }
});
