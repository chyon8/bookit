import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { StarIcon } from './Icons'; // Assuming you have this or will update Icons.tsx

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, size = 32 }) => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((starValue) => {
        const isFilled = rating >= starValue;
        const isHalf = rating === starValue - 0.5;

        return (
          <TouchableOpacity
            key={starValue}
            onPress={() => setRating(rating === starValue ? 0 : starValue)}
            style={styles.starContainer}
          >
            <StarIcon 
              size={size} 
              color={isFilled || isHalf ? "#FACC15" : "#E2E8F0"} // Yellow-400 : Gray-200
            />
            {/* You might want a custom HalfStar icon for precision, 
                but for now full stars are the main interaction on mobile */}
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
