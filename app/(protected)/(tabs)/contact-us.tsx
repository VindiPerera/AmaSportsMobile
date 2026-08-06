import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { TextField } from '../../../src/components/ui/TextField';
import { Button } from '../../../src/components/ui/Button';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { contactService } from '../../../src/services/contactService';
import { isValidEmail } from '../../../src/utils/validation';

// TODO: swap in real contact details once provided.
const CONTACT_INFO = [
  { icon: 'mail-outline' as const, label: 'Email', value: 'support@amax.app' },
  { icon: 'call-outline' as const, label: 'Phone', value: '+94 00 000 0000' },
  { icon: 'location-outline' as const, label: 'Address', value: 'Colombo, Sri Lanka' },
];

export default function ContactUsScreen() {
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required';
    if (!email.trim()) nextErrors.email = 'Email is required';
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address';
    if (!message.trim()) nextErrors.message = 'Message is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const responseMessage = await contactService.submit({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setSuccessMessage(responseMessage);
      setMessage('');
    } catch {
      setError('Could not send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Contact Us</Text>

        <View style={styles.infoCard}>
          {CONTACT_INFO.map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name={item.icon} size={16} color={colors.textMuted} />
              </View>
              <View>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Send us a message</Text>

        {successMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}
        <ErrorBanner message={error} />

        <TextField label="Name" value={name} onChangeText={setName} error={errors.name} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
        />
        <TextField
          label="Message"
          value={message}
          onChangeText={setMessage}
          error={errors.message}
          multiline
          numberOfLines={5}
        />

        <Button label="Submit" onPress={handleSubmit} loading={isSubmitting} style={styles.submitButton} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  infoIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textFaint,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
  },
  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.successBorder,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
