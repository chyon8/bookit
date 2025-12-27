import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BookIcon, BookshelfIcon, ChartBarIcon, SearchIcon, TrendingUpIcon } from "../../components/Icons";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function TabLayout() {
  const router = useRouter();
  const { colors, toggleTheme, isDark } = useTheme();

  return (
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
            <View style={[styles.avatar, { backgroundColor: isDark ? colors.border : '#E5E7EB' }]}>
              <Text style={[styles.avatarText, { color: colors.textMuted }]}>S</Text>
            </View>
          </View>
        ),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.tabBar, { 
          backgroundColor: colors.card,
          borderTopColor: colors.border
        }],
        tabBarLabelStyle: styles.tabBarLabel,
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
          tabBarIcon: ({ color }) => <BookIcon color={color} size={24} />,
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
          tabBarIcon: ({ color }) => <TrendingUpIcon color={color} size={24} />,
        }}
      />
    </Tabs>
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
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: 65,
    paddingBottom: 10,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
