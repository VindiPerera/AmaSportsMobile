import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type Variant = 'primary' | 'energy' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const GRADIENT_VARIANTS: Partial<Record<Variant, readonly [string, string]>> = {
  primary: colors.gradientPrimary,
  energy: colors.gradientEnergy,
};

/** Primary CTA button used across auth + onboarding flows. */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const gradient = GRADIENT_VARIANTS[variant];

  const inner = loading ? (
    <ActivityIndicator color={gradient ? colors.white : colors.primary} />
  ) : (
    <Text style={[typography.button, textVariantStyles[variant]]}>{label}</Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      {...pressableProps}
    >
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, shadows.sm, style]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View style={[styles.base, variantStyles[variant], style]}>{inner}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  energy: { backgroundColor: colors.energy },
  secondary: { backgroundColor: colors.navy },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: colors.transparent },
};

const textVariantStyles: Record<Variant, { color: string }> = {
  primary: { color: colors.white },
  energy: { color: colors.white },
  secondary: { color: colors.white },
  outline: { color: colors.text },
  ghost: { color: colors.primary },
};
