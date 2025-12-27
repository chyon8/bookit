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
          <TouchableOpacity
            key={starValue}
            // Cycle: Full -> Half -> Clear (or lower)
            onPress={() => {
              if (rating === starValue) {
                setRating(starValue - 0.5);
              } else if (rating === starValue - 0.5) {
                setRating(starValue - 1);
              } else {
                setRating(starValue);
              }
            }}
            style={styles.starContainer}
          >
            {isFull ? (
              <StarIcon size={size} color="#FACC15" />
            ) : isHalf ? (
              <HalfStarIcon size={size} color="#FACC15" />
            ) : (
              <EmptyStarIcon size={size} color={isDark ? colors.border : "#E2E8F0"} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starContainer: {
    padding: 2,
  },
});
