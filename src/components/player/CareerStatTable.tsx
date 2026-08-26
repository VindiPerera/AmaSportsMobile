import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrayPath, Control, Controller, FieldValues, Path, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { DropdownOption } from './Dropdown';
import { StatCell, StatColumn } from './StatTable';
import { CareerStatAddModal } from './CareerStatAddModal';
import { entryKey } from '../../utils/statMerge';

function labelFor(options: DropdownOption[], id: string): string {
  return options.find((o) => o.value === id)?.label ?? '—';
}

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
  // The one row just added/updated this editing session — shown inline,
  // editable, below. Every other entry stays out of view (per spec: only
  // what was just added is visible here; the full history shows up in the
  // read-only profile view instead), and this resets to null whenever the
  // form remounts (e.g. re-entering edit mode loads a fresh copy).
  const [lastEntryIndex, setLastEntryIndex] = useState<number | null>(null);
  // Defaults to the read-only table look (matching how it reads once the
  // profile is saved); "Edit" swaps just that row into input fields.
  const [isEditingLastEntry, setIsEditingLastEntry] = useState(false);

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
      setLastEntryIndex(index);
    } else {
      setLastEntryIndex(fields.length);
      append(row as never);
    }
    setIsEditingLastEntry(false);
    setModalVisible(false);
    onEntryAdded();
  };

  const lastEntry = lastEntryIndex !== null ? rows[lastEntryIndex] : null;

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

      {lastEntryIndex !== null && lastEntry ? (
        <View style={[styles.entryCard, shadows.sm]}>
          <View style={styles.entryHeader}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.entryLabel} numberOfLines={1}>
              {lastEntry.format_id
                ? `${labelFor(categories, lastEntry.age_category_id)} · ${labelFor(divisions, lastEntry.format_id)}`
                : labelFor(categories, lastEntry.age_category_id)}
              {lastEntry.year ? ` · ${lastEntry.year}` : ''}
            </Text>
            <Pressable
              onPress={() => setIsEditingLastEntry((prev) => !prev)}
              hitSlop={8}
              style={styles.editToggle}
              accessibilityRole="button"
            >
              <Ionicons
                name={isEditingLastEntry ? 'checkmark' : 'create-outline'}
                size={13}
                color={colors.primary}
              />
              <Text style={styles.editToggleText}>{isEditingLastEntry ? 'Done' : 'Edit'}</Text>
            </Pressable>
          </View>

          {isEditingLastEntry ? (
            <View style={styles.fieldGrid}>
              {detailColumns.map((column) => (
                <View key={column.key} style={styles.fieldWrapper}>
                  <Text style={styles.fieldLabel} numberOfLines={1}>
                    {column.label}
                  </Text>
                  <Controller
                    control={control}
                    name={`${name}.${lastEntryIndex}.${column.key}` as Path<TFieldValues>}
                    render={({ field: { value, onChange } }) => (
                      <StatCell column={column} value={value} onChange={onChange} />
                    )}
                  />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.tableHeaderRow}>
                  {detailColumns.map((column) => (
                    <Text key={column.key} style={styles.thCell} numberOfLines={1}>
                      {column.label}
                    </Text>
                  ))}
                </View>
                <View style={styles.tableDataRow}>
                  {detailColumns.map((column) => (
                    <Text key={column.key} style={styles.tdCell} numberOfLines={1}>
                      {lastEntry[column.key] || (column.type === 'number' || column.type === 'decimal' ? '0' : '-')}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
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
  entryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  entryLabel: {
    ...typography.caption,
    flex: 1,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  editToggleText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  tableDataRow: {
    flexDirection: 'row',
  },
  thCell: {
    ...typography.caption,
    minWidth: 64,
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tdCell: {
    ...typography.caption,
    minWidth: 64,
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldWrapper: {
    minWidth: 100,
    flexGrow: 1,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
    marginBottom: 4,
  },
});
