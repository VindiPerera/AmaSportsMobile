import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="person-outline" label="Role" value={user?.role ?? '—'} capitalize />
        <InfoRow
          icon="checkmark-circle-outline"
          label="Email verified"
          value={user?.email_verified_at ? 'Yes' : 'No'}
        />
      </View>

      <Button
        label="Log Out"
        variant="outline"
        onPress={handleLogout}
        loading={isLoggingOut}
        style={styles.logoutButton}
      />
    </ScreenContainer>
  );
}

function InfoRow({
  icon,
  label,
  value,
  capitalize = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, capitalize && styles.capitalize]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    ...typography.h1,
    color: colors.white,
  },
  name: {
    ...typography.h2,
  },
  email: {
    ...typography.bodyMuted,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textMuted,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  logoutButton: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
});
