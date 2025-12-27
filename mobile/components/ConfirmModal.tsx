import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

interface ConfirmModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

import { useTheme } from '../context/ThemeContext';

export function ConfirmModal({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "확인",
  cancelText = "취소",
  isDestructive = false
}: ConfirmModalProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]} 
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                isDestructive 
                  ? { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' } 
                  : { backgroundColor: colors.primary }
              ]} 
              onPress={onConfirm}
            >
              <Text style={[
                styles.buttonText, 
                { color: isDestructive ? (isDark ? '#F87171' : '#EF4444') : '#FFFFFF' }
              ]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
  },
  confirmButton: {
  },
  destructiveButton: {
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  destructiveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
