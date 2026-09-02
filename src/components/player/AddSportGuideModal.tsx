import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, spacing, typography } from '../../theme';

interface GuideStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const STEPS: GuideStep[] = [
  {
    icon: 'person-outline',
    title: 'Fill in your overview first',
    body: 'Photo, playing style, height and the other basic fields at the top of the form.',
  },
  {
    icon: 'time-outline',
    title: 'Add your Recent Match first',
    body: 'Start with Recent Matches before moving on to Batting and Bowling Career Stats.',
  },
  {
    icon: 'add-circle-outline',
    title: 'Add one record at a time',
    body: 'Tap "+ Add New Stat" or "+ Add New Match" and fill in just that one match or entry — you can only add one record per save.',
  },
  {
    icon: 'git-merge-outline',
    title: 'Update an existing entry, or create a new one',
    body: 'Already have an entry for that exact Category + Division? Choose "Update an Existing Entry" and it adds to what you already have. Only choose "Add a New Entry" for a Category + Division you haven’t used before.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'One new entry per save',
    body: 'Once you add a stat or a match, that "Add" button locks until you save the profile — save, then add the next one.',
  },
  {
    icon: 'save-outline',
    title: 'Nothing is saved until you tap Save',
    body: 'Everything you fill in stays local to the form until you press the "Save ... Profile" button at the bottom.',
  },
];

interface AddSportGuideModalProps {
  visible: boolean;
  sportName: string;
  onCancel: () => void;
  onContinue: () => void;
}

/**
 * Shown every time a player picks a sport to add (see sport-picker.tsx) —
 * a quick refresher on how this app's "add one record at a time, save,
 * repeat" registration flow works, since it's the same pattern across every
 * sport's form but isn't otherwise explained anywhere in the UI.
 */
export function AddSportGuideModal({ visible, sportName, onCancel, onContinue }: AddSportGuideModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, shadows.md]}>
          <LinearGradient
            colors={colors.gradientHero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Pressable onPress={onCancel} style={styles.closeButton} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={colors.white} />
            </Pressable>
            <View style={styles.headerIconWrap}>
              <Ionicons name="information-circle" size={26} color={colors.energy} />
            </View>
            <Text style={styles.headerTitle}>Before you start</Text>
            <Text style={styles.headerSubtitle}>How to fill in your {sportName} profile correctly</Text>
          </LinearGradient>

          <ScrollView style={styles.stepsScroll} showsVerticalScrollIndicator={false}>
            {STEPS.map((step, index) => (
              <View key={step.title} style={styles.stepRow}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={step.icon} size={17} color={colors.primary} />
                </View>
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>{index + 1}. {step.title}</Text>
                  <Text style={styles.stepBody}>{step.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable onPress={onContinue} style={styles.continueButton} accessibilityRole="button">
            <Text style={styles.continueButtonText}>Got it, let&rsquo;s start</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 25, 44, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '86%',
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  stepsScroll: {
    paddingHorizontal: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  stepIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  stepBody: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 17,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 50,
    margin: spacing.lg,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  continueButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});
