import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrayPath, Control, FieldValues, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { StatColumn } from './StatTable';
import { SimpleStatAddModal } from './SimpleStatAddModal';

interface RecentMatchTableProps<TFieldValues extends FieldValues> {
  title: string;
  addLabel: string;
  control: Control<TFieldValues>;
  name: ArrayPath<TFieldValues>;
  emptyRow: Record<string, unknown>;
  columns: StatColumn[];
  /** True once a match has been added this editing session — the "Add New
   * Match" button locks until "Save Cricket Profile" succeeds (see
   * cricket.tsx), so only one new match goes in per save. */
  locked: boolean;
  /** Fired right after a match is added. */
  onEntryAdded: () => void;
}

/**
 * Recent Matches — one blank match at a time via a modal (SimpleStatAddModal),
 * appended to the list, same "one add per save" flow as the Batting/Bowling
 * Career Stats tables (CareerStatTable). Unlike those, there's no Category+
 * Division to pick and no merge step: every match is its own row, so "Add"
 * always appends rather than ever combining into an existing entry.
 *
 * The Edit screen deliberately doesn't list already-saved matches as cards
 * here — this screen is for adding, not reviewing/deleting past entries;
 * saved matches are visible in the read-only profile view after saving.
 */
export function RecentMatchTable<TFieldValues extends FieldValues>({
  title,
  addLabel,
  control,
  name,
  emptyRow,
  columns,
  locked,
  onEntryAdded,
}: RecentMatchTableProps<TFieldValues>) {
  const { fields, append } = useFieldArray({ control, name });
  const [isModalVisible, setModalVisible] = useState(false);

  const handleSave = (row: Record<string, unknown>) => {
    append(row as never);
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
        <Text style={styles.lockedHint}>Save your Cricket Profile to add another match.</Text>
      ) : null}

      {fields.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={22} color={colors.textFaint} />
          <Text style={styles.emptyText}>No entries added yet — tap &quot;{addLabel}&quot; to begin.</Text>
        </View>
      ) : null}

      <SimpleStatAddModal
        visible={isModalVisible}
        title={addLabel}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        emptyRow={emptyRow}
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
