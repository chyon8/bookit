import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatBubbleIcon } from "../../components/Icons";
import { useTheme } from "../../context/ThemeContext";

export default function Chat() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ChatBubbleIcon size={48} color={colors.textMuted} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>AI 채팅</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          AI와 함께 책에 대해 이야기해보세요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
