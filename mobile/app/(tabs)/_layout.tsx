import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useState } from "react";
import { 
  BookIcon, 
  BookshelfIcon, 
  ChartBarIcon, 
  SearchIcon, 
  TrendingUpIcon,
  ListIcon,
  SparkleChatIcon
} from "../../components/Icons";
import { ConfirmModal } from "../../components/ConfirmModal";
import { supabase } from "../../lib/supabase";

export default function TabLayout() {
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 70 + insets.bottom;

  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setLogoutModalVisible(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: [styles.header, { 
            backgroundColor: colors.card,
            borderBottomColor: colors.border 
          }],
          headerTitleAlign: 'left',
          headerTitle: () => (
            <TouchableOpacity 
              style={styles.headerTitleContainer}
              onPress={() => router.push("/(tabs)")}
            >
              <BookshelfIcon size={28} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Bookit</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={toggleTheme}
              >
                <Feather 
                  name={isDark ? "sun" : "moon"} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLogoutModalVisible(true)}>
                <View style={[styles.avatar, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]}>
                  <Text style={[styles.avatarText, { color: colors.textMuted }]}>S</Text>
                </View>
              </TouchableOpacity>
            </View>
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { 
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: tabBarHeight,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            paddingTop: 12,
            borderTopWidth: 1,
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDark ? 0.4 : 0.08,
            shadowRadius: 15,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 0,
          }
        }}
      >
        <Tabs.Screen
          name="search"
          options={{
            title: "검색",
            tabBarIcon: ({ color }) => <SearchIcon color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: "내 책장",
            tabBarIcon: ({ color }) => <ListIcon color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "통계",
            tabBarIcon: ({ color }) => <ChartBarIcon color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "AI 채팅",
            tabBarIcon: ({ color }) => <SparkleChatIcon color={color} size={24} />,
          }}
        />
      </Tabs>

      <ConfirmModal
        isVisible={isLogoutModalVisible}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
        confirmText="로그아웃"
        isDestructive={true}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#03314B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#6B7280',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
