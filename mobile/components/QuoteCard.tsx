import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { TrashIcon, PencilIcon, XMarkIcon } from './Icons'; // Ensure PencilIcon is added
import { MemorableQuote } from '../hooks/useBooks';

interface QuoteCardProps {
  quote: MemorableQuote;
  onDelete: () => void;
  onChange: (field: keyof MemorableQuote, value: string) => void;
  initialIsEditing?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onDelete, onChange, initialIsEditing }) => {
  const [isEditing, setIsEditing] = useState(initialIsEditing || !quote.quote);

  if (isEditing) {
    return (
      <View style={styles.editCard}>
        <View style={styles.row}>
          <TextInput
            multiline
            value={quote.quote}
            onChangeText={(text) => onChange('quote', text)}
            placeholder="인상 깊었던 문장"
            style={[styles.input, styles.quoteInput]}
            autoFocus={!quote.quote}
          />
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <TrashIcon size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TextInput
            value={quote.page}
            onChangeText={(text) => onChange('page', text)}
            placeholder="페이지"
            style={[styles.input, styles.pageInput]}
            keyboardType="numeric"
          />
          <TextInput
            value={quote.thought}
            onChangeText={(text) => onChange('thought', text)}
            placeholder="나의 생각"
            style={[styles.input, styles.thoughtInput]}
          />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <Text style={styles.doneButton}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => setIsEditing(true)}
      activeOpacity={0.8}
    >
      <View style={styles.row}>
        <Text style={styles.quoteText}>{quote.quote}</Text>
      </View>
      {(quote.page || quote.thought) && (
        <View style={styles.metaContainer}>
          {!!quote.page && <Text style={styles.pageText}>p. {quote.page}</Text>}
          {!!quote.thought && <Text style={styles.thoughtText}>💭 {quote.thought}</Text>}
        </View>
      )}
    </TouchableOpacity>
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
  editCard: { // Same style as card but maybe highlighted?
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  quoteInput: {
    flex: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  pageInput: {
    width: 60,
  },
  thoughtInput: {
    flex: 1,
  },
  iconButton: {
    padding: 4,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  doneButton: {
    color: '#4ADE80',
    fontWeight: 'bold',
    fontSize: 14,
  },
  quoteText: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  metaContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pageText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
    textAlign: 'right',
  },
  thoughtText: {
    fontSize: 13,
    color: '#334155',
  },
});
