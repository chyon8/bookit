import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { SendIcon, BookOpenIcon, ChevronLeftIcon } from "../../components/Icons";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../lib/supabase";
import Markdown from 'react-native-markdown-display';
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";

interface LocalMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
}

export default function ChatScreen() {
  const { colors } = useTheme();
  // `useLocalSearchParams` is safe here because this is a route file.
  const params = useLocalSearchParams<{ conversationId: string, bookId?: string }>();
  const initialConversationId = params.conversationId;
  const bookId = params.bookId;
  const queryClient = useQueryClient();
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId === 'temp' ? null : initialConversationId
  );

  const { data: historyMessages, isLoading: isHistoryLoading } = useChatMessages(activeConversationId);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Sync history to local UI state when loaded
  useEffect(() => {
    if (historyMessages && historyMessages.length > 0) {
      // Only set if we haven't already locally overridden (during active chat)
      // For MVP it's simpler to just sync if history array size is larger
      if (messages.length === 0 || historyMessages.length > messages.length) {
        setMessages(historyMessages.map(m => ({
          id: m.id,
          text: m.content,
          sender: m.role === 'assistant' ? 'ai' : 'user'
        })));
      }
    } else if (initialConversationId === 'temp' && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          text: bookId 
            ? '이 책에 대해 어떤 기록이든 저와 함께 깊게 파고들어 봐요.\n어떤 문장이 가장 와닿으셨나요?' 
            : '안녕하세요! 서재 전체의 기록을 묶어서 인사이트를 발견해 드릴게요.\n"최근에 내가 자주 읽는 장르가 뭐지?" 혹은 "내 서재를 요약해줘" 등을 물어보세요!',
          sender: 'ai'
        }
      ]);
    }
  }, [historyMessages, initialConversationId, bookId]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 200);
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const currentInput = text;
    setInput("");
    setIsLoading(true);

    const userMessage: LocalMessage = {
      id: Date.now().toString(),
      text: currentInput,
      sender: "user",
    };
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: LocalMessage = {
      id: aiMessageId,
      text: "",
      sender: "ai",
    };

    setMessages((prev) => [...prev, userMessage, initialAiMessage]);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Authentication required");

        let apiHost = "localhost";
        // Dynamically grab the laptop's IP address that Expo is running on!
        const debuggerHost = Constants.expoConfig?.hostUri;
        if (debuggerHost) {
          apiHost = debuggerHost.split(':')[0];
        }

        const API_URL = __DEV__ 
            ? `http://${apiHost}:3000/api/chat` 
            : 'https://bookit-sigma-virid.vercel.app/api/chat';

        return new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', API_URL);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
            
            let lastParsedIndex = 0;
            let cleanText = "";
            let buffer = "";

            xhr.onprogress = () => {
                const responseText = xhr.responseText;
                const newChunk = responseText.substring(lastParsedIndex);
                lastParsedIndex = responseText.length;

                buffer += newChunk;
                let boundaryIndex;
                
                while ((boundaryIndex = buffer.indexOf('\n\n')) !== -1) {
                    const line = buffer.substring(0, boundaryIndex);
                    buffer = buffer.substring(boundaryIndex + 2);

                    if (line.startsWith("data: ")) {
                        const dataStr = line.replace("data: ", "");
                        if (dataStr === "[DONE]") {
                            // On complete, invalidate chat history to sync next time user checks
                            if (activeConversationId) {
                                queryClient.invalidateQueries({ queryKey: ["chat_messages", activeConversationId] });
                            }
                            // Also invalidate conversations list
                            queryClient.invalidateQueries({ queryKey: ["chat_conversations"] });
                            continue;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.type === 'init' && parsed.conversationId) {
                               setActiveConversationId(parsed.conversationId);
                               router.setParams({ conversationId: parsed.conversationId });
                            }
                            if (parsed.type === 'text') {
                               cleanText += parsed.text;
                               setMessages((prev) =>
                                   prev.map((msg) =>
                                       msg.id === aiMessageId
                                           ? { ...msg, text: cleanText }
                                           : msg
                                   )
                               );
                            }
                            if (parsed.type === 'error') {
                               cleanText += "\n\n⚠️ " + parsed.error;
                               setMessages((prev) =>
                                   prev.map((msg) =>
                                       msg.id === aiMessageId
                                           ? { ...msg, text: cleanText }
                                           : msg
                                   )
                               );
                            }
                        } catch (e) {
                            console.error("SSE JSON Parse Error for sequence:", dataStr, e);
                        }
                    }
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 400) {
                     reject(new Error(`Server Error: ${xhr.status} ${xhr.responseText}`));
                } else {
                     resolve();
                }
            };

            xhr.onerror = () => {
                reject(new Error("Network connection error"));
            };

            xhr.send(JSON.stringify({ 
              conversationId: activeConversationId, 
              bookId: bookId, 
              prompt: currentInput 
            }));
        });
    } catch (error: any) {
      console.error("Chat Stream Error:", error);
      // 에러 발생 시 진행 중이던 유저, AI 메시지 버블을 삭제하고 입력창을 복원합니다.
      setMessages((prev) => prev.filter(msg => msg.id !== userMessage.id && msg.id !== aiMessageId));
      setInput(currentInput);
      alert(`메시지 전송에 실패했습니다.\n\n${error.message}`);
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

  const TypingIndicator = () => {
    const [dots, setDots] = useState("");
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".");
        }, 400);
        return () => clearInterval(interval);
    }, []);
    return (
        <View style={styles.typingContainer}>
           <Text style={[styles.typingText, { color: colors.textMuted }]}>{dots}</Text>
        </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
           {/* If ChevronLeftIcon is not defined in Icons.tsx, BookOpenIcon or text can act as fallback, but assuming router header can also be used. We'll use a text '<' if icon fails. */}
           <Text style={{fontSize: 24, color: colors.primary}}>{'< '}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {bookId ? "책 포커스 대화" : "AI 독서 메이트"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {isHistoryLoading && messages.length === 0 ? (
           <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          messages.map((item) => (
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
                  <View style={{ marginBottom: 6, flexDirection: 'row', alignItems: 'center' }}>
                       <BookOpenIcon size={14} color={colors.textMuted} />
                       <Text style={{ fontSize: 12, color: colors.textMuted, marginLeft: 6, fontWeight: '600' }}>AI Coach</Text>
                  </View>
              )}
              {item.sender === 'ai' && !item.text && isLoading ? (
                  <TypingIndicator />
              ) : item.sender === 'ai' ? (
                  <Markdown style={{
                     body: { color: colors.text, fontSize: 15, lineHeight: 22 },
                     list_item: { marginBottom: 4 }
                  }}>
                      {item.text || "..."}
                  </Markdown>
              ) : (
                  <Text style={{ 
                      color: '#ffffff',
                      lineHeight: 22,
                      fontSize: 15
                  }}>
                      {item.text}
                  </Text>
              )}
            </View>
          ))
        )}
        {isLoading && (
            <View style={{ padding: 10, alignSelf: 'flex-start', marginLeft: 10 }}>
                <ActivityIndicator color={colors.primary} size="small" />
            </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {messages.length === 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                {bookId ? (
                  <>
                    <SuggestionChip text="내 한줄평에 대해 어떻게 생각해?" />
                    <SuggestionChip text="내가 스크랩한 문장들의 의미를 찾아줘" />
                  </>
                ) : (
                  <>
                    <SuggestionChip text="서재 전체의 핵심 키워드는 뭐야?" />
                    <SuggestionChip text="내 취향에 맞는 책 3권 추천해줘" />
                  </>
                )}
            </ScrollView>
          )}
          <View style={styles.inputRow}>
              <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={input}
              onChangeText={setInput}
              placeholder="AI 선생님에게 물어보세요..."
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 20,
    marginBottom: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
  },
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chipsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxHeight: 40,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderWidth: 1,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  typingContainer: {
    height: 24,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  typingText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    lineHeight: 24,
    includeFontPadding: false,
    textAlignVertical: 'bottom',
  }
});
