import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { StatCell, StatColumn } from './StatTable';
import { Dropdown, DropdownOption } from './Dropdown';
import { CricketRecentMatchRowForm } from '../../types';

/** "76*" when not out, otherwise a plain "76" — mirrors how a career row's
 * own `hs` carries the not-out marker (see statMerge.best()), so this
 * match's contribution compares correctly against the career-best. */
function computeHs(runs: string, notOut: boolean): string {
  if (!runs.trim()) return '';
  return notOut ? `${runs}*` : runs;
}

/** "3/25" — a single match only ever has one bowling spell here, so BBI and
 * BBM (best-in-innings / best-in-match) are always the same figure. */
function computeBowlingFigures(wickets: string, runsConceded: string): string {
  if (!wickets.trim() && !runsConceded.trim()) return '';
  return `${wickets || '0'}/${runsConceded || '0'}`;
}

/** One batting innings entered this match — only Runs/Balls/Not Out are
 * tracked per innings (see below); 4s/6s/Ct/St stay match-level totals. */
interface BattingInningsEntry {
  runs: string;
  balls: string;
  not_out: boolean;
}

const EMPTY_INNINGS_ENTRY: BattingInningsEntry = { runs: '', balls: '', not_out: false };

/** Seeds the per-innings rows from `row.batting_innings` (clamped 1–10).
 * Older/existing rows only ever stored one combined Runs/Balls/Not-Out
 * figure (there was no per-innings breakdown before this), so on edit only
 * the first innings is pre-filled from that — the rest start blank for the
 * player to re-enter if this match really covers more than one innings. */
function initBattingInningsRows(row: CricketRecentMatchRowForm): BattingInningsEntry[] {
  const count = Math.max(1, Math.min(10, parseInt(row.batting_innings || '1', 10) || 1));
  const rows: BattingInningsEntry[] = Array.from({ length: count }, () => ({ ...EMPTY_INNINGS_ENTRY }));
  rows[0] = { runs: row.runs || '', balls: row.balls || '', not_out: !!row.not_out };
  return rows;
}

/** Sums Runs/Balls across every innings entered, and picks the Highest
 * Score: the innings with the most runs, ties going to whichever of those
 * was not out (matches statMerge's own HS-comparison convention). */
function aggregateBattingInnings(rows: BattingInningsEntry[]): {
  runs: string;
  balls: string;
  hs: string;
  not_out: boolean;
} {
  let totalRuns = 0;
  let totalBalls = 0;
  let anyRuns = false;
  let anyBalls = false;
  let bestRow: BattingInningsEntry | null = null;

  rows.forEach((entry) => {
    if (entry.runs.trim() !== '') {
      anyRuns = true;
      totalRuns += parseInt(entry.runs, 10) || 0;
    }
    if (entry.balls.trim() !== '') {
      anyBalls = true;
      totalBalls += parseInt(entry.balls, 10) || 0;
    }
    if (!entry.runs.trim()) return;
    const runsNum = parseInt(entry.runs, 10) || 0;
    const bestRuns = bestRow ? parseInt(bestRow.runs, 10) || 0 : -1;
    if (!bestRow || runsNum > bestRuns || (runsNum === bestRuns && entry.not_out && !bestRow.not_out)) {
      bestRow = entry;
    }
  });

  return {
    runs: anyRuns ? String(totalRuns) : '',
    balls: anyBalls ? String(totalBalls) : '',
    hs: bestRow ? computeHs((bestRow as BattingInningsEntry).runs, (bestRow as BattingInningsEntry).not_out) : '',
    not_out: bestRow ? (bestRow as BattingInningsEntry).not_out : false,
  };
}

/** One Format+Category+Year combination the player already has a Career
 * Stats entry for — offered in the "Which Entry?" list so picking one
 * updates it instead of starting a new one. */
export interface ExistingCricketEntry {
  age_category_id: string;
  format_id: string;
  year: string;
}

type Step = 'choice' | 'existing' | 'select' | 'detail' | 'preview';

interface AddCricketMatchModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: (row: CricketRecentMatchRowForm) => void;
  emptyRow: CricketRecentMatchRowForm;
  /** "Format" options (age_category_id) — the big Under 13 Div I / Premier /
   * Academy / ... list. */
  formats: DropdownOption[];
  /** "Category" options (format_id) — Six a side / T20 / 50 Over / Test / ... */
  categories: DropdownOption[];
  /** Every Format+Category+Year the player already has a Career Stats entry
   * for — picking one in "Which Entry?" merges this match's numbers into it
   * instead of starting a new one (same rule as before this was one combined
   * form: see CareerStatAddModal's old Category+Division picker). */
  existingEntries: ExistingCricketEntry[];
  /** Pre-fills the form for correcting the match already added this session,
   * instead of adding a new one — Format/Category/Year are shown read-only
   * (not re-pickable), same as the old flow's `editRow`, since changing them
   * would mean re-deciding which aggregate row this merges into. */
  initialRow?: CricketRecentMatchRowForm;
  saveLabel?: string;
}

/**
 * One match's complete Batting + Fielding + Bowling detail, collected in a
 * single flow — replaces what used to be three separate "Add" flows
 * (Batting Career Stat, Bowling Career Stat, Recent Match). Format+Category+
 * Year is decided first, exactly like the old Career Stat "Add New Stat"
 * wizard: if the player already has entries, they choose whether this match
 * belongs to one of them (updates it) or is a new Format+Category (and
 * picking one already on file for the same Year is blocked — go through
 * "Update an Existing Entry" for that instead). Only after that does the
 * match-detail form (Ground, Batting & Fielding, Bowling) appear, followed
 * by a Preview step before anything is actually added.
 *
 * Strike Rate/Economy/Average for the *career* totals this feeds into are
 * still derived only from the merged cumulative numbers (see
 * statMerge.mergeBattingRows/mergeBowlingRows, unchanged) — this modal only
 * auto-fills the two figures that are this single match's own (HS, BBI/BBM),
 * both still editable if the player wants to correct them.
 */
export function AddCricketMatchModal(props: AddCricketMatchModalProps) {
  const { visible, onClose } = props;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      {visible ? <AddCricketMatchModalBody {...props} /> : null}
    </Modal>
  );
}

function AddCricketMatchModalBody({
  title,
  onClose,
  onSave,
  emptyRow,
  formats,
  categories,
  existingEntries,
  initialRow,
  saveLabel = 'Add Match',
}: AddCricketMatchModalProps) {
  const isEditing = !!initialRow;
  const hasEntries = existingEntries.length > 0;
  const [step, setStep] = useState<Step>(isEditing ? 'detail' : hasEntries ? 'choice' : 'select');
  const [origin, setOrigin] = useState<'select' | 'existing'>('select');
  const [row, setRow] = useState<CricketRecentMatchRowForm>(() => ({ ...(initialRow ?? emptyRow) }));
  // Per-innings batting breakdown driving Runs/Balls/HS on `row` (see
  // aggregateBattingInnings) — one card per innings once "Inns" is 2 or
  // more, so the player enters each innings separately and the highest one
  // is picked for HS automatically instead of being typed in by hand.
  const [battingInningsRows, setBattingInningsRows] = useState<BattingInningsEntry[]>(() =>
    initBattingInningsRows(initialRow ?? emptyRow)
  );

  const update = <K extends keyof CricketRecentMatchRowForm>(key: K, value: CricketRecentMatchRowForm[K]) => {
    setRow((prev) => ({ ...prev, [key]: value }));
  };

  /** "Inns" changed — resize the per-innings rows to match (trimming from
   * the end, or padding with blank innings), then re-derive Runs/Balls/HS. */
  const updateBattingInningsCount = (value: string) => {
    update('batting_innings', value);
    const count = Math.max(1, Math.min(10, parseInt(value || '1', 10) || 1));
    setBattingInningsRows((prev) => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push({ ...EMPTY_INNINGS_ENTRY });
      const aggregate = aggregateBattingInnings(next);
      setRow((row) => ({ ...row, ...aggregate }));
      return next;
    });
  };

  const updateBattingInningsField = (index: number, patch: Partial<BattingInningsEntry>) => {
    setBattingInningsRows((prev) => {
      const next = prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry));
      const aggregate = aggregateBattingInnings(next);
      setRow((row) => ({ ...row, ...aggregate }));
      return next;
    });
  };

  const updateWickets = (value: string) => {
    setRow((prev) => {
      const figures = computeBowlingFigures(value, prev.bowling_runs);
      return { ...prev, wickets: value, bbi: figures, bbm: figures };
    });
  };
  const updateBowlingRuns = (value: string) => {
    setRow((prev) => {
      const figures = computeBowlingFigures(prev.wickets, value);
      return { ...prev, bowling_runs: value, bbi: figures, bbm: figures };
    });
  };

  const labelFor = (options: DropdownOption[], id: string) => options.find((o) => o.value === id)?.label ?? '—';
  const formatLabel = labelFor(formats, row.age_category_id);
  const categoryLabel = labelFor(categories, row.format_id);
  const entryLabel = row.age_category_id && row.format_id ? `${formatLabel} · ${categoryLabel}` : '—';

  const hasExistingEntry = (formatId: string, categoryId: string, year: string) =>
    existingEntries.some((e) => e.age_category_id === formatId && e.format_id === categoryId && e.year === year);
  // A brand-new entry is always tagged with the current year — recomputed on
  // every render (not read from `row.year`) so it can't go stale if the app
  // is left open across a year boundary, and never free-typed since it's
  // shown read-only in the 'select' step below.
  const currentYear = String(new Date().getFullYear());
  const identitySatisfied = !!row.age_category_id && !!row.format_id;
  const alreadyExists = identitySatisfied && hasExistingEntry(row.age_category_id, row.format_id, currentYear);

  const pickExisting = (entry: ExistingCricketEntry) => {
    setRow((prev) => ({ ...prev, age_category_id: entry.age_category_id, format_id: entry.format_id, year: entry.year }));
    setOrigin('existing');
    setStep('detail');
  };

  const formatCol: StatColumn = { key: 'age_category_id', label: 'Format', type: 'select', options: formats };
  const categoryCol: StatColumn = { key: 'format_id', label: 'Category', type: 'select', options: categories };

  const handleBack = () => {
    if (step === 'detail') {
      setStep(origin);
    } else {
      setStep('choice');
    }
  };

  const showBack = !isEditing && (
    step === 'existing' ||
    (step === 'select' && hasEntries) ||
    step === 'detail'
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={step === 'preview' ? () => setStep('detail') : showBack ? handleBack : onClose} hitSlop={10} accessibilityRole="button">
          <Ionicons name={step === 'preview' || showBack ? 'chevron-back' : 'close'} size={24} color={colors.text} />
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
        {step === 'choice' ? (
          <>
            <Text style={styles.stepTitle}>Update or Add New?</Text>
            <Text style={styles.stepSubtitle}>
              You already have entries for this player. Is this match for one of them, or a new Format + Category?
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
                <Text style={styles.choiceSubtitle}>Log a Format + Category you haven&rsquo;t used before.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </Pressable>
          </>
        ) : step === 'existing' ? (
          <>
            <Text style={styles.stepTitle}>Which Entry?</Text>
            <Text style={styles.stepSubtitle}>Pick the Format + Category + Year this match belongs to.</Text>

            {existingEntries.map((entry, index) => (
              <Pressable
                key={index}
                onPress={() => pickExisting(entry)}
                style={[styles.choiceCard, shadows.sm]}
                accessibilityRole="button"
              >
                <View style={styles.choiceTextWrap}>
                  <Text style={styles.choiceTitle}>
                    {labelFor(formats, entry.age_category_id)} · {labelFor(categories, entry.format_id)}
                  </Text>
                  <Text style={styles.choiceSubtitle}>{entry.year}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </Pressable>
            ))}

            <Pressable
              onPress={() => setStep('select')}
              style={styles.addToggle}
              accessibilityRole="button"
            >
              <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
              <Text style={styles.addToggleText}>None of these — add a new entry instead</Text>
            </Pressable>
          </>
        ) : step === 'select' ? (
          <>
            <Text style={styles.stepTitle}>Select Format</Text>
            <Text style={styles.stepSubtitle}>Choose the Format and Category this match was played in, and the Year it belongs to.</Text>

            <Dropdown label="Format" value={row.age_category_id} onChange={(v) => update('age_category_id', v)} options={formats} placeholder="Select format" />
            <Dropdown label="Category" value={row.format_id} onChange={(v) => update('format_id', v)} options={categories} placeholder="Select category" />
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel} numberOfLines={1}>Year</Text>
              <View style={styles.yearLockedBox}>
                <Text style={styles.yearLockedText}>{currentYear}</Text>
                <Ionicons name="lock-closed-outline" size={14} color={colors.textFaint} />
              </View>
              <Text style={styles.fieldHint}>A new entry is always logged under the current year.</Text>
            </View>

            {identitySatisfied ? (
              alreadyExists ? (
                <View style={[styles.hintCard, styles.hintCardError]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.live} />
                  <Text style={styles.hintText}>
                    {`You already have a ${currentYear} entry for ${entryLabel}. Go back and choose "Update an Existing Entry" to add this match's stats to it — a new entry can only be a Format + Category + Year you haven't used before.`}
                  </Text>
                </View>
              ) : (
                <View style={[styles.hintCard, styles.hintCardNew]}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                  <Text style={styles.hintText}>This will create a new entry for {entryLabel} · {currentYear}.</Text>
                </View>
              )
            ) : null}

            <Pressable
              onPress={() => { update('year', currentYear); setOrigin('select'); setStep('detail'); }}
              disabled={!identitySatisfied || alreadyExists}
              style={[styles.nextButton, (!identitySatisfied || alreadyExists) && styles.nextButtonDisabled]}
              accessibilityRole="button"
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </Pressable>
          </>
        ) : step === 'detail' ? (
          <>
            <Text style={styles.identityChip}>{entryLabel} · {row.year}</Text>

            <Text style={styles.sectionTitle}>Match Details</Text>
            <View style={styles.grid}>
              <Field label="Date" wide>
                <StatCell column={{ key: 'match_date', label: 'Date', type: 'date' }} value={row.match_date} onChange={(v) => update('match_date', v as string)} />
              </Field>
              <Field label="Match vs" wide>
                <StatCell column={{ key: 'opponent', label: 'Match vs', type: 'text' }} value={row.opponent} onChange={(v) => update('opponent', v as string)} />
              </Field>
              <Field label="Ground" wide>
                <StatCell column={{ key: 'ground', label: 'Ground', type: 'text' }} value={row.ground} onChange={(v) => update('ground', v as string)} />
              </Field>
            </View>

            <Text style={styles.sectionTitle}>Batting & Fielding</Text>
            <View style={styles.grid}>
              <Field label="Inns">
                <StatCell column={{ key: 'batting_innings', label: 'Inns', type: 'number' }} value={row.batting_innings} onChange={(v) => updateBattingInningsCount(v as string)} />
              </Field>
            </View>

            {/* One card per innings — added/removed automatically as "Inns"
                above changes. Runs/Balls/Not Out are entered here per innings;
                everything else stays a single match-level total below. */}
            {battingInningsRows.map((innings, index) => (
              <View key={index} style={styles.inningsCard}>
                {battingInningsRows.length > 1 ? (
                  <Text style={styles.inningsLabel}>Innings {index + 1}</Text>
                ) : null}
                <View style={styles.grid}>
                  <Field label="Runs">
                    <StatCell
                      column={{ key: `innings_${index}_runs`, label: 'Runs', type: 'number' }}
                      value={innings.runs}
                      onChange={(v) => updateBattingInningsField(index, { runs: v as string })}
                    />
                  </Field>
                  <Field label="Balls">
                    <StatCell
                      column={{ key: `innings_${index}_balls`, label: 'Balls', type: 'number' }}
                      value={innings.balls}
                      onChange={(v) => updateBattingInningsField(index, { balls: v as string })}
                    />
                  </Field>
                  <Field label="Not Out">
                    <StatCell
                      column={{ key: `innings_${index}_not_out`, label: 'Not Out', type: 'boolean' }}
                      value={innings.not_out}
                      onChange={(v) => updateBattingInningsField(index, { not_out: v as boolean })}
                    />
                  </Field>
                </View>
              </View>
            ))}

            <View style={styles.grid}>
              <Field label="HS" hint="Auto-filled — highest score across innings">
                <StatCell column={{ key: 'hs', label: 'HS', type: 'text' }} value={row.hs} onChange={(v) => update('hs', v as string)} />
              </Field>
              <Field label="4s">
                <StatCell column={{ key: 'fours', label: '4s', type: 'number' }} value={row.fours} onChange={(v) => update('fours', v as string)} />
              </Field>
              <Field label="6s">
                <StatCell column={{ key: 'sixes', label: '6s', type: 'number' }} value={row.sixes} onChange={(v) => update('sixes', v as string)} />
              </Field>
              <Field label="100">
                <StatCell column={{ key: 'hundreds', label: '100', type: 'boolean' }} value={row.hundreds} onChange={(v) => update('hundreds', v as boolean)} />
              </Field>
              <Field label="50">
                <StatCell column={{ key: 'fifties', label: '50', type: 'boolean' }} value={row.fifties} onChange={(v) => update('fifties', v as boolean)} />
              </Field>
              <Field label="Ct">
                <StatCell column={{ key: 'catches', label: 'Ct', type: 'number' }} value={row.catches} onChange={(v) => update('catches', v as string)} />
              </Field>
              <Field label="St">
                <StatCell column={{ key: 'stumpings', label: 'St', type: 'number' }} value={row.stumpings} onChange={(v) => update('stumpings', v as string)} />
              </Field>
            </View>

            <Text style={styles.sectionTitle}>Bowling</Text>
            <View style={styles.grid}>
              <Field label="Inns">
                <StatCell column={{ key: 'bowling_innings', label: 'Inns', type: 'number' }} value={row.bowling_innings} onChange={(v) => update('bowling_innings', v as string)} />
              </Field>
              <Field label="Balls">
                <StatCell column={{ key: 'bowling_balls', label: 'Balls', type: 'number' }} value={row.bowling_balls} onChange={(v) => update('bowling_balls', v as string)} />
              </Field>
              <Field label="Runs">
                <StatCell column={{ key: 'bowling_runs', label: 'Runs', type: 'number' }} value={row.bowling_runs} onChange={(v) => updateBowlingRuns(v as string)} />
              </Field>
              <Field label="Wkts">
                <StatCell column={{ key: 'wickets', label: 'Wkts', type: 'number' }} value={row.wickets} onChange={(v) => updateWickets(v as string)} />
              </Field>
              <Field label="BBI" hint="Auto-filled from Wkts/Runs">
                <StatCell column={{ key: 'bbi', label: 'BBI', type: 'text' }} value={row.bbi} onChange={(v) => update('bbi', v as string)} />
              </Field>
              <Field label="BBM" hint="Auto-filled from Wkts/Runs">
                <StatCell column={{ key: 'bbm', label: 'BBM', type: 'text' }} value={row.bbm} onChange={(v) => update('bbm', v as string)} />
              </Field>
              <Field label="3W">
                <StatCell column={{ key: 'three_w', label: '3W', type: 'boolean' }} value={row.three_w} onChange={(v) => update('three_w', v as boolean)} />
              </Field>
              <Field label="4W">
                <StatCell column={{ key: 'four_w', label: '4W', type: 'boolean' }} value={row.four_w} onChange={(v) => update('four_w', v as boolean)} />
              </Field>
              <Field label="5W">
                <StatCell column={{ key: 'five_w', label: '5W', type: 'boolean' }} value={row.five_w} onChange={(v) => update('five_w', v as boolean)} />
              </Field>
              <Field label="10W">
                <StatCell column={{ key: 'ten_w', label: '10W', type: 'boolean' }} value={row.ten_w} onChange={(v) => update('ten_w', v as boolean)} />
              </Field>
            </View>

            <Pressable onPress={() => setStep('preview')} style={styles.nextButton} accessibilityRole="button">
              <Text style={styles.nextButtonText}>Preview</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Review Match</Text>
            <Text style={styles.previewSubtitle}>
              This match adds to {entryLabel} · {row.year} in your Career Stats, and appears in Recent Matches. Tap
              Edit to change anything.
            </Text>

            <PreviewSection title="Match Details">
              <PreviewRow label="Format" value={formatLabel} />
              <PreviewRow label="Category" value={categoryLabel} />
              <PreviewRow label="Year" value={row.year || '—'} />
              <PreviewRow label="Date" value={row.match_date || '—'} />
              <PreviewRow label="Match vs" value={row.opponent || '—'} />
              <PreviewRow label="Ground" value={row.ground || '—'} />
            </PreviewSection>

            <PreviewSection title="Batting & Fielding">
              <PreviewRow label="Innings" value={row.batting_innings || '—'} />
              <PreviewRow label="Runs" value={row.runs || '0'} />
              <PreviewRow label="Not Out" value={row.not_out ? 'Yes' : 'No'} />
              <PreviewRow label="Balls" value={row.balls || '0'} />
              <PreviewRow label="HS" value={row.hs || '—'} />
              <PreviewRow label="4s / 6s" value={`${row.fours || '0'} / ${row.sixes || '0'}`} />
              <PreviewRow label="100 / 50" value={`${row.hundreds ? 'Yes' : 'No'} / ${row.fifties ? 'Yes' : 'No'}`} />
              <PreviewRow label="Catches / Stumpings" value={`${row.catches || '0'} / ${row.stumpings || '0'}`} />
            </PreviewSection>

            <PreviewSection title="Bowling">
              <PreviewRow label="Innings" value={row.bowling_innings || '—'} />
              <PreviewRow label="Balls" value={row.bowling_balls || '0'} />
              <PreviewRow label="Runs" value={row.bowling_runs || '0'} />
              <PreviewRow label="Wickets" value={row.wickets || '0'} />
              <PreviewRow label="BBI / BBM" value={`${row.bbi || '—'} / ${row.bbm || '—'}`} />
              <PreviewRow
                label="3W / 4W / 5W / 10W"
                value={`${row.three_w ? 'Yes' : 'No'} / ${row.four_w ? 'Yes' : 'No'} / ${row.five_w ? 'Yes' : 'No'} / ${row.ten_w ? 'Yes' : 'No'}`}
              />
            </PreviewSection>

            <View style={styles.previewActionsRow}>
              <Pressable onPress={() => setStep('detail')} style={styles.editButton} accessibilityRole="button">
                <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => onSave(row)} style={styles.confirmButton} accessibilityRole="button">
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                <Text style={styles.nextButtonText}>{saveLabel}</Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.fieldWrapper, wide && styles.fieldWrapperWide]}>
      <Text style={styles.fieldLabel} numberOfLines={1}>{label}</Text>
      {children}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.previewSection}>
      <Text style={styles.previewSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewRow}>
      <Text style={styles.previewRowLabel}>{label}</Text>
      <Text style={styles.previewRowValue} numberOfLines={1}>{value}</Text>
    </View>
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
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  yearLockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.cardSubtle,
    height: 50,
    paddingHorizontal: spacing.sm,
  },
  yearLockedText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  identityChip: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: colors.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
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
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  inningsCard: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  inningsLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldWrapper: {
    minWidth: 100,
    flexGrow: 1,
  },
  fieldWrapperWide: {
    minWidth: 160,
    flexBasis: '100%',
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: 11,
    marginBottom: 4,
  },
  fieldHint: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 10,
    marginTop: 2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 50,
    marginTop: spacing.md,
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
  previewSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 17,
  },
  previewSection: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewSectionTitle: {
    ...typography.overline,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  previewRowLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  previewRowValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    flexShrink: 1,
    marginLeft: spacing.sm,
  },
  previewActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.full,
    height: 50,
    paddingHorizontal: spacing.lg,
  },
  editButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 50,
    ...shadows.sm,
  },
});
