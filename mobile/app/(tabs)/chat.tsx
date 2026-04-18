import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { SwipeableRow } from "../../components/SwipeableRow";
import { ChatBubbleIcon, BookOpenIcon, PlusIcon } from "../../components/Icons";
import { useConversations, useDeleteConversation, ChatConversation } from "../../hooks/useConversations";
import { router } from "expo-router";

export default function ChatTab() {
  const { colors } = useTheme();
  const { data: conversations, isLoading } = useConversations();
  const { mutate: deleteConversation } = useDeleteConversation();

  const handleDelete = (id: string) => {
    Alert.alert("대화 삭제", "이 대화를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteConversation(id) }
    ]);
  };

  const renderItem = ({ item }: { item: ChatConversation }) => {
    return (
      <SwipeableRow onDelete={() => handleDelete(item.id)}>
        <TouchableOpacity
          style={[styles.conversationItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
            {item.book_id ? <BookOpenIcon size={24} color={colors.primary} /> : <ChatBubbleIcon size={24} color={colors.primary} />}
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {item.books?.title || "서재 전체 대화"}
            </Text>
            <Text style={[styles.preview, { color: colors.textMuted }]} numberOfLines={1}>
              {item.title || "새로운 대화"}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {new Date(item.updated_at).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </SwipeableRow>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>AI 독서 메이트</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : conversations?.length === 0 ? (
        <View style={styles.emptyContent}>
          <ChatBubbleIcon size={64} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>첫 대화를 시작해보세요</Text>
          <Text style={[styles.emptyDescription, { color: colors.textMuted }]}>
            기록한 책에 대해 깊게 대화하거나,{'\n'}전체 독서 취향을 분석받을 수 있습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/chat/new')}
      >
        <PlusIcon size={24} color="#FFF" />
      </TouchableOpacity>
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
    marginTop: -100 // Center visually slightly higher
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
  },
  time: {
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
