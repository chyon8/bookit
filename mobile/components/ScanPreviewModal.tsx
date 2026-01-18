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
import { ImageCropper } from './ImageCropper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface ScanPreviewModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  scannedText: string;
  imageUri: string | null;
  onScan: () => void;
  isScanning: boolean;
  error?: string | null;
  onUpdateImage?: (uri: string, base64: string) => void;
}

export function ScanPreviewModal({
  isVisible,
  onClose,
  onApply,
  scannedText,
  imageUri,
  onScan,
  isScanning,
  error,
  onUpdateImage
}: ScanPreviewModalProps) {
  const [text, setText] = React.useState(scannedText);
  const [step, setStep] = React.useState<'crop' | 'edit'>('crop');
  const [displayImageUri, setDisplayImageUri] = React.useState<string | null>(null);
  const { colors, isDark } = useTheme();

  React.useEffect(() => {
    setText(scannedText);
    // When text is extracted, move to edit step
    if (scannedText) {
      setStep('edit');
    }
  }, [scannedText]);

  React.useEffect(() => {
    // When imageUri changes (and is not null), reset to crop step
    if (imageUri) {
        setDisplayImageUri(imageUri);
        setStep('crop');
    }
  }, [imageUri]);

  const handleCropComplete = ({ uri, base64 }: { uri: string; base64?: string }) => {
    // Don't update displayImageUri - keep original for re-cropping
    // Just pass base64 to parent for OCR
    if (onUpdateImage && base64) {
        onUpdateImage(uri, base64);
        // Parent will trigger OCR with the base64 directly
    }
  };
  
  const handleCropCancel = () => {
    onClose();
  };

  const handleBackToCrop = () => {
    setStep('crop');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {step === 'crop' ? "영역 선택" : "텍스트 확인 및 수정"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <XMarkIcon size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {step === 'crop' ? (
          // Step 1: Crop Mode - Full screen cropper
          <View style={styles.content}>
            {displayImageUri && (
              <GestureHandlerRootView style={{ flex: 1 }}>
                <ImageCropper 
                  imageUri={displayImageUri} 
                  onCancel={handleCropCancel}
                  onCrop={handleCropComplete}
                  extractButtonText={isScanning ? '추출 중...' : '텍스트 추출'}
                />
              </GestureHandlerRootView>
            )}
            
            {/* Loading Overlay during OCR */}
            {isScanning && (
              <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: '#fff', marginTop: 12, fontSize: 16 }}>텍스트를 추출하고 있어요...</Text>
              </View>
            )}
            
            {/* Error Message */}
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: isDark ? '#451a1a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FECACA' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        ) : (
          // Step 2: Edit Mode - Text only, no image
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.content}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {/* Error Message */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: isDark ? '#451a1a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FECACA' }]}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Text Editing Area */}
              <View style={styles.textContainer}>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  필요한 부분을 선택하거나 수정하세요.
                </Text>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  multiline
                  autoFocus
                  style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  textAlignVertical="top"
                  placeholder="텍스트가 여기에 표시됩니다."
                  placeholderTextColor={colors.textMuted}
                />

                {/* Back to Crop Button */}
                <TouchableOpacity
                  onPress={handleBackToCrop}
                  style={[styles.backToCropButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}
                >
                  <Text style={[styles.backToCropButtonText, { color: colors.textMuted }]}>
                    ← 영역 다시 선택
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* Footer Actions */}
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { backgroundColor: isDark ? colors.border : '#F1F5F9' }]}>
            <Text style={[styles.cancelButtonText, { color: colors.textMuted }]}>취소</Text>
          </TouchableOpacity>
          {step === 'edit' && text ? (
            <TouchableOpacity
              onPress={() => onApply(text)}
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.applyButtonText}>인용구에 적용</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
  backToCropButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  backToCropButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
