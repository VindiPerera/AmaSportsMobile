import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthHero } from '../../src/components/ui/AuthHero';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { colors, radius, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { validateRegisterForm, RegisterFormErrors } from '../../src/utils/validation';

/** Simple length/variety heuristic — visual guidance only, not a hard gate. */
function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return score as 0 | 1 | 2 | 3;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegisterFormErrors>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const strength = passwordStrength(password);

  const handleRegister = async () => {
    clearError();
    const errors = validateRegisterForm(name, email, password, passwordConfirmation);
    setFieldErrors(errors);
    if (!agreedToTerms) {
      setShowTermsError(true);
    }
    if (Object.keys(errors).length > 0 || !agreedToTerms) return;

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });
      // A brand-new player has no sport profile yet — land them straight on
      // Player Profile instead of Home so they set one up right away.
      router.replace('/(protected)/(tabs)/player-profile');
    } catch {
      // Error surfaced via store `error` state.
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AuthHero
          title={'Join the\nGame'}
          subtitle="Create your account and track every score, live."
          showBack
          tag="New here?"
        />

        <View style={styles.sheet}>
          <ErrorBanner message={error} />

          <TextField
            label="Full name"
            placeholder="Jordan Lee"
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
            label="Phone number (optional)"
            placeholder="07X XXX XXXX"
            leftIcon="call-outline"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
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

          <View style={styles.strengthRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.strengthBar, i < strength && styles.strengthBarFilled]} />
            ))}
          </View>

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

          <Pressable
            onPress={() => {
              setAgreedToTerms((prev) => !prev);
              setShowTermsError(false);
            }}
            style={styles.termsRow}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms ? <Ionicons name="checkmark" size={12} color={colors.navy} /> : null}
            </View>
            <Text style={styles.termsText}>I agree to the Terms of Service and Privacy Policy.</Text>
          </Pressable>
          {showTermsError ? (
            <Text style={styles.termsErrorText}>Please agree to the terms to continue.</Text>
          ) : null}

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
  strengthRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: 2,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  strengthBarFilled: {
    backgroundColor: colors.energy,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.navy,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.energy,
    borderColor: colors.energy,
  },
  termsText: {
    ...typography.caption,
    flex: 1,
    color: colors.textMuted,
    lineHeight: 18,
  },
  termsErrorText: {
    ...typography.caption,
    color: colors.live,
    fontWeight: '600',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  registerButton: {
    marginBottom: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.md,
  },
  footerText: {
    ...typography.bodyMuted,
  },
  footerLink: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
});
