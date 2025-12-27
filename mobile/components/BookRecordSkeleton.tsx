import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, SafeAreaView } from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

export const BookRecordSkeleton = () => {
  const { colors, isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonColor = isDark ? '#334155' : '#E2E8F0';
  const skeletonMutedColor = isDark ? '#1E293B' : '#F1F5F9';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.headerButton, { backgroundColor: skeletonColor }]} />
        <View style={[styles.headerTitle, { backgroundColor: skeletonColor }]} />
        <View style={[styles.headerButton, { backgroundColor: skeletonColor }]} />
      </View>

      <View style={styles.content}>
        {/* Banner Area */}
        <Animated.View style={[styles.bannerArea, { opacity, backgroundColor: isDark ? '#1E293B' : '#CBD5E1' }]} />

        {/* Book Info Overlay */}
        <View style={styles.bookInfoOverlay}>
          <Animated.View style={[styles.coverImage, { opacity, backgroundColor: skeletonColor }]} />
          <Animated.View style={[styles.titleLine, { opacity, backgroundColor: skeletonColor }]} />
          <Animated.View style={[styles.authorLine, { opacity, backgroundColor: skeletonColor }]} />
        </View>

        {/* Content Cards */}
        <View style={[styles.cardContainer, { backgroundColor: colors.background }]}>
          <Animated.View style={[styles.card, { height: 120, opacity, backgroundColor: colors.card }]} />
          <Animated.View style={[styles.card, { height: 80, opacity, backgroundColor: colors.card }]} />
          <Animated.View style={[styles.card, { height: 150, opacity, backgroundColor: colors.card }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  headerTitle: {
    width: 100,
    height: 20,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  bannerArea: {
    height: 280,
    width: '100%',
  },
  bookInfoOverlay: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 16,
  },
  titleLine: {
    width: 180,
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  authorLine: {
    width: 100,
    height: 16,
    borderRadius: 4,
  },
  cardContainer: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    width: '100%',
  },
});
