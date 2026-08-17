import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../ui/ScreenContainer';
import { ErrorBanner } from '../ui/ErrorBanner';
import { colors, radius, shadows, spacing, typography } from '../../theme';

interface SportProfileLayoutProps {
  sportName: string;
  sportIcon?: keyof typeof Ionicons.glyphMap;
  fullName: string;
  error?: string | null;
  onBack: () => void;
  children: React.ReactNode;
}

export function SportProfileLayout({
  sportName,
  sportIcon = 'body',
  fullName,
  error,
  onBack,
  children,
}: SportProfileLayoutProps) {
  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      {/* Hero Navigation Banner */}
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, shadows.md]}
      >
        <View style={styles.topRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
          <View style={styles.sportBadge}>
            <Ionicons name={sportIcon} size={14} color={colors.energy} />
            <Text style={styles.sportBadgeText}>{sportName.toUpperCase()} PROFILE</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>{fullName || `${sportName} Athlete`}</Text>
        <Text style={styles.headerSubtitle}>
          Edit career statistics, physical stats, and match history.
        </Text>
      </LinearGradient>

      <ErrorBanner message={error} />

      <View style={styles.content}>
        {children}
      </View>
    </ScreenContainer>
  );
}

export const sportStyles = StyleSheet.create({
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coverBlock: {
    position: 'relative',
    marginBottom: 50,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: -40,
    right: spacing.md,
    zIndex: 10,
  },
});

const styles = StyleSheet.create({
  heroHeader: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    gap: 6,
  },
  sportBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '800',
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    paddingBottom: spacing['4xl'],
  },
});
