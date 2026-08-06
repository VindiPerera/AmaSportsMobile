import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { colors, radius, spacing, typography } from '../../../src/theme';

/** Placeholder for the 20 sports that don't have a full form yet (spec §6.1). */
export default function ComingSoonSportScreen() {
  const { sport } = useLocalSearchParams<{ sport?: string }>();

  return (
    <ScreenContainer edges={['bottom']}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="construct-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>{sport ?? 'This sport'} is coming soon</Text>
        <Text style={styles.text}>
          We&apos;re still building the {sport ?? 'sport'} profile form. Your sport has been
          saved — come back once it&apos;s ready to fill in your details.
        </Text>
        <Button
          label="Back to My Sports"
          variant="outline"
          onPress={() => router.replace('/(protected)/(tabs)/player-profile')}
          style={styles.button}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing['3xl'],
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  text: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 200,
  },
});
