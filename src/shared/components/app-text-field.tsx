import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../hooks/use-theme';

interface AppTextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  leftIcon?: string;
  isPassword?: boolean;
}

export function AppTextField({ label, error, leftIcon, isPassword, style, ...props }: AppTextFieldProps) {
  const { colors } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        { borderColor: isFocused ? colors.primary : error ? colors.error : colors.border, backgroundColor: colors.inputBg || colors.surface },
      ]}>
        {leftIcon && (
          <MaterialCommunityIcons name={leftIcon as any} size={20} color={isFocused ? colors.primary : colors.textTertiary} style={styles.leftIcon} />
        )}
        <TextInput
          style={[styles.input, { color: colors.textPrimary }, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
            <MaterialCommunityIcons name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, minHeight: 50 },
  leftIcon: { marginLeft: 14 },
  input: { flex: 1, fontSize: 15, paddingHorizontal: 12, paddingVertical: 14 },
  eyeIcon: { padding: 12 },
  errorText: { fontSize: 12, marginTop: 4 },
});
