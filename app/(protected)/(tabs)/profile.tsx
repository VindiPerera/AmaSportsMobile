import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    // Alert.alert has no UI on web — it silently does nothing there, so
    // logout would appear completely dead in a browser. Fall back to the
    // browser's native confirm() on that platform instead.
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        performLogout();
      }
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </LinearGradient>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="ribbon-outline" size={13} color={colors.primary} />
          <Text style={styles.roleBadgeText}>{user?.role ?? '—'}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.infoCard}>
        <InfoRow icon="person-outline" label="Full Name" value={user?.name ?? '—'} />
        <View style={styles.rowDivider} />
        <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} />
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
      </View>
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
    marginBottom: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  roleBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sectionLabel: {
    ...typography.overline,
    marginBottom: spacing.md,
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
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textFaint,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutButton: {
    marginTop: 'auto',
    marginBottom: spacing.lg,
  },
});
