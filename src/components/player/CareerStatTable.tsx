import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrayPath, Control, FieldValues, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { DropdownOption } from './Dropdown';
import { StatColumn } from './StatTable';
import { CareerStatAddModal } from './CareerStatAddModal';
import { entryKey } from '../../utils/statMerge';

interface CareerStatTableProps<TFieldValues extends FieldValues> {
  title: string;
  addLabel: string;
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  emptyRow: Record<string, string>;
  categories: DropdownOption[];
  divisions: DropdownOption[];
  detailColumns: StatColumn[];
  mergeRows: (existing: Record<string, string>, incoming: Record<string, string>) => Record<string, string>;
  /** True once an entry has been added/updated this editing session — the
   * "Add New Stat" button locks until "Save Cricket Profile" succeeds (see
   * cricket.tsx), so only one Batting and one Bowling change go in per save. */
  locked: boolean;
  /** Fired right after an entry is added or merged — the parent uses this to
   * set `locked`. */
  onEntryAdded: () => void;
}

/**
 * Batting/Bowling Career Stats table — unlike the plain StatTable (still
 * used for Recent Matches), entries here are created one match at a time
 * through a "Category + Division" picker (CareerStatAddModal): reusing a
 * Category+Division already on file merges the new numbers into that entry
 * instead of adding a duplicate row (spec: see cricket.tsx).
 */
export function CareerStatTable<TFieldValues extends FieldValues>({
  title,
  addLabel,
  control,
  name,
  emptyRow,
  categories,
  divisions,
  detailColumns,
  mergeRows,
  locked,
  onEntryAdded,
}: CareerStatTableProps<TFieldValues>) {
  const { fields, append, update } = useFieldArray({ control, name });
  const [isModalVisible, setModalVisible] = useState(false);

  const rows = fields as unknown as Record<string, string>[];

  const findIndex = (categoryId: string, divisionId: string, year: string) =>
    rows.findIndex(
      (row) =>
        entryKey(row as { age_category_id: string; format_id: string; year: string }) ===
        `${categoryId}|${divisionId}|${year}`
    );

  const handleSave = (row: Record<string, string>) => {
    const index = findIndex(row.age_category_id, row.format_id, row.year);
    if (index >= 0) {
      update(index, mergeRows(rows[index], row) as never);
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

      {locked ? (
        <Text style={styles.lockedHint}>
          Save your Cricket Profile to add another entry here.
        </Text>
      ) : null}

      {fields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={22} color={colors.textFaint} />
          <Text style={styles.emptyText}>No entries added yet — tap &quot;{addLabel}&quot; to begin.</Text>
        </View>
      ) : null}

      <CareerStatAddModal
        visible={isModalVisible}
        title={addLabel}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        emptyRow={emptyRow}
        rows={rows}
        categories={categories}
        divisions={divisions}
        detailColumns={detailColumns}
        hasExistingEntry={(categoryId, divisionId, year) => findIndex(categoryId, divisionId, year) >= 0}
      />
    </View>
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
});
