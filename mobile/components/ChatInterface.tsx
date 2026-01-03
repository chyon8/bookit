import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { ChatBubbleIcon, SendIcon, SparklesIcon, BookOpenIcon } from "./Icons";
import { useBooks } from "../hooks/useBooks";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

export default function ChatInterface() {
  const { colors } = useTheme();
  const { data: userBooks } = useBooks();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '안녕하세요! 저는 당신의 AI 독서 비서입니다. 당신의 독서 기록에 대해 무엇이든 물어보세요. \n\n**"AI 리포트"**라고 입력하여 독서 취향에 대한 상세 분석을 받아보세요.',
      sender: "ai",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: text,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const aiMessageId = Date.now() + 1;
    const initialAiMessage: Message = {
      id: aiMessageId,
      text: "",
      sender: "ai",
    };
    setMessages((prev) => [...prev, initialAiMessage]);

    try {
        // Prepare payload by mapping mobile data structure to what backend expects
        const booksPayload = userBooks?.map(ub => ({
            id: ub.books.id,
            title: ub.books.title,
            author: ub.books.author,
            category: ub.books.category,
            coverImageUrl: ub.books.cover_image_url,
            description: ub.books.description,
            isbn13: ub.books.isbn13,
            review: {
                status: ub.status,
                rating: ub.rating,
                start_date: ub.start_date,
                end_date: ub.end_date,
                one_line_review: ub.one_line_review,
                overall_impression: ub.overall_impression,
                motivation: ub.books.category, // fallback or from join
                memorable_quotes: ub.memorable_quotes,
                memos: ub.memos,
                // Add other review fields mapping if available in UserBook
            }
        })) || [];

        // Note: Replace with your actual local IP for testing on device
        const API_URL = process.env.EXPO_PUBLIC_API_URL 
            ? `${process.env.EXPO_PUBLIC_API_URL}/api/chat` 
            : 'http://localhost:3000/api/chat';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ books: booksPayload, prompt: text }),
        });

        if (!response.ok) throw new Error('Network response was not ok');
        
        const fullText = await response.text();
        
        const lines = fullText.split('\n\n');
        let cleanText = "";
        
        for (const line of lines) {
            if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "");
                if (dataStr === "[DONE]") continue;
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.text) cleanText += parsed.text;
                } catch (e) {}
            }
        }
        
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === aiMessageId
                    ? { ...msg, text: cleanText }
                    : msg
            )
        );

    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
            msg.id === aiMessageId
                ? { ...msg, text: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요." }
                : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const SuggestionChip = ({ text }: { text: string }) => (
    <TouchableOpacity
      onPress={() => handleSendMessage(text)}
      style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={[styles.chipText, { color: colors.text }]}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {messages.map((item) => (
          <View
            key={item.id}
            style={[
              styles.messageBubble,
              item.sender === "user" ? styles.userBubble : styles.aiBubble,
              { 
                backgroundColor: item.sender === "user" ? colors.primary : colors.card,
                alignSelf: item.sender === "user" ? "flex-end" : "flex-start",
                borderColor: colors.border,
                borderWidth: item.sender === "ai" ? 1 : 0
              }
            ]}
          >
            {item.sender === 'ai' && (
                <View style={{ marginBottom: 4, flexDirection: 'row', alignItems: 'center' }}>
                     <BookOpenIcon size={14} color={colors.textMuted} />
                     <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 4 }}>AI Assistant</Text>
                </View>
            )}
            <Text style={{ 
                color: item.sender === 'user' ? '#ffffff' : colors.text,
                lineHeight: 20
            }}>
                {item.text}
            </Text>
          </View>
        ))}
        {isLoading && (
            <View style={{ padding: 10, alignSelf: 'flex-start', marginLeft: 10 }}>
                <ActivityIndicator color={colors.primary} size="small" />
            </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            <SuggestionChip text="AI 리포트" />
            <SuggestionChip text="별점 5점 책" />
            <SuggestionChip text="책 추천해줘" />
        </ScrollView>
        <View style={styles.inputRow}>
            <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            value={input}
            onChangeText={setInput}
            placeholder="AI에게 물어보세요..."
            placeholderTextColor={colors.textMuted}
            multiline
            />
            <TouchableOpacity 
                style={[styles.sendButton, { backgroundColor: colors.primary, opacity: (!input.trim() || isLoading) ? 0.5 : 1 }]}
                onPress={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading}
            >
            <SendIcon size={20} color="#ffffff" />
            </TouchableOpacity>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxHeight: 40,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    marginRight: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
