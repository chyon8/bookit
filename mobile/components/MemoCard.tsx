import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TrashIcon, PencilIcon } from './Icons';
import { Memo } from '../hooks/useBooks';

interface MemoCardProps {
  memo: Memo;
  onDelete: () => void;
  onChange: (value: string) => void;
}

export const MemoCard: React.FC<MemoCardProps> = ({ memo, onDelete, onChange }) => {
  const [isEditing, setIsEditing] = useState(memo.text === "");
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
      <View style={styles.editCard}>
        <TextInput
          multiline
          value={memo.text}
          onChangeText={onChange}
          placeholder="메모 내용"
          style={[
            styles.input, 
            { height: Math.max(80, memoHeight) },
            Platform.OS === 'web' && ({ resize: 'vertical', overflow: 'hidden' } as any)
          ]}
          onContentSizeChange={(e) => setMemoHeight(e.nativeEvent.contentSize.height)}
          autoFocus
        />
        <View style={styles.footer}>
          <Text style={styles.dateText}>{formattedDate || "지금 작성 중"}</Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
               <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
               <Text style={styles.doneText}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.memoHeader}>
        <View style={styles.flex1}>
          <Text style={styles.memoText}>{memo.text}</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconButton}>
            <PencilIcon size={18} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <TrashIcon size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {formattedDate && (
        <Text style={styles.footerDate}>{formattedDate}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
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
    color: '#94A3B8',
  },
  footerDate: {
    marginTop: 12,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  deleteText: {
    fontSize: 14,
    color: '#EF4444',
  },
  doneText: {
    fontSize: 14,
    color: '#4ADE80',
    fontWeight: 'bold',
  },
  memoText: {
    fontSize: 15,
    color: '#1E293B',
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
});
