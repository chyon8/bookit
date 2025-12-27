import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TrashIcon, PencilIcon, XMarkIcon } from './Icons'; // Ensure PencilIcon is added
import { MemorableQuote } from '../hooks/useBooks';

interface QuoteCardProps {
  quote: MemorableQuote;
  onDelete: () => void;
  onChange: (field: keyof MemorableQuote, value: string) => void;
  initialIsEditing?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onDelete, onChange, initialIsEditing }) => {
  const [isEditing, setIsEditing] = useState(initialIsEditing !== undefined ? initialIsEditing : !quote.quote);
  const [quoteHeight, setQuoteHeight] = useState(60);
  const [thoughtHeight, setThoughtHeight] = useState(40);

  if (isEditing) {
    return (
      <View style={styles.editCard}>
        <View style={styles.row}>
          <TextInput
            multiline
            value={quote.quote}
            onChangeText={(text) => onChange('quote', text)}
            placeholder="인상 깊었던 문장"
            style={[
              styles.input, 
              styles.quoteInput, 
              { height: Math.max(60, quoteHeight) },
              Platform.OS === 'web' && ({ resize: 'vertical', overflow: 'hidden' } as any)
            ]}
            onContentSizeChange={(e) => setQuoteHeight(e.nativeEvent.contentSize.height)}
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
            multiline
            value={quote.thought}
            onChangeText={(text) => onChange('thought', text)}
            placeholder="나의 생각"
            style={[
              styles.input, 
              styles.thoughtInput, 
              { height: Math.max(40, thoughtHeight) },
              Platform.OS === 'web' && ({ resize: 'vertical', overflow: 'hidden' } as any)
            ]}
            onContentSizeChange={(e) => setThoughtHeight(e.nativeEvent.contentSize.height)}
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
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.quoteText}>{quote.quote}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconButton}>
            <PencilIcon size={18} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <TrashIcon size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {(quote.page || quote.thought) && (
        <View style={styles.metaContainer}>
          {!!quote.page && <Text style={styles.pageText}>p. {quote.page}</Text>}
          {!!quote.thought && <Text style={styles.thoughtText}>💭 {quote.thought}</Text>}
        </View>
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
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
