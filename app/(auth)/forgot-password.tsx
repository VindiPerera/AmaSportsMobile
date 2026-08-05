import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AuthHeader } from '../../src/components/ui/AuthHeader';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { isValidEmail } from '../../src/utils/validation';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleSubmit = async () => {
    clearError();
    setSuccessMessage(null);

    if (!email.trim()) {
      setFieldError('Email is required');
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError('Enter a valid email address');
      return;
    }
    setFieldError(undefined);

    try {
      const message = await forgotPassword({ email: email.trim() });
      setSuccessMessage(message);
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
          title="Forgot password?"
          subtitle="Enter the email linked to your account and we'll send you a reset link."
          showBack
        />

        <ErrorBanner message={error} />

        {successMessage ? (
          <Text style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} /> {successMessage}
          </Text>
        ) : null}

        <TextField
          label="Email"
          placeholder="you@example.com"
          leftIcon="mail-outline"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={fieldError}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <Button
          label="Send Reset Link"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.button}
        />

        <Text style={styles.backToLogin} onPress={() => router.replace('/(auth)/login')} suppressHighlighting>
          Back to Log In
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  successBanner: {
    ...typography.caption,
    color: colors.success,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  button: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  backToLogin: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
});
