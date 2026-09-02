import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { StatCell, StatColumn } from './StatTable';

interface SimpleStatAddModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (row: Record<string, unknown>) => void;
  emptyRow: Record<string, unknown>;
  columns: StatColumn[];
  /** When set, the form opens pre-filled with this row's values instead of
   * `emptyRow` — used to edit an existing entry (see RecentMatchTable) in
   * place of adding a new one. */
  initialRow?: Record<string, unknown>;
  /** Label for the save button — defaults to "Save Entry"; RecentMatchTable
   * passes "Save Changes" while editing. */
  saveLabel?: string;
}

/**
 * A single blank-form "Add New X" modal — no Category/Division picker, no
 * merge-into-existing step, just the fields themselves. Used for Recent
 * Matches: each match is its own standalone row (unlike Batting/Bowling
 * Career Stats, there's no combining key to merge duplicates into), so
 * every "Add" always appends a fresh entry. Doubles as the "edit" form for
 * an existing match via `initialRow` — same fields, just pre-filled and
 * saved back in place instead of appended.
 *
 * Only mounted while `visible`, so every re-open starts the form blank (or
 * pre-filled from `initialRow`) via useState's initializer — no
 * reset-on-open effect, and no risk of a previous match's values leaking
 * into the next one.
 */
export function SimpleStatAddModal(props: SimpleStatAddModalProps) {
  const { visible, onClose } = props;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? <SimpleStatAddModalBody {...props} /> : null}
    </Modal>
  );
}

function SimpleStatAddModalBody({
  title,
  onClose,
  onSave,
  emptyRow,
  columns,
  initialRow,
  saveLabel = 'Save Entry',
}: SimpleStatAddModalProps) {
  const [row, setRow] = useState<Record<string, unknown>>(() => ({ ...(initialRow ?? emptyRow) }));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
      >
        <Text style={styles.stepTitle}>Match Details</Text>

        <View style={styles.detailGrid}>
          {columns.map((column) => (
            <View key={column.key} style={styles.detailFieldWrapper}>
              <Text style={styles.detailFieldLabel}>{column.label}</Text>
              <StatCell
                column={column}
                value={row[column.key]}
                onChange={(value) => setRow((prev) => ({ ...prev, [column.key]: value }))}
              />
            </View>
          ))}
        </View>

        <Pressable onPress={() => onSave(row)} style={styles.nextButton} accessibilityRole="button">
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
          <Text style={styles.nextButtonText}>{saveLabel}</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  stepTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: spacing.md,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  detailFieldWrapper: {
    minWidth: 140,
    flexGrow: 1,
  },
  detailFieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
    marginBottom: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 50,
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  nextButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});
