import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatBubbleIcon } from "../../components/Icons";
import { useTheme } from "../../context/ThemeContext";
// import ChatInterface from "../../components/ChatInterface"; // Coming Soon - 기능 보존

export default function Chat() {
  const { colors } = useTheme();
  
  // Coming Soon 화면
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ChatBubbleIcon size={64} color={colors.textMuted} />
        <Text style={[styles.title, { color: colors.text }]}>AI 독서 비서</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Coming Soon</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          내 독서 기록을 분석하고,{'\n'}
          맞춤 추천을 받아보세요.
        </Text>
      </View>
    </View>
  );

  // 기존 ChatInterface 코드 (주석 처리)
  // return (
  //   <ChatInterface />
  // );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
});
