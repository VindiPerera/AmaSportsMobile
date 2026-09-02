import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { Dropdown, DropdownOption } from './Dropdown';
import { StatColumn } from './StatTable';

/** Only these Categories offer a Division — everything else (U20+, Div i/
 * ii/iii/iv/v as a Category in their own right, District, Province, ...) is
 * Category-only, per the client's spec. Matched case-insensitively against
 * the selected Category's label, since `cricket_categories.id` isn't a
 * stable/predictable signal from the frontend. */
const DIVISION_ELIGIBLE_CATEGORIES = ['U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19'];

function categoryHasDivision(categoryLabel: string): boolean {
  return DIVISION_ELIGIBLE_CATEGORIES.includes(categoryLabel.trim().toUpperCase());
}

function DetailField({
  column,
  value,
  onChange,
}: {
  column: StatColumn;
  value: string;
  onChange: (value: string) => void;
}) {
  if (column.type === 'select') {
    return (
      <View style={styles.detailFieldWrapper}>
        <Text style={styles.detailFieldLabel}>{column.label}</Text>
        <Dropdown compact value={value ?? ''} onChange={onChange} options={column.options ?? []} placeholder="Select" />
      </View>
    );
  }
  return (
    <View style={styles.detailFieldWrapper}>
      <Text style={styles.detailFieldLabel}>{column.label}</Text>
      <TextInput
        style={styles.detailInput}
        value={value ?? ''}
        onChangeText={onChange}
        keyboardType={column.type === 'number' || column.type === 'decimal' ? 'number-pad' : 'default'}
        placeholder={column.type === 'number' || column.type === 'decimal' ? '0' : ''}
        placeholderTextColor={colors.textFaint}
      />
    </View>
  );
}

interface CareerStatAddModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (row: Record<string, string>) => void;
  emptyRow: Record<string, string>;
  /** Entries already on file — offered as an "update one of these" list
   * before falling through to picking a fresh Category+Division. */
  rows: Record<string, string>[];
  categories: DropdownOption[];
  divisions: DropdownOption[];
  detailColumns: StatColumn[];
  /** True when the currently-selected Category+Division+Year already has an
   * entry — shown as a merge hint before the player continues to step 2.
   * Year is part of the identity: U13 · Div IV · 2026 and U13 · Div IV ·
   * 2027 are separate entries. */
  hasExistingEntry: (categoryId: string, divisionId: string, year: string) => boolean;
  /** When set, the modal skips straight to the match-details step for this
   * exact entry (Category/Division/Year shown read-only, not re-pickable)
   * instead of the Add/Update wizard — used to correct an entry already on
   * file (see CareerStatTable). Saving replaces that entry outright; it
   * never merges, since re-picking the same Category+Division+Year would
   * otherwise double-count against itself. */
  editRow?: Record<string, string> | null;
}

type Step = 'choice' | 'existing' | 'select' | 'detail';

/**
 * "Add New Batting/Bowling Stat" flow. When entries already exist, it first
 * asks whether this match belongs to one of them (pick from the list — the
 * new numbers merge into that entry, see mergeBattingRows/mergeBowlingRows)
 * or is a brand new Category+Division; with no entries yet it goes straight
 * to picking Category+Division. Either path lands on the same match-details
 * step to finish.
 *
 * The step/category/division/detail state lives in `CareerStatAddModalBody`,
 * which is only mounted while `visible` — so every re-open starts that state
 * fresh via useState's initializer, with no reset-on-open effect needed.
 */
export function CareerStatAddModal(props: CareerStatAddModalProps) {
  const { visible, onClose } = props;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? <CareerStatAddModalBody {...props} /> : null}
    </Modal>
  );
}

function CareerStatAddModalBody({
  title,
  onClose,
  onSave,
  emptyRow,
  rows,
  categories,
  divisions,
  detailColumns,
  hasExistingEntry,
  editRow,
}: CareerStatAddModalProps) {
  const isEditing = !!editRow;
  const hasEntries = rows.length > 0;
  const [step, setStep] = useState<Step>(isEditing ? 'detail' : hasEntries ? 'choice' : 'select');
  const [categoryId, setCategoryId] = useState(editRow?.age_category_id ?? '');
  const [divisionId, setDivisionId] = useState(editRow?.format_id ?? '');
  // Year is part of an entry's identity (see hasExistingEntry), but it's
  // never typed in — a brand new entry is always tagged with the current
  // year automatically, so once the calendar rolls over the same
  // Category+Division becomes addable again as a fresh entry. Picking an
  // existing entry to update takes on *that* entry's year instead, so the
  // update lands on the right one even if it's from a past year.
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(editRow?.year || currentYear);
  // Which path got us to the match-details step — decides whether "Back"
  // returns to the existing-entries list or the new-entry picker, and
  // whether Save merges (always true for 'existing') or creates fresh. Not
  // used while editing — that path replaces the entry outright.
  const [origin, setOrigin] = useState<'select' | 'existing'>('select');
  const [detail, setDetail] = useState<Record<string, string>>(() => ({ ...(editRow ?? emptyRow) }));

  const labelFor = (options: DropdownOption[], id: string) => options.find((o) => o.value === id)?.label ?? '—';
  const categoryName = labelFor(categories, categoryId);
  const divisionName = labelFor(divisions, divisionId);
  // "U13 · Div IV" when this Category has a Division, just "U20" when it
  // doesn't — never a dangling "· —".
  const entryLabel = divisionId ? `${categoryName} · ${divisionName}` : categoryName;
  // Only U12...U19 offer a Division at all; every other Category is
  // Category-only, so Division can't be required for those.
  const needsDivision = categoryHasDivision(categoryName);
  const divisionSatisfied = !needsDivision || !!divisionId;
  // In the "Add a New Entry" path this being true means a conflict (that
  // Category+Division+Year already exists — blocked, see the 'select' step
  // below). In the "Update an Existing Entry" path it's always true by
  // construction, and expected: that's the whole point of picking one.
  const alreadyExists = !!categoryId && divisionSatisfied && hasExistingEntry(categoryId, divisionId, year);
  const willMerge = origin === 'existing';

  const pickExisting = (row: Record<string, string>) => {
    setCategoryId(row.age_category_id);
    setDivisionId(row.format_id);
    setYear(row.year || currentYear);
    setOrigin('existing');
    setStep('detail');
  };

  const selectCategory = (id: string) => {
    setCategoryId(id);
    if (!categoryHasDivision(labelFor(categories, id))) {
      setDivisionId('');
    }
  };

  const goToNewEntryDetails = () => {
    setOrigin('select');
    setStep('detail');
  };

  const handleSave = () => {
    onSave({ ...detail, age_category_id: categoryId, format_id: divisionId, year });
  };

  // Dots reflect the actual path: 3 steps when there's a choice to make
  // up front, 2 when there's nothing to update yet.
  const totalSteps = hasEntries ? 3 : 2;
  const stepIndex =
    step === 'choice' ? 1 : step === 'existing' || step === 'select' ? (hasEntries ? 2 : 1) : totalSteps;

  return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isEditing ? null : (
          <View style={styles.stepIndicatorRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <View style={styles.stepLine} /> : null}
                <View style={[styles.stepDot, i + 1 === stepIndex && styles.stepDotActive]} />
              </React.Fragment>
            ))}
          </View>
        )}

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
                You already have entries for this player. Is this match for one of them, or a new Category +
                Division?
              </Text>

              <Pressable onPress={() => setStep('existing')} style={[styles.choiceCard, shadows.sm]} accessibilityRole="button">
                <View style={styles.choiceIconWrap}>
                  <Ionicons name="git-merge-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.choiceTextWrap}>
                  <Text style={styles.choiceTitle}>Update an Existing Entry</Text>
                  <Text style={styles.choiceSubtitle}>Add this match&rsquo;s stats to one you&rsquo;ve already logged.</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>

              <Pressable onPress={() => setStep('select')} style={[styles.choiceCard, shadows.sm]} accessibilityRole="button">
                <View style={styles.choiceIconWrap}>
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.choiceTextWrap}>
                  <Text style={styles.choiceTitle}>Add a New Entry</Text>
                  <Text style={styles.choiceSubtitle}>Log a Category + Division you haven&rsquo;t used before.</Text>
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
              <Text style={styles.stepSubtitle}>Pick the Category + Division + Year this match belongs to.</Text>

              {rows.map((row, index) => (
                <Pressable
                  key={index}
                  onPress={() => pickExisting(row)}
                  style={[styles.choiceCard, shadows.sm]}
                  accessibilityRole="button"
                >
                  <View style={styles.choiceTextWrap}>
                    <Text style={styles.choiceTitle}>
                      {row.format_id
                        ? `${labelFor(categories, row.age_category_id)} · ${labelFor(divisions, row.format_id)}`
                        : labelFor(categories, row.age_category_id)}
                    </Text>
                    {row.year ? <Text style={styles.choiceSubtitle}>{row.year}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Pressable>
              ))}

              <Pressable
                onPress={() => {
                  setCategoryId('');
                  setDivisionId('');
                  setYear(currentYear);
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

              <Text style={styles.stepTitle}>Select Category</Text>
              <Text style={styles.stepSubtitle}>
                {`Choose the category this match was played in — a Division picker appears for U12–U19. It'll be logged under ${currentYear}.`}
              </Text>

              <Dropdown label="Category" value={categoryId} onChange={selectCategory} options={categories} placeholder="Select category" />

              {needsDivision ? (
                <Dropdown label="Division" value={divisionId} onChange={setDivisionId} options={divisions} placeholder="Select division" />
              ) : null}

              {categoryId && divisionSatisfied ? (
                alreadyExists ? (
                  <View style={[styles.hintCard, styles.hintCardError]}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.live} />
                    <Text style={styles.hintText}>
                      {`You already have a ${currentYear} entry for ${entryLabel}. Go back and choose "Update an Existing Entry" to add this match's stats to it — a new entry can only be a Category${needsDivision ? ' + Division' : ''} you haven't used yet this year.`}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.hintCard, styles.hintCardNew]}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                    <Text style={styles.hintText}>
                      This will create a new entry for {entryLabel} · {currentYear}.
                    </Text>
                  </View>
                )
              ) : null}

              <Pressable
                onPress={goToNewEntryDetails}
                disabled={!categoryId || !divisionSatisfied || alreadyExists}
                style={[styles.nextButton, (!categoryId || !divisionSatisfied || alreadyExists) && styles.nextButtonDisabled]}
                accessibilityRole="button"
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              </Pressable>
            </>
          ) : (
            <>
              {isEditing ? (
                <Text style={styles.stepSubtitle}>{entryLabel} · {year}</Text>
              ) : (
                <Pressable onPress={() => setStep(origin)} style={styles.backRow} accessibilityRole="button">
                  <Ionicons name="chevron-back" size={16} color={colors.primary} />
                  <Text style={styles.backRowText}>
                    {entryLabel} · {year}
                  </Text>
                </Pressable>
              )}

              <Text style={styles.stepTitle}>Match Details</Text>

              <View style={styles.detailGrid}>
                {detailColumns.map((column) => (
                  <DetailField
                    key={column.key}
                    column={column}
                    value={detail[column.key] ?? ''}
                    onChange={(value) => setDetail((prev) => ({ ...prev, [column.key]: value }))}
                  />
                ))}
              </View>

              <Pressable onPress={handleSave} style={styles.nextButton} accessibilityRole="button">
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                <Text style={styles.nextButtonText}>
                  {isEditing ? 'Save Changes' : willMerge ? 'Save & Merge' : 'Save Entry'}
                </Text>
              </Pressable>
            </>
          )}
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
  detailInput: {
    ...typography.caption,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    height: 50,
    paddingHorizontal: spacing.sm,
  },
});
