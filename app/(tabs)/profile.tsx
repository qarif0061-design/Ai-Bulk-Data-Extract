import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppCard } from '../../src/shared/components/app-card';
import { AppButton } from '../../src/shared/components/app-button';
import { FadeInView, ScaleTouchableOpacity } from '../../src/shared/components/animated';
import { SubscriptionPlansModal } from '../../src/shared/components/subscription-plans-modal';
import { useAuthStore } from '../../src/shared/hooks/use-auth';
import { useSubscriptionStore } from '../../src/features/subscription/subscription-store';
import { useThemeStore } from '../../src/shared/hooks/use-theme';
import { useApiKeyStore } from '../../src/shared/hooks/use-api-key';
import { SUBSCRIPTION_CONFIGS, SubscriptionTier } from '../../src/core/enums/subscription-tier';

function SettingRow({ icon, label, value, onPress, colors, chevron = true }: { icon: string; label: string; value?: string; onPress?: () => void; colors: any; chevron?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress || (() => {})}>
      <View style={[settingStyles.row, { borderBottomColor: colors.borderLight }]}>
        <View style={[settingStyles.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
        </View>
        <Text style={[settingStyles.label, { color: colors.textPrimary }]}>{label}</Text>
        <View style={settingStyles.right}>
          {value && <Text style={[settingStyles.value, { color: colors.textTertiary }]}>{value}</Text>}
          {chevron && <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const settingStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  value: { fontSize: 13 },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, mode, toggleTheme } = useThemeStore();
  const { userModel, isAuthenticated, logout } = useAuthStore();
  const { config, creditsRemaining, creditsUsed, loadSubscription } = useSubscriptionStore();
  const { apiKey, saveApiKey, removeApiKey } = useApiKeyStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => { loadSubscription(); }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <FadeInView delay={0}>
            <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
              <View style={styles.guestAvatarLarge}>
                <MaterialCommunityIcons name="account-outline" size={40} color="rgba(255,255,255,0.7)" />
              </View>
              <Text style={styles.guestName}>Guest User</Text>
              <Text style={styles.guestSub}>Sign in to unlock credits and history</Text>
            </LinearGradient>
          </FadeInView>

          <FadeInView delay={50}>
            <AppCard style={[styles.infoCard, { backgroundColor: apiKey ? '#E8F5E9' : '#FFF3E0', borderColor: apiKey ? '#4CAF50' : '#FF9800' }]}>
              <MaterialCommunityIcons name={apiKey ? 'check-circle' : 'key-variant'} size={22} color={apiKey ? '#4CAF50' : '#FF9800'} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: apiKey ? '#2E7D32' : '#E65100' }}>
                  {apiKey ? 'Gemini API Connected' : 'Gemini API Key Required'}
                </Text>
                <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                  {apiKey ? 'AI extraction is ready to use.' : 'Add your Gemini API key to enable AI-powered extraction.'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setShowApiKeyInput(!showApiKeyInput); setApiKeyDraft(apiKey || ''); }}>
                <MaterialCommunityIcons name={showApiKeyInput ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
              </TouchableOpacity>
            </AppCard>
            {showApiKeyInput && (
              <AppCard style={{ backgroundColor: colors.surface, borderColor: colors.cardBorder, marginTop: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>Google Gemini API Key</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 12 }}>
                  <TextInput
                    style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.textPrimary }}
                    placeholder="Enter your Gemini API key"
                    placeholderTextColor={colors.textTertiary}
                    value={apiKeyDraft}
                    onChangeText={setApiKeyDraft}
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)} style={{ marginLeft: 8 }}>
                    <MaterialCommunityIcons name={showApiKey ? 'eye-off' : 'eye'} size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <AppButton
                    title="Save"
                    onPress={() => { saveApiKey(apiKeyDraft.trim()); setShowApiKeyInput(false); }}
                    disabled={!apiKeyDraft.trim()}
                    style={{ flex: 1 }}
                  />
                  {apiKey && (
                    <AppButton
                      title="Remove"
                      onPress={() => { removeApiKey(); setApiKeyDraft(''); setShowApiKeyInput(false); }}
                      variant="outline"
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
                <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 8, lineHeight: 16 }}>
                  Get a free API key from Google AI Studio: aistudio.google.com
                </Text>
              </AppCard>
            )}
          </FadeInView>

          <FadeInView delay={100}>
            <TouchableOpacity onPress={toggleTheme}>
              <View style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name={mode === 'dark' ? 'weather-night' : 'weather-sunny'} size={22} color={colors.primary} />
                <Text style={[styles.themeLabel, { color: colors.textPrimary }]}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                <Switch
                  value={mode === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={mode === 'dark' ? colors.primary : '#f4f3f4'}
                />
              </View>
            </TouchableOpacity>
          </FadeInView>

          <FadeInView delay={150}>
            <ScaleTouchableOpacity onPress={() => setShowPlansModal(true)} style={[styles.plansButton, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="crown" size={22} color="#FFFFFF" />
              <Text style={styles.plansButtonText}>View Subscription Plans</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
            </ScaleTouchableOpacity>
          </FadeInView>

          <FadeInView delay={200}>
            <AppCard style={[styles.signInCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons name="login" size={32} color={colors.primary} />
              <Text style={[styles.signInTitle, { color: colors.textPrimary }]}>Sign In for More</Text>
              <Text style={[styles.signInSub, { color: colors.textSecondary }]}>
                Create an account to track extractions, manage credits, and access history.
              </Text>
              <AppButton title="Sign In" onPress={() => router.push('/(auth)/login')} fullWidth style={{ marginTop: 12 }} />
            </AppCard>
          </FadeInView>
        </ScrollView>

        <SubscriptionPlansModal visible={showPlansModal} onClose={() => setShowPlansModal(false)} currentTier={SubscriptionTier.FREE} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <FadeInView delay={0}>
          <LinearGradient colors={colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarText}>{(userModel?.displayName || 'U')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userModel?.displayName || 'User'}</Text>
                <Text style={styles.profileEmail}>{userModel?.email || ''}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{creditsRemaining}</Text>
                <Text style={styles.statLabel}>Credits</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userModel?.totalFilesProcessed || 0}</Text>
                <Text style={styles.statLabel}>Files</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{config.label}</Text>
                <Text style={styles.statLabel}>Plan</Text>
              </View>
            </View>
          </LinearGradient>
        </FadeInView>

        <FadeInView delay={100}>
          <AppCard style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account</Text>
            <SettingRow icon="account-edit" label="Display Name" value={userModel?.displayName || 'Not set'} colors={colors} onPress={() => Alert.alert('Edit', 'Profile editing coming soon')} />
            <SettingRow icon="email-outline" label="Email" value={userModel?.email || 'Not set'} colors={colors} chevron={false} />
            <SettingRow icon="shield-lock" label="Password" value="••••••••" colors={colors} onPress={() => Alert.alert('Change Password', 'Password change coming soon')} />
          </AppCard>
        </FadeInView>

        <FadeInView delay={150}>
          <AppCard style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Preferences</Text>
            <TouchableOpacity onPress={toggleTheme}>
              <View style={[settingStyles.row, { borderBottomColor: colors.borderLight }]}>
                <View style={[settingStyles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                  <MaterialCommunityIcons name={mode === 'dark' ? 'weather-night' : 'weather-sunny'} size={18} color={colors.primary} />
                </View>
                <Text style={[settingStyles.label, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Switch
                  value={mode === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={mode === 'dark' ? colors.primary : '#f4f3f4'}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setShowApiKeyInput(!showApiKeyInput); setApiKeyDraft(apiKey || ''); }}>
              <View style={[settingStyles.row, { borderBottomColor: colors.borderLight }]}>
                <View style={[settingStyles.iconWrap, { backgroundColor: apiKey ? '#E8F5E9' : '#FFF3E0' }]}>
                  <MaterialCommunityIcons name={apiKey ? 'key-check' : 'key-variant'} size={18} color={apiKey ? '#4CAF50' : '#FF9800'} />
                </View>
                <Text style={[settingStyles.label, { color: colors.textPrimary }]}>Gemini API Key</Text>
                <View style={settingStyles.right}>
                  <Text style={[settingStyles.value, { color: apiKey ? '#4CAF50' : '#FF9800' }]}>{apiKey ? 'Connected' : 'Not set'}</Text>
                  <MaterialCommunityIcons name={showApiKeyInput ? 'chevron-up' : 'chevron-right'} size={20} color={colors.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
            {showApiKeyInput && (
              <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 12 }}>
                  <TextInput
                    style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.textPrimary }}
                    placeholder="Enter your Gemini API key"
                    placeholderTextColor={colors.textTertiary}
                    value={apiKeyDraft}
                    onChangeText={setApiKeyDraft}
                    secureTextEntry={!showApiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)} style={{ marginLeft: 8 }}>
                    <MaterialCommunityIcons name={showApiKey ? 'eye-off' : 'eye'} size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <AppButton
                    title="Save"
                    onPress={() => { saveApiKey(apiKeyDraft.trim()); setShowApiKeyInput(false); }}
                    disabled={!apiKeyDraft.trim()}
                    style={{ flex: 1 }}
                  />
                  {apiKey && (
                    <AppButton
                      title="Remove"
                      onPress={() => { removeApiKey(); setApiKeyDraft(''); setShowApiKeyInput(false); }}
                      variant="outline"
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
                <Text style={{ fontSize: 11, color: colors.textTertiary, marginTop: 6, lineHeight: 16 }}>
                  Get a free API key from Google AI Studio: aistudio.google.com
                </Text>
              </View>
            )}

            <SettingRow icon="bell-outline" label="Notifications" value={notificationsEnabled ? 'On' : 'Off'} colors={colors}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)} />
            <SettingRow icon="translate" label="Language" value="English" colors={colors}
              onPress={() => Alert.alert('Language', 'Language settings coming soon')} />
          </AppCard>
        </FadeInView>

        <FadeInView delay={200}>
          <AppCard style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Support & Legal</Text>
            <SettingRow icon="help-circle" label="Help Center" colors={colors}
              onPress={() => Linking.openURL('https://github.com/qarif0061-design/Ai-Bulk-Data-Extract')} />
            <SettingRow icon="message-text" label="Send Feedback" colors={colors}
              onPress={() => Linking.openURL('mailto:support@aibulkextractor.com')} />
            <SettingRow icon="file-document" label="Terms of Service" colors={colors}
              onPress={() => Linking.openURL('https://example.com/terms')} />
            <SettingRow icon="shield" label="Privacy Policy" colors={colors}
              onPress={() => Linking.openURL('https://example.com/privacy')} />
            <SettingRow icon="information" label="About" value="v1.0.0" colors={colors}
              onPress={() => Alert.alert('AI Bulk Data Extractor', 'Version 1.0.0\nPowered by Google Gemini\nBuilt with Expo + React Native')} />
          </AppCard>
        </FadeInView>

        <FadeInView delay={250}>
          <ScaleTouchableOpacity onPress={() => setShowPlansModal(true)} style={[styles.plansButton, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="crown" size={22} color="#FFFFFF" />
            <Text style={styles.plansButtonText}>View Subscription Plans</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
          </ScaleTouchableOpacity>
        </FadeInView>

        <FadeInView delay={300}>
          <TouchableOpacity onPress={handleLogout}>
            <View style={[styles.logoutButton, { borderColor: colors.error }]}>
              <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
              <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </FadeInView>

        <View style={{ height: 32 }} />
      </ScrollView>

      <SubscriptionPlansModal visible={showPlansModal} onClose={() => setShowPlansModal(false)} currentTier={config.tier} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  headerGradient: { borderRadius: 20, padding: 24, marginBottom: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarLarge: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  guestAvatarLarge: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  guestName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  guestSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
  themeToggle: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  themeLabel: { flex: 1, fontSize: 15, fontWeight: '600', marginLeft: 12 },
  signInCard: { alignItems: 'center', padding: 24, marginBottom: 16 },
  signInTitle: { fontSize: 18, fontWeight: '800', marginTop: 12 },
  signInSub: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 16 },
  card: { padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  plansButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 10, marginBottom: 12 },
  plansButtonText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 1.5, borderRadius: 14, gap: 8, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
