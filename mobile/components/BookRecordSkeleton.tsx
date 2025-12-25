import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions, SafeAreaView } from "react-native";

const { width } = Dimensions.get("window");

export const BookRecordSkeleton = () => {
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

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerButton} />
        <View style={styles.headerTitle} />
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        {/* Banner Area */}
        <Animated.View style={[styles.bannerArea, { opacity }]} />

        {/* Book Info Overlay */}
        <View style={styles.bookInfoOverlay}>
          <Animated.View style={[styles.coverImage, { opacity }]} />
          <Animated.View style={[styles.titleLine, { opacity }]} />
          <Animated.View style={[styles.authorLine, { opacity }]} />
        </View>

        {/* Content Cards */}
        <View style={styles.cardContainer}>
          <Animated.View style={[styles.card, { height: 120, opacity }]} />
          <Animated.View style={[styles.card, { height: 80, opacity }]} />
          <Animated.View style={[styles.card, { height: 150, opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  headerTitle: {
    width: 100,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  content: {
    flex: 1,
  },
  bannerArea: {
    height: 280,
    backgroundColor: '#CBD5E1', 
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
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  titleLine: {
    width: 180,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    marginBottom: 8,
  },
  authorLine: {
    width: 100,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  cardContainer: {
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
  },
});
