import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrayPath, Control, FieldValues, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Dropdown, DropdownOption } from './Dropdown';
import { StatCell, StatColumn } from './StatTable';

export type FieldMergeStrategy = 'sum' | 'best' | 'newest';

function toNum(value: string | undefined | null): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sum(a: string, b: string): string {
  if ((a ?? '').trim() === '' && (b ?? '').trim() === '') return '';
  return String(toNum(a) + toNum(b));
}

function leadingNumber(value: string): number | null {
  const match = (value ?? '').match(/\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = parseFloat(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
}

function best(a: string, b: string): string {
  const an = leadingNumber(a);
  const bn = leadingNumber(b);
  if (an === null) return b ?? '';
  if (bn === null) return a ?? '';
  return bn > an ? b : a;
}

function newest(existing: string, incoming: string): string {
  return (incoming ?? '').trim() !== '' ? incoming : existing;
}

/** Combines an incoming entry into an existing one for the same identity key
 * (see `entryKey`). Counts default to summing; anything with an explicit
 * strategy in `mergeStrategies` uses that instead. */
export function mergeRowGeneric(
  existing: Record<string, string>,
  incoming: Record<string, string>,
  detailColumns: StatColumn[],
  identityKey: string[],
  mergeStrategies?: Record<string, FieldMergeStrategy>
): Record<string, string> {
  const merged: Record<string, string> = { ...existing };
  detailColumns.forEach((column) => {
    if (identityKey.includes(column.key)) return;
    const strategy: FieldMergeStrategy =
      mergeStrategies?.[column.key] ?? (column.type === 'number' || column.type === 'decimal' ? 'sum' : 'newest');
    const a = existing[column.key] ?? '';
    const b = incoming[column.key] ?? '';
    merged[column.key] = strategy === 'sum' ? sum(a, b) : strategy === 'best' ? best(a, b) : newest(a, b);
  });
  return merged;
}

/** The identity-key combination (e.g. Format + Age Category + Match
 * Category, plus a sport-specific dimension like Weight Class) that
 * identifies one entry — two entries with the same key merge instead of
 * duplicating, mirroring Cricket's Category+Division+Year rule. */
export function entryKeyGeneric(row: Record<string, string>, identityKey: string[]): string {
  return identityKey.map((key) => row[key] ?? '').join('|');
}

export interface StatSectionWizardProps<TFieldValues extends FieldValues> {
  title: string;
  addLabel: string;
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  emptyRow: Record<string, string>;
  /** All columns for one entry, identity fields included — the same array a
   * plain StatTable would take for this section. */
  detailColumns: StatColumn[];
  /** Subset of `detailColumns` keys that together identify a unique entry —
   * adding another entry with the same combination merges into it instead
   * of creating a duplicate row. */
  identityKey: string[];
  mergeStrategies?: Record<string, FieldMergeStrategy>;
  /** True once an entry has been added/updated this editing session — the
   * "Add" button locks until the profile is saved, so only one change per
   * section goes in per save (same rule as Cricket's Career Stats tables). */
  locked: boolean;
  onEntryAdded: () => void;
}

/**
 * Generic version of Cricket's Batting/Bowling Career Stats table: entries
 * are created through an identity-key picker (one Dropdown per
 * `identityKey` field) before filling in the rest of the row — reusing an
 * identity combination already on file merges the new numbers into that
 * entry instead of adding a duplicate.
 */
export function StatSectionWizard<TFieldValues extends FieldValues>({
  title,
  addLabel,
  control,
  name,
  emptyRow,
  detailColumns,
  identityKey,
  mergeStrategies,
  locked,
  onEntryAdded,
}: StatSectionWizardProps<TFieldValues>) {
  const { fields, append, update } = useFieldArray({ control, name });
  const [isModalVisible, setModalVisible] = useState(false);

  const rows = fields as unknown as Record<string, string>[];

  const findIndex = (idValues: Record<string, string>) =>
    rows.findIndex((row) => entryKeyGeneric(row, identityKey) === entryKeyGeneric(idValues, identityKey));

  const handleSave = (row: Record<string, string>) => {
    const index = findIndex(row);
    if (index >= 0) {
      update(index, mergeRowGeneric(rows[index], row, detailColumns, identityKey, mergeStrategies) as never);
    } else {
      append(row as never);
    }
    setModalVisible(false);
    onEntryAdded();
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.rowCountBadge}>
            <Text style={styles.rowCountText}>{fields.length} {fields.length === 1 ? 'entry' : 'entries'}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          disabled={locked}
          style={({ pressed }) => [
            styles.addRowButton,
            locked && styles.addRowButtonLocked,
            pressed && !locked && styles.addRowButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: locked }}
        >
          <Ionicons name={locked ? 'lock-closed' : 'add'} size={16} color={colors.white} />
          <Text style={styles.addRowText}>{addLabel}</Text>
        </Pressable>
      </View>

      {locked ? <Text style={styles.lockedHint}>Save your profile to add another entry here.</Text> : null}

      {fields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={22} color={colors.textFaint} />
          <Text style={styles.emptyText}>No entries added yet — tap &quot;{addLabel}&quot; to begin.</Text>
        </View>
      ) : null}

      <StatSectionAddModal
        visible={isModalVisible}
        title={addLabel}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        emptyRow={emptyRow}
        rows={rows}
        detailColumns={detailColumns}
        identityKey={identityKey}
        hasExistingEntry={(idValues) => findIndex(idValues) >= 0}
      />
    </View>
  );
}

interface StatSectionAddModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (row: Record<string, string>) => void;
  emptyRow: Record<string, string>;
  rows: Record<string, string>[];
  detailColumns: StatColumn[];
  identityKey: string[];
  hasExistingEntry: (idValues: Record<string, string>) => boolean;
}

type Step = 'choice' | 'existing' | 'select' | 'detail';

function StatSectionAddModal(props: StatSectionAddModalProps) {
  const { visible, onClose } = props;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? <StatSectionAddModalBody {...props} /> : null}
    </Modal>
  );
}

function labelFor(options: DropdownOption[] | undefined, value: string): string {
  return options?.find((o) => o.value === value)?.label ?? '—';
}

function StatSectionAddModalBody({
  title,
  onClose,
  onSave,
  emptyRow,
  rows,
  detailColumns,
  identityKey,
  hasExistingEntry,
}: StatSectionAddModalProps) {
  // Year isn't a Dropdown-driven identity field — like Cricket's own wizard,
  // a new entry is always tagged with the current year automatically, and
  // picking an existing entry to update inherits *that* entry's year.
  const hasYear = identityKey.includes('year');
  const currentYear = String(new Date().getFullYear());
  const identityColumns = detailColumns.filter((c) => identityKey.includes(c.key) && c.key !== 'year');
  const restColumns = detailColumns.filter((c) => !identityKey.includes(c.key));

  const hasEntries = rows.length > 0;
  const [step, setStep] = useState<Step>(hasEntries ? 'choice' : 'select');
  const [origin, setOrigin] = useState<'select' | 'existing'>('select');
  const [idValues, setIdValues] = useState<Record<string, string>>(() =>
    hasYear ? { year: currentYear } : ({} as Record<string, string>)
  );
  const [detail, setDetail] = useState<Record<string, string>>(() => ({ ...emptyRow }));

  const baseEntryLabel = identityColumns
    .map((c) => labelFor(c.options, idValues[c.key] ?? ''))
    .filter((label) => label && label !== '—')
    .join(' · ');
  const entryLabel = hasYear && idValues.year ? [baseEntryLabel, idValues.year].filter(Boolean).join(' · ') : baseEntryLabel;
  const allIdentityFilled = identityColumns.every((c) => !!idValues[c.key]);
  const alreadyExists = allIdentityFilled && hasExistingEntry(idValues);
  const willMerge = origin === 'existing';

  const pickExisting = (row: Record<string, string>) => {
    const picked: Record<string, string> = {};
    identityColumns.forEach((c) => {
      picked[c.key] = row[c.key] ?? '';
    });
    if (hasYear) picked.year = row.year || currentYear;
    setIdValues(picked);
    setOrigin('existing');
    setStep('detail');
  };

  const goToNewEntryDetails = () => {
    setOrigin('select');
    setStep('detail');
  };

  const handleSave = () => {
    onSave({ ...detail, ...idValues });
  };

  const totalSteps = hasEntries ? 3 : 2;
  const stepIndex =
    step === 'choice' ? 1 : step === 'existing' || step === 'select' ? (hasEntries ? 2 : 1) : totalSteps;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.modalContainer}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.stepIndicatorRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <View style={styles.stepLine} /> : null}
            <View style={[styles.stepDot, i + 1 === stepIndex && styles.stepDotActive]} />
          </React.Fragment>
        ))}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
      >
        {step === 'choice' ? (
          <>
            <Text style={styles.stepTitle}>Update or Add New?</Text>
            <Text style={styles.stepSubtitle}>
              You already have entries here. Is this for one of them, or a new entry?
            </Text>

            <Pressable onPress={() => setStep('existing')} style={[styles.choiceCard, shadows.sm]} accessibilityRole="button">
              <View style={styles.choiceIconWrap}>
                <Ionicons name="git-merge-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceTitle}>Update an Existing Entry</Text>
                <Text style={styles.choiceSubtitle}>Add these numbers to one you&rsquo;ve already logged.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>

            <Pressable onPress={() => setStep('select')} style={[styles.choiceCard, shadows.sm]} accessibilityRole="button">
              <View style={styles.choiceIconWrap}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.choiceTextWrap}>
                <Text style={styles.choiceTitle}>Add a New Entry</Text>
                <Text style={styles.choiceSubtitle}>Log a combination you haven&rsquo;t used before.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          </>
        ) : step === 'existing' ? (
          <>
            <Pressable onPress={() => setStep('choice')} style={styles.backRow} accessibilityRole="button">
              <Ionicons name="chevron-back" size={16} color={colors.primary} />
              <Text style={styles.backRowText}>Back</Text>
            </Pressable>

            <Text style={styles.stepTitle}>Which Entry?</Text>
            <Text style={styles.stepSubtitle}>Pick the entry this belongs to.</Text>

            {rows.map((row, index) => (
              <Pressable
                key={index}
                onPress={() => pickExisting(row)}
                style={[styles.choiceCard, shadows.sm]}
                accessibilityRole="button"
              >
                <View style={styles.choiceTextWrap}>
                  <Text style={styles.choiceTitle}>
                    {[
                      identityColumns.map((c) => labelFor(c.options, row[c.key] ?? '')).join(' · '),
                      hasYear ? row.year : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>
            ))}

            <Pressable
              onPress={() => {
                setIdValues(hasYear ? { year: currentYear } : {});
                setStep('select');
              }}
              style={styles.addToggle}
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
              <Text style={styles.addToggleText}>None of these — add a new entry instead</Text>
            </Pressable>
          </>
        ) : step === 'select' ? (
          <>
            {hasEntries ? (
              <Pressable onPress={() => setStep('choice')} style={styles.backRow} accessibilityRole="button">
                <Ionicons name="chevron-back" size={16} color={colors.primary} />
                <Text style={styles.backRowText}>Back</Text>
              </Pressable>
            ) : null}

            <Text style={styles.stepTitle}>Select Details</Text>
            <Text style={styles.stepSubtitle}>
              {hasYear ? `Choose what this entry belongs to. It'll be logged under ${currentYear}.` : 'Choose what this entry belongs to.'}
            </Text>

            {identityColumns.map((column) => (
              <Dropdown
                key={column.key}
                label={column.label}
                value={idValues[column.key] ?? ''}
                onChange={(value) => setIdValues((prev) => ({ ...prev, [column.key]: value }))}
                options={column.options ?? []}
                placeholder={`Select ${column.label.toLowerCase()}`}
              />
            ))}

            {allIdentityFilled ? (
              alreadyExists ? (
                <View style={[styles.hintCard, styles.hintCardError]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.live} />
                  <Text style={styles.hintText}>
                    {`You already have an entry for ${entryLabel}. Go back and choose "Update an Existing Entry" to add these numbers to it instead.`}
                  </Text>
                </View>
              ) : (
                <View style={[styles.hintCard, styles.hintCardNew]}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                  <Text style={styles.hintText}>This will create a new entry for {entryLabel}.</Text>
                </View>
              )
            ) : null}

            <Pressable
              onPress={goToNewEntryDetails}
              disabled={!allIdentityFilled || alreadyExists}
              style={[styles.nextButton, (!allIdentityFilled || alreadyExists) && styles.nextButtonDisabled]}
              accessibilityRole="button"
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => setStep(origin)} style={styles.backRow} accessibilityRole="button">
              <Ionicons name="chevron-back" size={16} color={colors.primary} />
              <Text style={styles.backRowText}>{entryLabel || 'Back'}</Text>
            </Pressable>

            <Text style={styles.stepTitle}>Entry Details</Text>

            <View style={styles.detailGrid}>
              {restColumns.map((column) => (
                <View key={column.key} style={styles.detailFieldWrapper}>
                  <Text style={styles.detailFieldLabel}>{column.label}</Text>
                  <StatCell
                    column={column}
                    value={detail[column.key] ?? ''}
                    onChange={(value) => setDetail((prev) => ({ ...prev, [column.key]: value as string }))}
                  />
                </View>
              ))}
            </View>

            <Pressable onPress={handleSave} style={styles.nextButton} accessibilityRole="button">
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
              <Text style={styles.nextButtonText}>{willMerge ? 'Save & Merge' : 'Save Entry'}</Text>
            </Pressable>
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  titleWithBadge: {
    flexDirection: 'row',
    flexShrink: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flexShrink: 1,
  },
  rowCountBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rowCountText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addRowButtonPressed: {
    opacity: 0.88,
  },
  addRowButtonLocked: {
    backgroundColor: colors.textFaint,
  },
  addRowText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  lockedHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalContainer: {
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
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  stepLine: {
    width: 24,
    height: 1,
    backgroundColor: colors.border,
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
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  addToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -spacing.xs,
  },
  addToggleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  hintCardError: {
    backgroundColor: colors.liveLight,
    borderColor: colors.live,
  },
  hintCardNew: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  hintText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 17,
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
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.md,
  },
  backRowText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  choiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceTextWrap: {
    flex: 1,
  },
  choiceTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  choiceSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
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
});
