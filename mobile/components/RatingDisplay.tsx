import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StarIcon, HalfStarIcon, EmptyStarIcon } from './Icons';

interface RatingDisplayProps {
  rating: number;
  size?: number;
  color?: string;
  inactiveColor?: string;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({ 
  rating, 
  size = 16, 
  color = "#FBBF24", // Yellow-400
  inactiveColor = "#E2E8F0" // Gray-200
}) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (rating >= i) {
          return <StarIcon key={i} size={size} color={color} />;
        } else if (rating >= i - 0.5) {
          return <HalfStarIcon key={i} size={size} color={color} />;
        } else {
          return <EmptyStarIcon key={i} size={size} color={inactiveColor} />;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
});
