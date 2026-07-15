import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../hooks/use-theme';
import { SUBSCRIPTION_CONFIGS, SubscriptionTier } from '../../core/enums/subscription-tier';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALL_FEATURES = [
  { key: 'files', label: 'Monthly Files', values: { free: '10', starter: '50', pro: '500', business: '2,000' } },
  { key: 'credits', label: 'Monthly Credits', values: { free: '25', starter: '100', pro: '1,000', business: '5,000' } },
  { key: 'extraction', label: 'All Extraction Modes', values: { free: true, starter: true, pro: true, business: true } },
  { key: 'handwriting', label: 'Handwriting Recognition', values: { free: true, starter: true, pro: true, business: true } },
  { key: 'export_csv', label: 'Export CSV', values: { free: true, starter: true, pro: true, business: true } },
  { key: 'export_excel', label: 'Export Excel', values: { free: false, starter: true, pro: true, business: true } },
  { key: 'priority_support', label: 'Priority Support', values: { free: false, starter: true, pro: true, business: true } },
  { key: 'api_access', label: 'API Access', values: { free: false, starter: false, pro: true, business: true } },
  { key: 'custom_modes', label: 'Custom Extraction Modes', values: { free: false, starter: false, pro: true, business: true } },
  { key: 'team', label: 'Team Collaboration', values: { free: false, starter: false, pro: false, business: true } },
  { key: 'integrations', label: 'Custom Integrations', values: { free: false, starter: false, pro: false, business: true } },
];

interface SubscriptionPlansModalProps {
  visible: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  visible,
  onClose,
  currentTier,
}) => {
  const { colors } = useThemeStore();
  const tiers = [
    SubscriptionTier.FREE,
    SubscriptionTier.STARTER,
    SubscriptionTier.PRO,
    SubscriptionTier.BUSINESS,
  ];
  const tierLabels = { free: 'Free', starter: 'Starter', pro: 'Pro', business: 'Business' };
  const tierColors: Record<string, string> = {
    free: '#6B7280',
    starter: '#3B82F6',
    pro: '#8B5CF6',
    business: '#F59E0B',
  };
  const colWidth = (SCREEN_WIDTH - 130) / 4;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Subscription Plans</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableContainer}>
              <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.featureCol, { width: 120 }]}>
                  <Text style={[styles.headerCellText, { color: colors.textPrimary }]}>Feature</Text>
                </View>
                {tiers.map((tier) => {
                  const config = SUBSCRIPTION_CONFIGS[tier];
                  const isActive = tier === currentTier;
                  return (
                    <View key={tier} style={[styles.planCol, { width: colWidth, backgroundColor: isActive ? colors.primaryLight : 'transparent' }]}>
                      <View style={[styles.planBadge, { backgroundColor: tierColors[tier] }]}>
                        <Text style={styles.planBadgeText}>{config.label}</Text>
                      </View>
                      <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                        {config.price === 0 ? 'Free' : `$${config.price}`}
                      </Text>
                      {config.price > 0 && <Text style={[styles.priceSub, { color: colors.textTertiary }]}>/month</Text>}
                      {isActive && (
                        <View style={[styles.currentTag, { backgroundColor: colors.primary }]}>
                          <Text style={styles.currentTagText}>Current</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {ALL_FEATURES.map((feature, idx) => (
                <View key={feature.key} style={[styles.dataRow, { borderBottomColor: colors.borderLight, backgroundColor: idx % 2 === 0 ? 'transparent' : colors.surfaceVariant }]}>
                  <View style={[styles.featureCol, { width: 120 }]}>
                    <Text style={[styles.featureText, { color: colors.textPrimary }]} numberOfLines={1}>{feature.label}</Text>
                  </View>
                  {tiers.map((tier) => {
                    const val = feature.values[tier];
                    return (
                      <View key={tier} style={[styles.planCol, { width: colWidth }]}>
                        {typeof val === 'boolean' ? (
                          val ? (
                            <View style={[styles.tickCircle, { backgroundColor: '#10B981' }]}>
                              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                            </View>
                          ) : (
                            <View style={[styles.tickCircle, { backgroundColor: colors.borderLight }]}>
                              <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
                            </View>
                          )
                        ) : (
                          <Text style={[styles.valueText, { color: colors.textPrimary }]}>{val}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: SCREEN_WIDTH - 24,
    maxHeight: '80%',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 4 },
  tableContainer: { minWidth: 500 },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingBottom: 12,
    marginBottom: 4,
  },
  featureCol: { justifyContent: 'center' },
  planCol: { alignItems: 'center', paddingVertical: 4 },
  headerCellText: { fontSize: 13, fontWeight: '800' },
  planBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  planBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  priceText: { fontSize: 16, fontWeight: '800' },
  priceSub: { fontSize: 10, marginTop: 1 },
  currentTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  currentTagText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  featureText: { fontSize: 12, fontWeight: '600' },
  tickCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  closeButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
