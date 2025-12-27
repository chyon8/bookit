import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { StarIcon, HalfStarIcon, EmptyStarIcon } from './Icons';

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 32 }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isFull = rating >= starValue;
        const isHalf = rating === starValue - 0.5;

        return (
          <View key={starValue} style={{ position: 'relative', width: size, height: size }}>
            {/* The actual star icon */}
            <View style={styles.starIconWrapper}>
              {isFull ? (
                <StarIcon size={size} color="#FACC15" />
              ) : isHalf ? (
                <HalfStarIcon size={size} color="#FACC15" />
              ) : (
                <EmptyStarIcon size={size} color={isDark ? colors.border : "#E2E8F0"} />
              )}
            </View>

            {/* Hidden touch areas for left/right halves */}
            <View style={StyleSheet.absoluteFill}>
              <View style={{ flexDirection: 'row', flex: 1 }}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => setRating(rating === starValue - 0.5 ? starValue - 1 : starValue - 0.5)}
                />
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => setRating(rating === starValue ? starValue - 0.5 : starValue)}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starIconWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
