import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Control, useFieldArray } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { StatDataTable } from './StatDataTable';
import { StatColumn } from './StatTable';
import { AddCricketMatchModal, ExistingCricketEntry } from './AddCricketMatchModal';
import { DropdownOption } from './Dropdown';
import { entryKey, mergeBattingRows, mergeBowlingRows } from '../../utils/statMerge';
import {
  CricketBattingRowForm,
  CricketBowlingRowForm,
  CricketProfileFormValues,
  CricketRecentMatchRowForm,
  PickedImage,
} from '../../types';

const SESSION_COLUMNS: StatColumn[] = [
  { key: 'match_date', label: 'Date', type: 'date' },
  { key: 'opponent', label: 'Match vs', type: 'text' },
  { key: 'runs', label: 'Runs', type: 'number' },
  { key: 'wickets', label: 'Wkts', type: 'number' },
];

/** Which existing aggregate row (if any) a match's Format+Category+Year
 * landed on before this session's merge — `null` means it created a brand
 * new row. Remembered so "Edit" can restore the aggregate to exactly how
 * it looked before, rather than trying to mathematically undo a merge
 * (not always possible — see mergeRows' "keep the higher" HS/BBI/BBM). */
type Snapshot<T> = { index: number; row: T } | { index: null };

function mergeMatchInto<T extends { age_category_id: string; format_id: string; year: string }>(
  rows: T[],
  incoming: T,
  emptyRow: T,
  mergeFn: (existing: T, incoming: T) => T
): { rows: T[]; snapshot: Snapshot<T> } {
  const key = entryKey(incoming);
  const index = rows.findIndex((row) => entryKey(row) === key);
  if (index >= 0) {
    return {
      rows: rows.map((row, i) => (i === index ? mergeFn(row, incoming) : row)),
      snapshot: { index, row: rows[index] },
    };
  }
  return { rows: [...rows, mergeFn(emptyRow, incoming)], snapshot: { index: null } };
}

function restoreSnapshot<T>(rows: T[], snapshot: Snapshot<T>): T[] {
  if (snapshot.index === null) return rows.slice(0, -1);
  return rows.map((row, i) => (i === snapshot.index ? snapshot.row : row));
}

interface CricketMatchEntryCardProps {
  control: Control<CricketProfileFormValues>;
  emptyMatchRow: CricketRecentMatchRowForm;
  emptyBattingRow: CricketBattingRowForm;
  emptyBowlingRow: CricketBowlingRowForm;
  formats: DropdownOption[];
  categories: DropdownOption[];
  resetSignal: number;
  onUploadScoreSheet: (image: PickedImage) => Promise<string>;
}

/**
 * Replaces the old three separate "Add" flows (Batting Career Stat, Bowling
 * Career Stat, Recent Match) with one: a match's full Batting+Bowling detail
 * is entered once (see AddCricketMatchModal) and, on confirm, both appends
 * to Recent Matches (a flat, unaggregated list — untouched by this) and
 * merges into whichever Batting/Bowling Career Stats row shares its
 * Format+Category+Year (same merge rules as before, see statMerge.ts) — or
 * starts a new one. Only one match per save, same as the old flow (see
 * sessionMatchIndex): the just-added match shows below with an Edit action,
 * which safely restores the aggregate rows it touched (see restoreSnapshot)
 * before reopening the form, rather than trying to un-merge them.
 */
export function CricketMatchEntryCard({
  control,
  emptyMatchRow,
  emptyBattingRow,
  emptyBowlingRow,
  formats,
  categories,
  resetSignal,
  onUploadScoreSheet,
}: CricketMatchEntryCardProps) {
  const { fields: matchFields, replace: replaceMatches } = useFieldArray({ control, name: 'recent_matches' });
  const { fields: battingFields, replace: replaceBatting } = useFieldArray({ control, name: 'batting' });
  const { fields: bowlingFields, replace: replaceBowling } = useFieldArray({ control, name: 'bowling' });

  const [isModalVisible, setModalVisible] = useState(false);
  const [sessionMatchIndex, setSessionMatchIndex] = useState<number | null>(null);
  const [battingSnapshot, setBattingSnapshot] = useState<Snapshot<CricketBattingRowForm> | null>(null);
  const [bowlingSnapshot, setBowlingSnapshot] = useState<Snapshot<CricketBowlingRowForm> | null>(null);

  useEffect(() => {
    setSessionMatchIndex(null);
    setBattingSnapshot(null);
    setBowlingSnapshot(null);
  }, [resetSignal]);

  const matchRows = matchFields as unknown as CricketRecentMatchRowForm[];
  const battingRows = battingFields as unknown as CricketBattingRowForm[];
  const bowlingRows = bowlingFields as unknown as CricketBowlingRowForm[];
  const isLocked = sessionMatchIndex !== null;
  const sessionRow = sessionMatchIndex !== null ? matchRows[sessionMatchIndex] : null;

  // Every Format+Category+Year the player already has a Career Stats entry
  // for, from either table — going forward batting/bowling are always
  // created together by this same form, but older data (pre-dating this
  // combined flow) may have one without the other, so this unions both.
  const existingEntries: ExistingCricketEntry[] = [];
  const seenKeys = new Set<string>();
  [...battingRows, ...bowlingRows].forEach((r) => {
    const key = entryKey(r);
    if (!r.age_category_id || !r.format_id || seenKeys.has(key)) return;
    seenKeys.add(key);
    existingEntries.push({ age_category_id: r.age_category_id, format_id: r.format_id, year: r.year });
  });

  const handleSave = (row: CricketRecentMatchRowForm) => {
    const battingIncoming: CricketBattingRowForm = {
      format_id: row.format_id,
      age_category_id: row.age_category_id,
      match_category_id: '',
      cricket_match_type_id: '',
      year: row.year,
      matches: '1',
      won: '',
      lost: '',
      innings: row.batting_innings,
      not_out: row.not_out ? '1' : '0',
      runs: row.runs,
      balls: row.balls,
      hs: row.hs,
      average: '',
      best: '',
      sr: '',
      hundreds: row.hundreds ? '1' : '0',
      fifties: row.fifties ? '1' : '0',
      fours: row.fours,
      sixes: row.sixes,
      catches: row.catches,
      stumpings: row.stumpings,
      run_outs: '',
      direct_hits: '',
      runs_saved: '',
      runs_giving: '',
      stumps_missing: '',
    };
    const bowlingIncoming: CricketBowlingRowForm = {
      format_id: row.format_id,
      age_category_id: row.age_category_id,
      match_category_id: '',
      cricket_match_type_id: '',
      year: row.year,
      matches: '1',
      innings: row.bowling_innings,
      balls: row.bowling_balls,
      dot_balls: '',
      wide_balls: '',
      no_balls: '',
      runs: row.bowling_runs,
      wickets: row.wickets,
      bbi: row.bbi,
      bbm: row.bbm,
      average: '',
      economy: '',
      sr: '',
      four_w: row.four_w ? '1' : '0',
      five_w: row.five_w ? '1' : '0',
      ten_w: row.ten_w ? '1' : '0',
    };

    // Editing this session's match: restore both aggregate rows to how they
    // looked before the original merge, so re-merging the edited values
    // never double-counts (or leaves a stale "best" figure) from the first save.
    const battingBase = battingSnapshot ? restoreSnapshot(battingRows, battingSnapshot) : battingRows;
    const bowlingBase = bowlingSnapshot ? restoreSnapshot(bowlingRows, bowlingSnapshot) : bowlingRows;

    const battingResult = mergeMatchInto(battingBase, battingIncoming, emptyBattingRow, mergeBattingRows);
    const bowlingResult = mergeMatchInto(bowlingBase, bowlingIncoming, emptyBowlingRow, mergeBowlingRows);

    replaceBatting(battingResult.rows as never);
    replaceBowling(bowlingResult.rows as never);
    setBattingSnapshot(battingResult.snapshot);
    setBowlingSnapshot(bowlingResult.snapshot);

    if (sessionMatchIndex !== null) {
      replaceMatches(matchRows.map((existing, i) => (i === sessionMatchIndex ? row : existing)) as never);
    } else {
      replaceMatches([...matchRows, row] as never);
      setSessionMatchIndex(matchRows.length);
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.title}>Add Match</Text>
          <View style={styles.rowCountBadge}>
            <Text style={styles.rowCountText}>{matchFields.length} {matchFields.length === 1 ? 'match' : 'matches'} on file</Text>
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
          <Text style={styles.addRowText}>Add New Match</Text>
        </Pressable>
      </View>

      {isLocked ? (
        <Text style={styles.lockedHint}>Save your profile to add another match.</Text>
      ) : null}

      {sessionRow ? (
        <StatDataTable columns={SESSION_COLUMNS} rows={[sessionRow as unknown as Record<string, unknown>]} onEditRow={() => setModalVisible(true)} />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={22} color={colors.textFaint} />
          <Text style={styles.emptyText}>
            {matchFields.length === 0
              ? 'No match added yet — tap "Add New Match" to log Batting, Bowling and Fielding for one match.'
              : 'No match added yet this session — tap "Add New Match" to add one.'}
          </Text>
        </View>
      )}

      <AddCricketMatchModal
        visible={isModalVisible}
        title={sessionRow ? 'Edit Match' : 'Add New Match'}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        emptyRow={emptyMatchRow}
        initialRow={sessionRow ?? undefined}
        saveLabel={sessionRow ? 'Save Changes' : 'Add Match'}
        formats={formats}
        categories={categories}
        existingEntries={existingEntries}
        onUploadScoreSheet={onUploadScoreSheet}
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
