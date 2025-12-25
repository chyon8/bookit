import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { UserBook } from '../hooks/useBooks';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

export type Note = {
  book: UserBook;
  note: { title: string; content: string };
};

interface RandomNoteModalProps {
  isVisible: boolean;
  currentNote: Note | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
  totalNotes: number;
}

const { width } = Dimensions.get('window');

export function RandomNoteModal({
  isVisible,
  currentNote,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalNotes
}: RandomNoteModalProps) {
  if (!currentNote) return null;

  const { book, note } = currentNote;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalCard}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          {/* Note Type Label */}
          <Text style={styles.noteLabel}>{note.title}</Text>
          
          {/* Note Content */}
          <ScrollView style={styles.contentScroll}>
            <Text style={styles.noteContent}>{note.content}</Text>
          </ScrollView>

          {/* Book Info */}
          <TouchableOpacity style={styles.bookInfoContainer}>
            <Text style={styles.bookTitle}>{book.books.title}</Text>
            <Text style={styles.bookAuthor}>
              저자: {book.books.author?.split("(지은이")[0].trim()}
            </Text>
            <Text style={styles.viewDetailsLink}>자세히 보기 →</Text>
          </TouchableOpacity>

          {/* Navigation Controls */}
          <View style={styles.navContainer}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onPrev(); }}
              style={styles.navButton}
            >
              <ChevronLeftIcon size={24} color="#4B5563" />
            </TouchableOpacity>
            
            <Text style={styles.navCounter}>
              {currentIndex + 1} / {totalNotes}
            </Text>
            
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onNext(); }}
              style={styles.navButton}
            >
              <ChevronRightIcon size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
    backgroundColor: '#FDF1F1', // card-secondary from web
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
    color: '#475569',
    letterSpacing: 1,
    marginBottom: 16,
  },
  contentScroll: {
    minHeight: 100,
    maxHeight: 200,
    marginBottom: 24,
  },
  noteContent: {
    fontSize: 18,
    color: '#03314B',
    lineHeight: 28,
  },
  bookInfoContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#03314B',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  viewDetailsLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4ADE80',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  navCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
