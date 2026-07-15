import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '../../src/shared/components/app-button';
import { AppTextField } from '../../src/shared/components/app-text-field';
import { AppCard } from '../../src/shared/components/app-card';
import { LoadingOverlay } from '../../src/shared/components/loading-overlay';
import { FadeInView, ScaleTouchableOpacity } from '../../src/shared/components/animated';
import { useAuthStore } from '../../src/shared/hooks/use-auth';
import { useThemeStore } from '../../src/shared/hooks/use-theme';
import { validateEmail, validatePassword } from '../../src/core/utils/validators';

type AuthMode = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { loginWithEmail, signupWithEmail, loginWithGoogle, isLoading, error, clearError } = useAuthStore();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    setLocalError(null);
    clearError();
    const emailError = validateEmail(email);
    if (emailError) { setLocalError(emailError); return; }
    const passwordError = validatePassword(password);
    if (passwordError) { setLocalError(passwordError); return; }
    setLoading(true);
    try {
      if (authMode === 'login') { await loginWithEmail(email, password); }
      else { await signupWithEmail(email, password, displayName || email.split('@')[0]); }
      router.replace('/(tabs)/upload');
    } catch (err: any) { setLocalError(err.message || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try { await loginWithGoogle(); router.replace('/(tabs)/upload'); }
    catch (err: any) { setLocalError(err.message || 'Google sign-in failed'); }
    finally { setLoading(false); }
  };

  const displayError = localError || error;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <FadeInView delay={0}>
            <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="database-search" size={40} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>AI Bulk Data{'\n'}Extractor</Text>
              <Text style={styles.subtitle}>
                {authMode === 'login' ? 'Sign in to access premium features' : 'Create your account'}
              </Text>
            </LinearGradient>
          </FadeInView>

          <FadeInView delay={100}>
            <AppCard style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <View style={[styles.authToggle, { backgroundColor: colors.surfaceVariant }]}>
                <ScaleTouchableOpacity onPress={() => setAuthMode('login')} style={[styles.toggleBtn, authMode === 'login' && { backgroundColor: colors.surface }]}>
                  <Text style={[styles.toggleText, { color: authMode === 'login' ? colors.primary : colors.textSecondary }]}>Sign In</Text>
                </ScaleTouchableOpacity>
                <ScaleTouchableOpacity onPress={() => setAuthMode('signup')} style={[styles.toggleBtn, authMode === 'signup' && { backgroundColor: colors.surface }]}>
                  <Text style={[styles.toggleText, { color: authMode === 'signup' ? colors.primary : colors.textSecondary }]}>Sign Up</Text>
                </ScaleTouchableOpacity>
              </View>

              {displayError && (
                <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
                  <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
                </View>
              )}

              {authMode === 'signup' && (
                <AppTextField label="Display Name" placeholder="Your name" leftIcon="account-outline" value={displayName} onChangeText={setDisplayName} />
              )}

              <AppTextField label="Email" placeholder="you@example.com" leftIcon="email-outline" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              <AppTextField label="Password" placeholder="Enter your password" leftIcon="lock-outline" isPassword value={password} onChangeText={setPassword} />

              <AppButton title={authMode === 'login' ? 'Sign In' : 'Create Account'} onPress={handleEmailAuth} loading={loading} fullWidth />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textTertiary }]}>or continue with</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <ScaleTouchableOpacity onPress={handleGoogleLogin} style={[styles.googleBtn, { borderColor: colors.border }]}>
                <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                <Text style={[styles.googleText, { color: colors.textPrimary }]}>Google</Text>
              </ScaleTouchableOpacity>
            </AppCard>
          </FadeInView>

          <FadeInView delay={200}>
            <ScaleTouchableOpacity onPress={() => router.replace('/(tabs)/upload')} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: colors.textSecondary }]}>Continue as Guest</Text>
            </ScaleTouchableOpacity>
          </FadeInView>

          <Text style={[styles.footer, { color: colors.textTertiary }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>

          <LoadingOverlay visible={loading || isLoading} message="Signing in..." />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerGradient: { borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 24 },
  iconContainer: { width: 72, height: 72, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 34 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8 },
  card: { padding: 24 },
  authToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleText: { fontSize: 14, fontWeight: '700' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  errorText: { fontSize: 13, marginLeft: 8, flex: 1 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, marginHorizontal: 12 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, gap: 8 },
  googleText: { fontSize: 14, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 16 },
  skipText: { fontSize: 15, fontWeight: '600' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 16 },
});
