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
  Image
} from "react-native";
import { useRouter, Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import Svg, { Path } from "react-native-svg";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import Constants from "expo-constants";
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
        ...(Constants.appOwnership !== 'expo' && { scheme: 'bookshelf' }),
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
          // Parse params from the callback URL hash to get the token
          const { params, errorCode } = QueryParams.getQueryParams(result.url);
          
          if (errorCode) {
            setAuthError(errorCode);
            return;
          }
          
          const { access_token, refresh_token } = params;
          
          if (access_token && refresh_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (sessionError) {
              setAuthError(sessionError.message);
            }
          } else {
            setAuthError("구글 로그인 인증 정보를 받아오지 못했습니다.");
          }
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
          <Image 
            source={require('../../assets/bookit_icon_dark.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
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
              <Svg width={20} height={20} viewBox="0 0 48 48">
                <Path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107" />
                <Path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00" />
                <Path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50" />
                <Path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2" />
              </Svg>
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
    marginLeft: 10,
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
