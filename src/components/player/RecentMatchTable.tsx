import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrayPath, Control, FieldValues, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { StatColumn } from './StatTable';
import { StatDataTable } from './StatDataTable';
import { SimpleStatAddModal } from './SimpleStatAddModal';
import { sortRecentMatchesNewestFirst } from '../../utils/date';

interface RecentMatchTableProps<TFieldValues extends FieldValues> {
  title: string;
  addLabel: string;
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  emptyRow: Record<string, unknown>;
  columns: StatColumn[];
  /** Bumped by the parent every time "Save Cricket Profile" succeeds — the
   * table watches this to forget which match was "this session's" (see
   * sessionIndex below), so the Add button unlocks for a genuinely fresh
   * session rather than staying pointed at the just-saved match. Whether
   * the Add button is locked is otherwise entirely this component's own
   * business — it isn't tracked by the parent, so there's only ever one
   * piece of state to keep in sync, not two. */
  resetSignal: number;
}

/**
 * Recent Matches — one blank match at a time via a modal (SimpleStatAddModal),
 * same "one add per save" flow as the Batting/Bowling Career Stats tables
 * (CareerStatTable). Unlike those, there's no Category+Division to pick and
 * no merge step: every match is its own row, so "Add" never combines into
 * an existing entry — it's inserted, then the whole list is re-sorted
 * newest-first and capped to the 10 most recent (see
 * sortRecentMatchesNewestFirst) — adding an 11th drops the oldest, not the
 * one just added.
 *
 * The Edit screen deliberately doesn't list already-saved matches here —
 * this screen is for adding, not reviewing/deleting past entries (those are
 * visible in the read-only profile view). It does show, as a small table,
 * the one match added this session — with an edit (pencil) action to
 * correct it before hitting "Save Cricket Profile" — since only one new
 * match can be added per save anyway (see `locked`).
 */
export function RecentMatchTable<TFieldValues extends FieldValues>({
  title,
  addLabel,
  control,
  name,
  emptyRow,
  columns,
  resetSignal,
}: RecentMatchTableProps<TFieldValues>) {
  const { fields, replace } = useFieldArray({ control, name });
  const [isModalVisible, setModalVisible] = useState(false);
  // Index (in `rows`) of the one match added this session, or null before
  // that happens — this alone both locks the Add button (`isLocked` below)
  // and picks the row the session table/edit pencil shows, so the two can
  // never fall out of sync the way two separately-tracked flags could.
  const [sessionIndex, setSessionIndex] = useState<number | null>(null);
  const isLocked = sessionIndex !== null;

  // A successful save means this match is no longer "pending" — forget it
  // so Add unlocks for a fresh one next time, instead of staying pointed at
  // (and silently re-editing) the one that just got saved.
  useEffect(() => {
    setSessionIndex(null);
  }, [resetSignal]);

  const rows = fields as unknown as Record<string, unknown>[];
  const sessionRow = sessionIndex !== null ? rows[sessionIndex] : null;

  const handleSave = (row: Record<string, unknown>) => {
    if (sessionIndex !== null) {
      // Correcting the match added earlier this session — still re-sort in
      // case the date changed, and re-locate it afterwards. A date old
      // enough to fall past the 10-match cap drops it from `sorted`
      // entirely (indexOf -1) — treat that the same as never having added
      // one, rather than pointing sessionIndex at the wrong row.
      const next = rows.map((existing, index) => (index === sessionIndex ? row : existing));
      const sorted = sortRecentMatchesNewestFirst(next);
      const newIndex = sorted.indexOf(row);
      replace(sorted as never);
      setSessionIndex(newIndex === -1 ? null : newIndex);
      setModalVisible(false);
      return;
    }
    // Newest first, capped at 10 — adding an 11th drops the oldest one
    // rather than the one just added. Re-sorting the whole array (not just
    // appending) also keeps things correct if the player enters matches
    // out of date order.
    const sorted = sortRecentMatchesNewestFirst([...rows, row]);
    const newIndex = sorted.indexOf(row);
    replace(sorted as never);
    setSessionIndex(newIndex === -1 ? null : newIndex);
    setModalVisible(false);
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
        <Text style={styles.lockedHint}>Save your Cricket Profile to add another match.</Text>
      ) : null}

      {sessionRow ? (
        <StatDataTable columns={columns} rows={[sessionRow]} onEditRow={() => setModalVisible(true)} />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={22} color={colors.textFaint} />
          <Text style={styles.emptyText}>No match added yet this session — tap &quot;{addLabel}&quot; to add one.</Text>
        </View>
      )}

      <SimpleStatAddModal
        visible={isModalVisible}
        title={sessionRow ? 'Edit Match' : addLabel}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        emptyRow={emptyRow}
        initialRow={sessionRow ?? undefined}
        saveLabel={sessionRow ? 'Save Changes' : 'Save Entry'}
        columns={columns}
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
