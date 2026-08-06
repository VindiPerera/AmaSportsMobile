import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AuthHeader } from '../../src/components/ui/AuthHeader';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { Logo } from '../../src/components/ui/Logo';
import { colors, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { validateLoginForm, LoginFormErrors } from '../../src/utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleLogin = async () => {
    clearError();
    const errors = validateLoginForm(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await login({ email: email.trim(), password });
      router.replace('/(protected)/(tabs)/home');
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
        <View style={styles.logoRow}>
          <Logo size={56} />
        </View>

        <AuthHeader title="Welcome back" subtitle="Log in to continue your training." />

        <ErrorBanner message={error} />

        <TextField
          label="Email"
          placeholder="you@example.com"
          leftIcon="mail-outline"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          returnKeyType="next"
        />

        <TextField
          label="Password"
          placeholder="Enter your password"
          leftIcon="lock-closed-outline"
          secureTextEntry
          secureToggle
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <Link href="/(auth)/forgot-password" asChild>
          <Text style={styles.forgotLink} suppressHighlighting>
            Forgot password?
          </Text>
        </Link>

        <Button
          label="Log In"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.loginButton}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>New to AmaSports?</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="Create an Account"
          variant="outline"
          onPress={() => router.push('/(auth)/register')}
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
  logoRow: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  forgotLink: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.xl,
  },
  loginButton: {
    marginBottom: spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
