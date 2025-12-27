import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withDelay, 
  withRepeat, 
  withSequence, 
  withTiming, 
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
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
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(60);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const duration = 2000;
    
    // 0% -> 40%
    const animate = () => {
       // Reset
       opacity.value = 0;
       translateY.value = 60;
       rotate.value = 0;
       scale.value = 0.8;

       // Start Sequence
       opacity.value = withDelay(delay, withRepeat(withSequence(
         withTiming(1, { duration: duration * 0.4 }),
         withTiming(1, { duration: duration * 0.6 })
       ), -1));

       translateY.value = withDelay(delay, withRepeat(withSequence(
         withTiming(-10, { duration: duration * 0.4, easing: Easing.ease }),
         withTiming(0, { duration: duration * 0.3 }),
         withTiming(0, { duration: duration * 0.3 })
       ), -1));

       rotate.value = withDelay(delay, withRepeat(withSequence(
         withTiming(-3, { duration: duration * 0.4 }),
         withTiming(0, { duration: duration * 0.3 }),
         withTiming(0, { duration: duration * 0.3 })
       ), -1));

       scale.value = withDelay(delay, withRepeat(withSequence(
         withTiming(1.05, { duration: duration * 0.4 }),
         withTiming(1, { duration: duration * 0.3 }),
         withTiming(1, { duration: duration * 0.3 })
       ), -1));
    }
     
    animate();

    return () => {
       cancelAnimation(opacity);
       cancelAnimation(translateY);
       cancelAnimation(rotate);
       cancelAnimation(scale);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
        { scale: scale.value }
      ]
    };
  });

  return (
    <Animated.View
      style={[
        styles.book,
        { 
          backgroundColor: color, 
          height, 
          left,
          zIndex: color === '#f28c8c' ? 10 : 1 // z-index for middle book
        },
        animatedStyle
      ]}
    />
  );
};

export const BookSearchLoading = ({ message = "책을 찾고 있어요..." }: { message?: string }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.loader}>
        <Book delay={0} color="#f3c969" height={75} left={20} />
        <Book delay={250} color="#f28c8c" height={90} left={70} />
        <Book delay={500} color="#82c4a8" height={80} left={120} />
        <View style={styles.shelf} />
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
    backgroundColor: '#9b7a60',
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
