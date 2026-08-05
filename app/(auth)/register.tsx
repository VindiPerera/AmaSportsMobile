import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AuthHeader } from '../../src/components/ui/AuthHeader';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { RoleSelector } from '../../src/components/ui/RoleSelector';
import { colors, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { UserRole } from '../../src/types/auth';
import { validateRegisterForm, RegisterFormErrors } from '../../src/utils/validation';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});

  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const handleRegister = async () => {
    clearError();
    const errors = validateRegisterForm(name, email, password, passwordConfirmation);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const { requiresVerification } = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        role,
      });

      if (requiresVerification) {
        router.push({ pathname: '/(auth)/verify-otp', params: { email: email.trim() } });
      } else {
        router.replace('/(protected)/(tabs)/home');
      }
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
          title="Create your account"
          subtitle="Join AmaSports to track performance and connect with your team."
          showBack
        />

        <ErrorBanner message={error} />

        <RoleSelector value={role} onChange={setRole} />

        <TextField
          label="Full Name"
          placeholder="John Doe"
          leftIcon="person-outline"
          value={name}
          onChangeText={setName}
          error={fieldErrors.name}
          returnKeyType="next"
        />

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
          placeholder="At least 8 characters"
          leftIcon="lock-closed-outline"
          secureTextEntry
          secureToggle
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          returnKeyType="next"
        />

        <TextField
          label="Confirm Password"
          placeholder="Re-enter your password"
          leftIcon="lock-closed-outline"
          secureTextEntry
          secureToggle
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          error={fieldErrors.password_confirmation}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        <Button
          label="Create Account"
          onPress={handleRegister}
          loading={isLoading}
          style={styles.registerButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Text style={styles.footerLink} suppressHighlighting>
              Log in
            </Text>
          </Link>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  registerButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  footerText: {
    ...typography.bodyMuted,
  },
  footerLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});
