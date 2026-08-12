import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthHero } from '../../src/components/ui/AuthHero';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { colors, radius, spacing, typography } from '../../src/theme';
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
    <View style={styles.root}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <AuthHero title={'Welcome\nBack'} subtitle="Log in to catch today's live scores." />

          <View style={styles.sheet}>
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

            <Button label="Log In" onPress={handleLogin} loading={isLoading} style={styles.loginButton} />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to AmaX?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button label="Create an Account" variant="outline" onPress={() => router.push('/(auth)/register')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SafeAreaView edges={['bottom']} style={styles.safeBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  flex: {
    flex: 1,
  },
  safeBottom: {
    backgroundColor: colors.card,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    marginTop: -24,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  forgotLink: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.xl,
    textDecorationLine: 'underline',
    textDecorationColor: colors.energy,
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
