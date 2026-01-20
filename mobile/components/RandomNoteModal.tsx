import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, Pressable } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from "expo-router";
import { UserBook } from '../hooks/useBooks';
import { ChevronLeftIcon, ChevronRightIcon, HeartIcon, HeartFilledIcon } from './Icons';

export type Note = {
  book: UserBook;
  note: { title: string; content: string; isFavorite?: boolean };
  noteType: 'quote' | 'memo';
  noteIndex: number;
};

interface RandomNoteModalProps {
  isVisible: boolean;
  currentNote: Note | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalNotes: number;
  onToggleFavorite?: (bookId: string, noteType: 'quote' | 'memo', noteIndex: number) => void;
}

import { useTheme } from '../context/ThemeContext';

export function RandomNoteModal({
  isVisible,
  currentNote,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalNotes,
  onToggleFavorite
}: RandomNoteModalProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  if (!currentNote) return null;

  const { book, note, noteType, noteIndex } = currentNote;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.overlay}
        onPress={onClose}
      >
        <Pressable>
          <View 
            style={[
              styles.modalCard, 
              { backgroundColor: isDark ? colors.card : '#FDF1F1' }
            ]}
          >
            {/* Header with Note Type Label and Favorite Button */}
            <View style={styles.noteHeader}>
              <Text style={[styles.noteLabel, { color: colors.textMuted }]}>{note.title}</Text>
              {onToggleFavorite && (
                <TouchableOpacity 
                  onPress={() => onToggleFavorite(book.book_id, noteType, noteIndex)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {note.isFavorite ? (
                    <HeartFilledIcon size={20} color="#EF4444" />
                  ) : (
                    <HeartIcon size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            {/* Note Content */}
            <ScrollView style={styles.contentScroll}>
              <Text style={[styles.noteContent, { color: colors.text }]}>{note.content}</Text>
            </ScrollView>

            {/* Book Info */}
            <TouchableOpacity 
              style={[styles.bookInfoContainer, { borderTopColor: colors.border }]}
              onPress={() => {
                onClose();
                router.push(`/book-record/${book.book_id}`);
              }}
            >
              <Text style={[styles.bookTitle, { color: colors.text }]}>{book.books.title}</Text>
              <Text style={[styles.bookAuthor, { color: colors.textMuted }]}>
                저자: {book.books.author?.split("(지은이")[0].trim()}
              </Text>
              <Text style={[styles.viewDetailsLink, { color: colors.primary }]}>자세히 보기 →</Text>
            </TouchableOpacity>

            {/* Navigation Controls */}
            <View style={[styles.navContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={onPrev}
                style={[styles.navButton, { backgroundColor: isDark ? colors.border : 'rgba(0, 0, 0, 0.05)' }]}
              >
                <ChevronLeftIcon size={24} color={colors.textMuted} />
              </TouchableOpacity>
              
              <Text style={styles.navCounter}>
                {currentIndex + 1} / {totalNotes}
              </Text>
              
              <TouchableOpacity
                onPress={onNext}
                style={[styles.navButton, { backgroundColor: isDark ? colors.border : 'rgba(0, 0, 0, 0.05)' }]}
              >
                <ChevronRightIcon size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contentScroll: {
    minHeight: 100,
    maxHeight: 200,
    marginBottom: 24,
  },
  noteContent: {
    fontSize: 18,
    lineHeight: 28,
  },
  bookInfoContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  viewDetailsLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  navCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
