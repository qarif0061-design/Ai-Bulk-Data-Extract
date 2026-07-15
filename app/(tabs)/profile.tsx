import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppCard } from '../../src/shared/components/app-card';
import { AppButton } from '../../src/shared/components/app-button';
import { FadeInView, ScaleTouchableOpacity } from '../../src/shared/components/animated';
import { useAuthStore } from '../../src/shared/hooks/use-auth';
import { useSubscriptionStore } from '../../src/features/subscription/subscription-store';
import { useThemeStore } from '../../src/shared/hooks/use-theme';
import { useApiKeyStore } from '../../src/shared/hooks/use-api-key';
import { SubscriptionPlansModal } from '../../src/shared/components/subscription-plans-modal';
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
  const { config, creditsRemaining, creditsUsed, loadSubscription, getUsagePercent, getCreditsPercent } = useSubscriptionStore();
  const { apiKey, setApiKey, loadApiKey } = useApiKeyStore();
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showPlansModal, setShowPlansModal] = useState(false);

  useEffect(() => { loadSubscription(); loadApiKey(); }, []);
  useEffect(() => {
    if (userModel) setDisplayName(userModel.displayName || '');
  }, [userModel]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const tiers = Object.values(SUBSCRIPTION_CONFIGS);

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
              <Text style={styles.guestSub}>Sign in to unlock all features</Text>
            </LinearGradient>
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
            <AppCard style={[styles.signInCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons name="key-variant" size={32} color={colors.primary} />
              <Text style={[styles.signInTitle, { color: colors.textPrimary }]}>API Key Required</Text>
              <Text style={[styles.signInSub, { color: colors.textSecondary }]}>
                Add your OpenRouter API key to enable AI extraction. Get a free key at openrouter.ai
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder="sk-or-v1-..."
                placeholderTextColor={colors.textTertiary}
                value={tempApiKey || apiKey}
                onChangeText={setTempApiKey}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.apiKeyRow}>
                <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                  <Text style={[styles.apiKeyToggle, { color: colors.primary }]}>{showApiKey ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
                <AppButton
                  title="Save"
                  size="small"
                  onPress={async () => { await setApiKey(tempApiKey); Alert.alert('Saved', 'API key saved securely.'); }}
                  disabled={!tempApiKey.trim()}
                />
              </View>
            </AppCard>
          </FadeInView>

          <FadeInView delay={200}>
            <AppCard style={[styles.signInCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons name="login" size={32} color={colors.primary} />
              <Text style={[styles.signInTitle, { color: colors.textPrimary }]}>Sign In Required</Text>
              <Text style={[styles.signInSub, { color: colors.textSecondary }]}>
                Create an account to track extractions, manage credits, and more.
              </Text>
              <AppButton title="Sign In" onPress={() => router.push('/(auth)/login')} fullWidth style={{ marginTop: 12 }} />
            </AppCard>
          </FadeInView>

          <FadeInView delay={250}>
            <ScaleTouchableOpacity onPress={() => setShowPlansModal(true)} style={[styles.plansButton, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="crown" size={22} color="#FFFFFF" />
              <Text style={styles.plansButtonText}>View Subscription Plans</Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
            </ScaleTouchableOpacity>
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
            <SettingRow icon="bell-outline" label="Notifications" value={notificationsEnabled ? 'On' : 'Off'} colors={colors}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)} />
            <SettingRow icon="translate" label="Language" value="English" colors={colors}
              onPress={() => Alert.alert('Language', 'Language settings coming soon')} />
            <View style={{ marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 8 }]}>OpenRouter API Key</Text>
              <TextInput
                style={[styles.apiKeyInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder="sk-or-v1-..."
                placeholderTextColor={colors.textTertiary}
                value={tempApiKey || apiKey}
                onChangeText={setTempApiKey}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.apiKeyRow}>
                <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                  <Text style={[styles.apiKeyToggle, { color: colors.primary }]}>{showApiKey ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
                <AppButton
                  title="Save"
                  size="small"
                  onPress={async () => { await setApiKey(tempApiKey); Alert.alert('Saved', 'API key saved securely.'); }}
                  disabled={!tempApiKey.trim()}
                />
              </View>
            </View>
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
              onPress={() => Alert.alert('AI Bulk Data Extractor', 'Version 1.0.0\nBuilt with Expo + React Native')} />
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
  card: { padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  sectionLabel: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  planCard: { padding: 16, marginBottom: 10 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  planName: { fontSize: 16, fontWeight: '700' },
  planPrice: { fontSize: 14, marginTop: 2 },
  currentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  currentBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  planFeatures: { gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: 13 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 1.5, borderRadius: 14, gap: 8, marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: '700' },
  apiKeyInput: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'monospace', marginTop: 8 },
  apiKeyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  apiKeyToggle: { fontSize: 13, fontWeight: '600' },
  plansButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 10, marginBottom: 12 },
  plansButtonText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
