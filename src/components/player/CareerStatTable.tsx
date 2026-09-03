import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrayPath, Control, FieldValues, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { DropdownOption } from './Dropdown';
import { StatColumn } from './StatTable';
import { StatDataTable } from './StatDataTable';
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
  /** Bumped by the parent every time "Save Cricket Profile" succeeds — the
   * table watches this to forget which entry was "this session's" (see
   * sessionIndex below), so the Add button unlocks for a genuinely fresh
   * session rather than staying pointed at the just-saved entry. Whether
   * the Add button is locked is otherwise entirely this component's own
   * business — it isn't tracked by the parent, so there's only ever one
   * piece of state to keep in sync, not two. */
  resetSignal: number;
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
  resetSignal,
}: CareerStatTableProps<TFieldValues>) {
  const { fields, append, update } = useFieldArray({ control, name });
  const [isModalVisible, setModalVisible] = useState(false);
  // Index (in `rows`) of the one entry this session's "Add" touched — either
  // a brand new row or one it merged into — or null before that happens.
  // This alone both locks the Add button (`isLocked` below) and picks the
  // row the session table/edit pencil shows, so the two can never fall out
  // of sync the way two separately-tracked flags could.
  const [sessionIndex, setSessionIndex] = useState<number | null>(null);
  const isLocked = sessionIndex !== null;

  // A successful save means this entry is no longer "pending" — forget it
  // so Add unlocks for a fresh one next time, instead of staying pointed at
  // (and silently re-editing) the one that just got saved.
  useEffect(() => {
    setSessionIndex(null);
  }, [resetSignal]);

  const rows = fields as unknown as Record<string, string>[];
  const sessionRow = sessionIndex !== null ? rows[sessionIndex] : null;

  const findIndex = (categoryId: string, divisionId: string, year: string) =>
    rows.findIndex(
      (row) =>
        entryKey(row as { age_category_id: string; format_id: string; year: string }) ===
        `${categoryId}|${divisionId}|${year}`
    );

  const handleSave = (row: Record<string, string>) => {
    if (sessionIndex !== null) {
      update(sessionIndex, row as never);
      setModalVisible(false);
      return;
    }
    const index = findIndex(row.age_category_id, row.format_id, row.year);
    if (index >= 0) {
      update(index, mergeRows(rows[index], row) as never);
      setSessionIndex(index);
    } else {
      append(row as never);
      setSessionIndex(rows.length);
    }
    setModalVisible(false);
  };

  // Category/Division/Year identify each entry (see entryKey) but aren't
  // part of detailColumns — shown as their own leading columns so the table
  // reads the same as the "Which Entry?" picker in CareerStatAddModal.
  const tableColumns: StatColumn[] = [
    { key: 'age_category_id', label: 'Category', type: 'select', options: categories, width: 100 },
    { key: 'format_id', label: 'Division', type: 'select', options: divisions, width: 90 },
    { key: 'year', label: 'Year', type: 'text', width: 64 },
    ...detailColumns,
  ];

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
          disabled={isLocked}
          style={({ pressed }) => [
            styles.addRowButton,
            isLocked && styles.addRowButtonLocked,
            pressed && !isLocked && styles.addRowButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: isLocked }}
        >
          <Ionicons name={isLocked ? 'lock-closed' : 'add'} size={16} color={colors.white} />
          <Text style={styles.addRowText}>{addLabel}</Text>
        </Pressable>
      </View>

      {isLocked ? (
        <Text style={styles.lockedHint}>
          Save your Cricket Profile to add another entry here.
        </Text>
      ) : null}

      {sessionRow ? (
        <StatDataTable columns={tableColumns} rows={[sessionRow]} onEditRow={() => setModalVisible(true)} />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={22} color={colors.textFaint} />
          <Text style={styles.emptyText}>No entry added yet this session — tap &quot;{addLabel}&quot; to add one.</Text>
        </View>
      )}

      <CareerStatAddModal
        visible={isModalVisible}
        title={sessionRow ? 'Edit Entry' : addLabel}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        emptyRow={emptyRow}
        rows={rows}
        categories={categories}
        divisions={divisions}
        detailColumns={detailColumns}
        hasExistingEntry={(categoryId, divisionId, year) => findIndex(categoryId, divisionId, year) >= 0}
        editRow={sessionRow ?? undefined}
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
