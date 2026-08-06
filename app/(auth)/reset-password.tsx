import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AuthHeader } from '../../src/components/ui/AuthHeader';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { colors, radius, spacing } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { isValidPassword } from '../../src/utils/validation';

/**
 * Reached via deep link (amasports://reset-password?email=...&token=...)
 * from the password-reset email, or manually if the user pastes the token.
 */
export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; token?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [token, setToken] = useState(params.token ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    token?: string;
    password?: string;
    password_confirmation?: string;
  }>({});

  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async () => {
    clearError();
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = 'Email is required';
    if (!token.trim()) errors.token = 'Reset code is required';
    if (!password) errors.password = 'Password is required';
    else if (!isValidPassword(password)) errors.password = 'Password must be at least 8 characters';
    if (passwordConfirmation !== password) errors.password_confirmation = 'Passwords do not match';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await resetPassword({
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      router.replace('/(auth)/login');
    } catch {
      // Error surfaced via store `error` state.
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AuthHeader
          title="Reset password"
          subtitle="Enter the code we emailed you along with your new password."
          showBack
        />

        <View style={styles.iconBadge}>
          <Ionicons name="lock-open-outline" size={30} color={colors.primary} />
        </View>

        <ErrorBanner message={error} />

        <TextField
          label="Email"
          placeholder="you@example.com"
          leftIcon="mail-outline"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          editable={!params.email}
        />

        <TextField
          label="Reset Code"
          placeholder="Enter the code from your email"
          leftIcon="key-outline"
          value={token}
          onChangeText={setToken}
          error={fieldErrors.token}
        />

        <TextField
          label="New Password"
          placeholder="At least 8 characters"
          leftIcon="lock-closed-outline"
          secureTextEntry
          secureToggle
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
        />

        <TextField
          label="Confirm New Password"
          placeholder="Re-enter your new password"
          leftIcon="lock-closed-outline"
          secureTextEntry
          secureToggle
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          error={fieldErrors.password_confirmation}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <Button
          label="Reset Password"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.button}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  button: {
    marginTop: spacing.sm,
  },
});
