import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../hooks/use-theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AppButton({
  title, onPress, variant = 'primary', size = 'medium', disabled = false, loading = false, icon, fullWidth = false, style,
}: AppButtonProps) {
  const { colors } = useThemeStore();
  const scale = useSharedValue(1);
  const isDisabled = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return { bg: colors.primary, text: '#FFFFFF' };
      case 'secondary': return { bg: colors.primaryLight, text: colors.primary };
      case 'outline': return { bg: 'transparent', text: colors.textPrimary, border: colors.border };
      case 'text': return { bg: 'transparent', text: colors.primary };
      case 'danger': return { bg: colors.error, text: '#FFFFFF' };
    }
  };

  const vs = getVariantStyles();

  return (
    <AnimatedTouchable
      style={[styles.base, { backgroundColor: vs.bg, borderRadius: 14 }, vs.border ? { borderWidth: 1.5, borderColor: vs.border } : {}, styles[`size_${size}`], fullWidth && styles.fullWidth, isDisabled && styles.disabled, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: vs.text }, styles[`textSize_${size}`], icon ? styles.textWithIcon : null]}>{title}</Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  size_small: { paddingVertical: 10, paddingHorizontal: 18, minHeight: 40 },
  size_medium: { paddingVertical: 14, paddingHorizontal: 28, minHeight: 50 },
  size_large: { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 },
  disabled: { opacity: 0.5 },
  text: { fontWeight: '700' },
  textSize_small: { fontSize: 14 },
  textSize_medium: { fontSize: 15 },
  textSize_large: { fontSize: 17 },
  textWithIcon: { marginLeft: 8 },
});
