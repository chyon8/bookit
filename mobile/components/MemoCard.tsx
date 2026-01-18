import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SwipeableRow } from './SwipeableRow';
import { Memo } from '../hooks/useBooks';
import { HeartIcon, HeartFilledIcon } from './Icons';

interface MemoCardProps {
  memo: Memo;
  onDelete: () => void;
  onChange: (value: string) => void;
  onToggleFavorite?: () => void;
}

export const MemoCard: React.FC<MemoCardProps> = ({ memo, onDelete, onChange, onToggleFavorite }) => {
  const [isEditing, setIsEditing] = useState(memo.text === "");
  const { colors, isDark } = useTheme();
  const [memoHeight, setMemoHeight] = useState(80);

  const formattedDate = useMemo(() => {
    if (!memo.createdAt) return null;
    try {
      return new Date(memo.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "날짜 오류";
    }
  }, [memo.createdAt]);


  if (isEditing) {
    return (
      <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <TextInput
          multiline
          value={memo.text}
          onChangeText={onChange}
          placeholder="메모 내용"
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input, 
            { 
              height: Math.max(80, memoHeight),
              backgroundColor: isDark ? colors.border : '#F8FAFC',
              color: colors.text
            },
            Platform.OS === 'web' && ({ resize: 'vertical', overflow: 'hidden' } as any)
          ]}
          onContentSizeChange={(e) => setMemoHeight(e.nativeEvent.contentSize.height)}
          scrollEnabled={false}
          autoFocus
        />
        <View style={styles.footer}>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>{formattedDate || "지금 작성 중"}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
               <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
               <Text style={[styles.doneText, { color: colors.primary }]}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardWrapper}>
      <SwipeableRow onEdit={() => setIsEditing(true)} onDelete={onDelete}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.memoHeader}>
            <View style={styles.flex1}>
              <Text style={[styles.memoText, { color: colors.text }]}>{memo.text}</Text>
            </View>
          </View>
          {formattedDate && (
            <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerDate, { color: colors.textMuted }]}>{formattedDate}</Text>
              {onToggleFavorite && (
                <TouchableOpacity 
                  onPress={onToggleFavorite} 
                  style={styles.favoriteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {memo.isFavorite ? (
                    <HeartFilledIcon size={18} color="#EF4444" />
                  ) : (
                    <HeartIcon size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </SwipeableRow>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  editCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    padding: 4,
  },
  dateText: {
    fontSize: 12,
  },
  footerDate: {
    fontSize: 12,
  },
  deleteText: {
    fontSize: 14,
    color: '#EF4444',
  },
  doneText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  memoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  memoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  flex1: {
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
});
