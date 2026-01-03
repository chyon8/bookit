import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ChatBubbleIcon } from "../../components/Icons";
import { useTheme } from "../../context/ThemeContext";
import ChatInterface from "../../components/ChatInterface";

export default function Chat() {
  return (
    <ChatInterface />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
