import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Platform,
  Alert
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StarRating } from './StarRating';
import { ReadingSession } from '../hooks/useReadingSessions';

interface SessionEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (sessionId: string, updates: Partial<ReadingSession>) => void;
  session: ReadingSession | null;
  isSaving?: boolean;
}

export function SessionEditModal({
  isVisible,
  onClose,
  onSave,
  session,
  isSaving = false
}: SessionEditModalProps) {
  const { colors, isDark } = useTheme();
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [rating, setRating] = useState<number>(0);
  
  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (session) {
      setStartDate(session.start_date ? new Date(session.start_date) : null);
      setEndDate(session.end_date ? new Date(session.end_date) : null);
      setRating(session.rating || 0);
    }
  }, [session]);

  const handleSave = () => {
    if (!session) return;
    
    // Validation
    if (startDate && endDate && startDate > endDate) {
      Alert.alert('오류', '시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }

    onSave(session.id, {
      start_date: startDate ? startDate.toISOString().split('T')[0] : null,
      end_date: endDate ? endDate.toISOString().split('T')[0] : null,
      rating: rating
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      if (activeDateField === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    } else if (event.type === 'dismissed') {
       setShowDatePicker(false);
    }
  };

  const showDateModal = (field: 'start' | 'end') => {
    setActiveDateField(field);
    setShowDatePicker(true);
  };

  if (!session) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {session.session_number}회차 기록 수정
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: colors.textMuted, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Date Inputs */}
              <View style={styles.row}>
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>시작일</Text>
                  <TouchableOpacity 
                    style={[styles.dateButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}
                    onPress={() => showDateModal('start')}
                  >
                    <Text style={{ color: startDate ? colors.text : colors.textMuted }}>
                      {startDate ? startDate.toISOString().split('T')[0] : '날짜 선택'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>완독/중단일</Text>
                  <TouchableOpacity 
                    style={[styles.dateButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}
                    onPress={() => showDateModal('end')}
                  >
                    <Text style={{ color: endDate ? colors.text : colors.textMuted }}>
                      {endDate ? endDate.toISOString().split('T')[0] : '날짜 선택'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.ratingContainer}>
                <Text style={[styles.label, { color: colors.textMuted, marginBottom: 8 }]}>평점</Text>
                <StarRating 
                  rating={rating} 
                  setRating={setRating}
                  size={32}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton, { borderColor: colors.border }]} 
                  onPress={onClose}
                >
                  <Text style={{ color: colors.text }}>취소</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
                    {isSaving ? '저장 중...' : '저장'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* DateTimePicker */}
            {showDatePicker && (
              <DateTimePicker
                value={
                  (activeDateField === 'start' ? startDate : endDate) || new Date()
                }
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 350,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  dateButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  saveButton: {
   
  },
});
