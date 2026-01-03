import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { TrashIcon, PencilIcon } from './Icons';

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onEdit, onDelete }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [0, 160],
    });

    return (
      <View style={styles.rightActionsContainer}>
        {onEdit && (
          <TouchableOpacity
            onPress={() => {
              swipeableRef.current?.close();
              onEdit();
            }}
            style={[styles.actionButton, styles.editButton]}
          >
            <PencilIcon size={22} color="white" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            onPress={() => {
              swipeableRef.current?.close();
              onDelete();
            }}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <TrashIcon size={22} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
    width: 160,
    height: '100%',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3B82F6', // blue-500
  },
  deleteButton: {
    backgroundColor: '#EF4444', // red-500
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});
