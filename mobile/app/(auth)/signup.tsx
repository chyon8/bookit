import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  Alert,
  ScrollView
} from "react-native";
import { useRouter, Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { ChevronLeftIcon, CheckIcon } from "../../components/Icons";

export default function SignUp() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (!privacyAgreed) {
      setError("개인정보 수집·이용에 동의해주세요.");
      return;
    }

    setIsSigningUp(true);
    setError(null);
    
    try {
      const now = new Date().toISOString();
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            privacy_agreed: true,
            privacy_agreed_at: now,
            marketing_agreed: marketingAgreed,
            marketing_agreed_at: marketingAgreed ? now : null,
          }
        }
      });
      
      if (signUpError) {
        setError(signUpError.message);
      } else {
        Alert.alert(
          "가입 성공", 
          "회원가입이 완료되었습니다. 로그인해주세요.",
          [{ text: "확인", onPress: () => router.replace("/(auth)/login") }]
        );
      }
    } catch (e) {
      setError("가입 중 오류가 발생했습니다.");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeftIcon size={24} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>로그인으로 돌아가기</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>회원가입</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Bookit에 오신 것을 환영합니다</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Email Input */}
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>이메일 주소</Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            color: colors.text
          }]}
          placeholder="email@example.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password Input */}
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>비밀번호</Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            color: colors.text
          }]}
          placeholder="6자 이상 입력해주세요"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Confirm Password Input */}
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>비밀번호 확인</Text>
        <TextInput
          style={[styles.textInput, { 
            backgroundColor: colors.card, 
            borderColor: colors.border,
            color: colors.text
          }]}
          placeholder="비밀번호를 다시 입력해주세요"
          placeholderTextColor={colors.textMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

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

        {/* Sign Up Button */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={isSigningUp || !privacyAgreed}
          style={[styles.button, { backgroundColor: colors.primary }, (isSigningUp || !privacyAgreed) && styles.buttonDisabled]}
        >
          {isSigningUp ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>가입하기</Text>
          )}
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  consentSection: {
    marginTop: 4,
    marginBottom: 8,
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
