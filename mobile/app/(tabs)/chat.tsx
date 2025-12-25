import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatBubbleIcon } from "../../components/Icons";

export default function Chat() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <ChatBubbleIcon size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.title}>AI 채팅</Text>
        <Text style={styles.subtitle}>
          AI와 함께 책에 대해 이야기해보세요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#03314B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});
