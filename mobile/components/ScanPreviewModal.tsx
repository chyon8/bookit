import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { XMarkIcon } from './Icons';

interface ScanPreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  scannedText: string;
  imageUri: string | null;
  onScan: () => void;
  isScanning: boolean;
  error?: string | null;
}

export function ScanPreviewModal({
  isVisible,
  onClose,
  onApply,
  scannedText,
  imageUri,
  onScan,
  isScanning,
  error
}: ScanPreviewModalProps) {
  const [text, setText] = React.useState(scannedText);
  const { colors, isDark } = useTheme();

  React.useEffect(() => {
    setText(scannedText);
  }, [scannedText]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {text ? "텍스트 확인 및 수정" : "이미지 확인"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <XMarkIcon size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Image Preview */}
            {imageUri && (
              <View style={[styles.imageContainer, { backgroundColor: isDark ? colors.border : '#F1F5F9', borderColor: colors.border }]}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: isDark ? '#451a1a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FECACA' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Text Area or Scan Button */}
            {text ? (
              <View style={styles.textContainer}>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  필요한 부분을 선택하거나 수정하세요.
                </Text>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  multiline
                  style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  textAlignVertical="top"
                  placeholder="텍스트가 여기에 표시됩니다."
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ) : (
              <View style={styles.actionContainer}>
                <Text style={[styles.actionText, { color: colors.textMuted }]}>
                  위 이미지에서 텍스트를 추출하시겠습니까?
                </Text>
                <TouchableOpacity
                  onPress={onScan}
                  disabled={isScanning}
                  style={[styles.scanButton, isScanning && styles.disabledButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                >
                  {isScanning ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.scanButtonText}>텍스트 추출하기</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}>
              <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>취소</Text>
            </TouchableOpacity>
            {text ? (
              <TouchableOpacity
                onPress={() => onApply(text)}
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.applyButtonText}>인용구에 적용</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 300,
    marginBottom: 20,
    borderWidth: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    borderWidth: 1,
    lineHeight: 24,
  },
  actionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionText: {
    fontSize: 16,
    marginBottom: 16,
  },
  scanButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
