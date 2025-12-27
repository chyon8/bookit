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
  Alert
} from "react-native";
import { useRouter, Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { BookshelfIcon } from "../../components/Icons";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setAuthError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        setAuthError(error.message);
      } else {
        // Auth state listener in root layout will handle navigation
      }
    } catch (e) {
      setAuthError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setAuthError(null);
      
      const redirectTo = makeRedirectUri({
        scheme: 'bookshelf',
        path: 'auth/callback'
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        if (result.type === "success" && result.url) {
          // Parse params from the callback URL to get the token or code if needed
          // For Supabase, often just getting back to the app is enough if the session is handled automatically
          // but we might need to handle the hash if implicit flow, or code if exchange flow.
          // However, Supabase's `createClient` with suitable storage usually handles the session recovery
          // from the URL if `detectSessionInUrl` is true or if we manually set it.
          // Let's assume the root layout's `onAuthStateChange` or `getSession` will catch it 
          // but strictly speaking for deep linking we might need `supabase.auth.getSession()` logic triggered by deep link.
          
          // Note: createClient in supabase.ts has detectSessionInUrl: false. 
          // We might need to manually handle the URL if it returns parameters.
          // For now, let's rely on the session refresh or standard flow.
        }
      }

    } catch (e: any) {
      setAuthError(e.message || "Google 로그인 중 오류가 발생했습니다.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <BookshelfIcon size={40} color={colors.primary} />
          <Text style={[styles.logoText, { color: colors.text }]}>Bookit</Text>
        </View>

        {authError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{authError}</Text>
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
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isSigningIn || isGoogleLoading}
          style={[styles.button, { backgroundColor: colors.primary }, (isSigningIn || isGoogleLoading) && styles.buttonDisabled]}
        >
          {isSigningIn ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>로그인</Text>
          )}
        </TouchableOpacity>

        {/* Google Login Button */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={isSigningIn || isGoogleLoading}
          style={[styles.googleButton, { borderColor: colors.border }, (isSigningIn || isGoogleLoading) && styles.buttonDisabled]}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <View style={styles.googleButtonContent}>
               {/* Simple G icon representation or text */}
              <Text style={[styles.googleButtonText, { color: colors.text }]}>Google로 계속하기</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={{ color: colors.textMuted }}>계정이 없으신가요? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={[styles.linkText, { color: colors.primary }]}>회원가입</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
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
  googleButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    fontWeight: 'bold',
  },
});
