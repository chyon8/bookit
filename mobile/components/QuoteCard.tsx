import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { TrashIcon, PencilIcon, XMarkIcon } from './Icons';
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
  const { colors, isDark } = useTheme();

  if (isEditing) {
    return (
      <View style={[styles.editCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <View style={styles.row}>
          <TextInput
            multiline
            value={quote.quote}
            onChangeText={(text) => onChange('quote', text)}
            placeholder="인상 깊었던 문장"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input, 
              styles.quoteInput, 
              { 
                height: Math.max(60, quoteHeight), 
                backgroundColor: isDark ? colors.border : '#F8FAFC',
                color: colors.text
              },
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
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input, 
              styles.pageInput, 
              { 
                backgroundColor: isDark ? colors.border : '#F8FAFC',
                color: colors.text
              }
            ]}
            keyboardType="numeric"
          />
          <TextInput
            multiline
            value={quote.thought}
            onChangeText={(text) => onChange('thought', text)}
            placeholder="나의 생각"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input, 
              styles.thoughtInput, 
              { 
                height: Math.max(40, thoughtHeight), 
                backgroundColor: isDark ? colors.border : '#F8FAFC',
                color: colors.text
              },
              Platform.OS === 'web' && ({ resize: 'vertical', overflow: 'hidden' } as any)
            ]}
            onContentSizeChange={(e) => setThoughtHeight(e.nativeEvent.contentSize.height)}
          />
        </View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setIsEditing(false)}>
            <Text style={[styles.doneButton, { color: colors.primary }]}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Text style={[styles.quoteText, { color: colors.text }]}>{quote.quote}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconButton}>
            <PencilIcon size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <TrashIcon size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      {(quote.page || quote.thought) && (
        <View style={[styles.metaContainer, { borderTopColor: colors.border }]}>
          {!!quote.page && <Text style={[styles.pageText, { color: colors.textMuted }]}>p. {quote.page}</Text>}
          {!!quote.thought && <Text style={[styles.thoughtText, { color: colors.text }]}>💭 {quote.thought}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  editCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
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
    fontWeight: 'bold',
    fontSize: 14,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  metaContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  pageText: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'right',
  },
  thoughtText: {
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
});
