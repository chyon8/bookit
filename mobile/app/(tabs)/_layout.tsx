import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
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
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setLogoutModalVisible(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      // 1. Call the RPC to delete the user from auth.users (and cascade to user_books)
      const { error } = await supabase.rpc('delete_my_account');
      
      if (error) {
        throw error;
      }
      
      // 2. Sign out the local session forcefully since the user is already deleted on the server
      await supabase.auth.signOut({ scope: 'local' });
      setDeleteModalVisible(false);
    } catch (error: any) {
      console.error("Error deleting account:", error);
      Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const showAccountMenu = () => {
    Alert.alert(
      "계정 관리",
      "원하시는 작업을 선택해주세요.",
      [
        { text: "취소", style: "cancel" },
        { text: "로그아웃", onPress: () => setLogoutModalVisible(true) },
        { text: "계정 탈퇴", style: "destructive", onPress: () => setDeleteModalVisible(true) }
      ]
    );
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
              <TouchableOpacity onPress={showAccountMenu}>
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

      <ConfirmModal
        isVisible={isDeleteModalVisible}
        title="계정 탈퇴"
        message="정말 계정을 탈퇴하시겠습니까? 기록하신 모든 책과 메모가 영구적으로 삭제되며, 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalVisible(false)}
        confirmText={isDeleting ? "처리 중..." : "탈퇴하기"}
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
