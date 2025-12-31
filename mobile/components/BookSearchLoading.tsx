import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Book = ({ 
  delay, 
  color, 
  height, 
  left 
}: { 
  delay: number; 
  color: string; 
  height: number; 
  left: number;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset value
    animatedValue.setValue(0);

    // Create a continuous loop
    // 0 -> 1 will represent 0% to 100% of the 2000ms animation
    // Start with a delay, then loop the bounce
    Animated.sequence([
      Animated.delay(delay),
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          })
        ])
      )
    ]).start();

    return () => {
      animatedValue.stopAnimation();
    }
  }, [delay]);

  // Interpolate for a "floating" or "bouncing" effect
  // translateY: 0 -> -20 (up) -> 0 (down)
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  // opacity: Keep visible after initial fade in
  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1],
  });

  // rotate: subtle tilt while moving
  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-2deg'],
  });

  // scale: slightly expand at the peak
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Animated.View
      style={[
        styles.book,
        { 
          backgroundColor: color, 
          height, 
          left,
          zIndex: color === '#f28c8c' ? 10 : 1,
          opacity: opacity,
          transform: [
            { translateY },
            { rotate },
            { scale }
          ]
        }
      ]}
    />
  );
};

export const BookSearchLoading = ({ message = "책을 찾고 있어요..." }: { message?: string }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.loader}>
        <Book delay={0} color="#f3c969" height={75} left={20} />
        <Book delay={250} color="#f28c8c" height={90} left={70} />
        <Book delay={500} color="#82c4a8" height={80} left={120} />
        <View style={[styles.shelf, { backgroundColor: isDark ? '#5d4037' : '#9b7a60' }]} />
      </View>
      <Text style={[styles.text, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    width: 180,
    height: 120,
    position: 'relative',
  },
  book: {
    position: 'absolute',
    bottom: 20,
    width: 40,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  shelf: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    width: '100%',
    height: 5,
    borderRadius: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '600',
  },
});
