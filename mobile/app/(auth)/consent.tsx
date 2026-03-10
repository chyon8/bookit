import { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { CheckIcon } from "../../components/Icons";

export default function Consent() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    if (!privacyAgreed) {
      setError("개인정보 수집·이용에 동의해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          privacy_agreed: true,
          privacy_agreed_at: now,
          marketing_agreed: marketingAgreed,
          marketing_agreed_at: marketingAgreed ? now : null,
        }
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      setError("동의 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/bookit_icon_dark.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.logoText, { color: colors.text }]}>Bookit</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>서비스 이용 동의</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Bookit을 이용하기 위해 아래 약관에 동의해주세요.
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Consent Checkboxes */}
        <View style={styles.consentSection}>
          <TouchableOpacity 
            style={styles.consentRow}
            onPress={() => setPrivacyAgreed(!privacyAgreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }, privacyAgreed && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {privacyAgreed && <CheckIcon size={14} color="#fff" />}
            </View>
            <Text style={[styles.consentText, { color: colors.text }]}>
              <Text style={styles.consentRequired}>(필수)</Text> 개인정보 수집·이용 동의
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.consentRow}
            onPress={() => setMarketingAgreed(!marketingAgreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }, marketingAgreed && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {marketingAgreed && <CheckIcon size={14} color="#fff" />}
            </View>
            <Text style={[styles.consentText, { color: colors.text }]}>
              <Text style={styles.consentOptional}>(선택)</Text> 마케팅 정보 수신 동의
            </Text>
          </TouchableOpacity>
        </View>

        {/* Agree Button */}
        <TouchableOpacity
          onPress={handleAgree}
          disabled={isLoading || !privacyAgreed}
          style={[styles.button, { backgroundColor: colors.primary }, (isLoading || !privacyAgreed) && styles.buttonDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>동의하고 시작하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 14,
  },
  consentSection: {
    marginBottom: 16,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  consentText: {
    fontSize: 14,
    flex: 1,
  },
  consentRequired: {
    color: '#EF4444',
    fontWeight: '700',
  },
  consentOptional: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
