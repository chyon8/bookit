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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {text ? "텍스트 확인 및 수정" : "이미지 확인"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <XMarkIcon size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Image Preview */}
            {imageUri && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Text Area or Scan Button */}
            {text ? (
              <View style={styles.textContainer}>
                <Text style={styles.helperText}>
                  필요한 부분을 선택하거나 수정하세요.
                </Text>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  multiline
                  style={styles.textArea}
                  textAlignVertical="top"
                  placeholder="텍스트가 여기에 표시됩니다."
                />
              </View>
            ) : (
              <View style={styles.actionContainer}>
                <Text style={styles.actionText}>
                  위 이미지에서 텍스트를 추출하시겠습니까?
                </Text>
                <TouchableOpacity
                  onPress={onScan}
                  disabled={isScanning}
                  style={[styles.scanButton, isScanning && styles.disabledButton]}
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
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            {text ? (
              <TouchableOpacity
                onPress={() => onApply(text)}
                style={styles.applyButton}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
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
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    overflow: 'hidden',
    height: 300,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#64748B',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    lineHeight: 24,
  },
  actionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4ADE80',
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
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
