import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

/** Labeled text input with error state and optional password visibility toggle. */
export function TextField({
  label,
  error,
  secureToggle = false,
  leftIcon,
  secureTextEntry,
  style,
  ...inputProps
}: TextFieldProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  let iconColor: string = colors.textFaint;
  if (error) iconColor = colors.live;
  else if (isFocused) iconColor = colors.primary;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={20} color={iconColor} style={styles.leftIcon} />
        ) : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          {...inputProps}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setIsSecure((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textFaint}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.live} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  inputWrapperError: {
    borderColor: colors.live,
    backgroundColor: colors.background,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    height: '100%',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.live,
    fontWeight: '500',
  },
});
