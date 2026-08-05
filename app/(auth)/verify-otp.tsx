import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { AuthHeader } from '../../src/components/ui/AuthHeader';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { Button } from '../../src/components/ui/Button';
import { ErrorBanner } from '../../src/components/ui/ErrorBanner';
import { colors, spacing, typography } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const resendOtp = useAuthStore((s) => s.resendOtp);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    clearError();
    if (otp.length !== 6 || !email) return;

    try {
      await verifyOtp({ email, otp });
      router.replace('/(protected)/(tabs)/home');
    } catch {
      // Error surfaced via store `error` state.
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    clearError();
    setResendMessage(null);
    try {
      const message = await resendOtp(email);
      setResendMessage(message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Error surfaced via store `error` state.
    }
  };

  return (
    <ScreenContainer>
      <AuthHeader
        title="Verify your email"
        subtitle={`Enter the 6-digit code we sent to ${email ?? 'your email'}.`}
        showBack
      />

      <ErrorBanner message={error} />
      {resendMessage ? <Text style={styles.resendMessage}>{resendMessage}</Text> : null}

      <OtpInput value={otp} onChange={setOtp} />

      <Button
        label="Verify"
        onPress={handleVerify}
        loading={isLoading}
        disabled={otp.length !== 6}
        style={styles.button}
      />

      <View style={styles.resendRow}>
        <Text style={styles.footerText}>Didn&apos;t get the code? </Text>
        <Text
          style={[styles.resendLink, cooldown > 0 && styles.resendLinkDisabled]}
          onPress={handleResend}
          suppressHighlighting
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  button: {
    marginBottom: spacing.lg,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    ...typography.bodyMuted,
  },
  resendLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
  resendLinkDisabled: {
    color: colors.textMuted,
  },
  resendMessage: {
    ...typography.caption,
    color: colors.success,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
});
