import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useBooks, UserBook } from "../../hooks/useBooks";
import { router } from "expo-router";
import { SearchIcon, BookOpenIcon, ChevronRightIcon } from "../../components/Icons";

export default function NewChatScreen() {
  const { colors } = useTheme();
  const { data: userBooks } = useBooks();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBooks = userBooks?.filter(ub => 
    ub.books?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ub.books?.author?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStartGeneralChat = () => {
    // 'temp' ID indicates a new, unsaved conversation
    router.replace('/chat/temp'); 
  };

  const handleStartBookChat = (bookId: string) => {
    router.replace(`/chat/temp?bookId=${bookId}`);
  };

  const renderBookItem = ({ item }: { item: UserBook }) => (
    <TouchableOpacity 
      style={[styles.bookItem, { borderBottomColor: colors.border }]}
      onPress={() => handleStartBookChat(item.books.id)}
    >
      {item.books.cover_image_url ? (
        <Image source={{ uri: item.books.cover_image_url }} style={styles.coverImage} />
      ) : (
        <View style={[styles.placeholderCover, { backgroundColor: colors.border }]}>
          <BookOpenIcon size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={1}>{item.books.title}</Text>
        <Text style={[styles.bookAuthor, { color: colors.textMuted }]} numberOfLines={1}>{item.books.author}</Text>
      </View>
      <ChevronRightIcon size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>새 대화 시작</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.generalChatCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleStartGeneralChat}
        >
          <View style={[styles.generalIcon, { backgroundColor: colors.primary + '20' }]}>
            <BookOpenIcon size={24} color={colors.primary} />
          </View>
          <View style={styles.generalText}>
            <Text style={[styles.generalTitle, { color: colors.text }]}>서재 전체에 대해 대화하기</Text>
            <Text style={[styles.generalDesc, { color: colors.textMuted }]}>독서 취향 분석, 책 추천, 패턴 발견 등</Text>
          </View>
          <ChevronRightIcon size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textMuted, backgroundColor: colors.background }]}>
          또는 책을 선택하세요
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SearchIcon size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="내 서재에서 책 검색..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item) => item.id}
        renderItem={renderBookItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  generalChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  generalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  generalText: {
    flex: 1,
  },
  generalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  generalDesc: {
    fontSize: 13,
  },
  dividerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  coverImage: {
    width: 40,
    height: 60,
    borderRadius: 4,
    marginRight: 16,
  },
  placeholderCover: {
    width: 40,
    height: 60,
    borderRadius: 4,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
  },
});
