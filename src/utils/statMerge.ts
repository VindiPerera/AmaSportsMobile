import { CricketBattingRowForm, CricketBowlingRowForm } from '../types';

/**
 * Merge rules for combining a newly-entered Career Stat entry into an
 * existing one for the same Category+Division (see CareerStatTable /
 * cricket.tsx's "Add New Batting/Bowling Stat" flow — spec: adding a match
 * in a Category+Division you've already logged sums into that entry instead
 * of creating a duplicate).
 */

function toNum(value: string | undefined | null): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Adds two count-like fields; stays blank if both sides were blank rather
 * than turning an untouched column into a "0". */
function sum(a: string, b: string): string {
  if ((a ?? '').trim() === '' && (b ?? '').trim() === '') return '';
  return String(toNum(a) + toNum(b));
}

/** Pulls the leading number out of a stat that carries cricket notation
 * around it — "102*" (not-out marker), "4/25" (wickets/runs figures) — so
 * "career-best" fields can be compared numerically. */
function leadingNumber(value: string): number | null {
  const match = (value ?? '').match(/\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = parseFloat(match[0]);
  return Number.isNaN(parsed) ? null : parsed;
}

/** Keeps whichever of two "career-best" figures (HS, Best, BBI, BBM) is
 * higher, preserving the winner's original text (e.g. the "*" on a HS). */
function best(a: string, b: string): string {
  const an = leadingNumber(a);
  const bn = leadingNumber(b);
  if (an === null) return b ?? '';
  if (bn === null) return a ?? '';
  return bn > an ? b : a;
}

/** Prefers the newly-entered value, falling back to the existing one — used
 * for fields that aren't summable/comparable (e.g. Strike Rate, which can't
 * be recomputed from the columns this form tracks) and for the non-key
 * selects (Format/Match Category) that just reflect the latest match. */
function newest(existing: string, incoming: string): string {
  return (incoming ?? '').trim() !== '' ? incoming : existing;
}

function round2(value: number): string {
  return value.toFixed(2);
}

/**
 * Merges `incoming` into `existing` for Batting Career Stats. Counts add up;
 * HS/Best take the higher of the two; Average is recalculated from the
 * merged Runs/Innings/Not-Out (summing an average would be meaningless).
 * Strike Rate can't be recomputed here — career rows don't track balls
 * faced — so the newest entered value wins.
 */
export function mergeBattingRows(
  existing: CricketBattingRowForm,
  incoming: CricketBattingRowForm
): CricketBattingRowForm {
  const merged: CricketBattingRowForm = {
    ...existing,
    year: newest(existing.year, incoming.year),
    cricket_match_type_id: newest(existing.cricket_match_type_id, incoming.cricket_match_type_id),
    match_category_id: newest(existing.match_category_id, incoming.match_category_id),
    matches: sum(existing.matches, incoming.matches),
    won: sum(existing.won, incoming.won),
    lost: sum(existing.lost, incoming.lost),
    innings: sum(existing.innings, incoming.innings),
    not_out: sum(existing.not_out, incoming.not_out),
    runs: sum(existing.runs, incoming.runs),
    hs: best(existing.hs, incoming.hs),
    best: best(existing.best, incoming.best),
    sr: newest(existing.sr, incoming.sr),
    hundreds: sum(existing.hundreds, incoming.hundreds),
    fifties: sum(existing.fifties, incoming.fifties),
    fours: sum(existing.fours, incoming.fours),
    sixes: sum(existing.sixes, incoming.sixes),
    catches: sum(existing.catches, incoming.catches),
    stumpings: sum(existing.stumpings, incoming.stumpings),
    run_outs: sum(existing.run_outs, incoming.run_outs),
    direct_hits: sum(existing.direct_hits, incoming.direct_hits),
    runs_saved: sum(existing.runs_saved, incoming.runs_saved),
    runs_giving: sum(existing.runs_giving, incoming.runs_giving),
    stumps_missing: sum(existing.stumps_missing, incoming.stumps_missing),
  };

  const dismissals = toNum(merged.innings) - toNum(merged.not_out);
  if (dismissals > 0) {
    merged.average = round2(toNum(merged.runs) / dismissals);
  }

  return merged;
}

/**
 * Merges `incoming` into `existing` for Bowling Career Stats. Counts add up;
 * BBI/BBM take the better figure; Average, Economy and Strike Rate are all
 * recalculated from the merged Runs/Balls/Wickets rather than summed.
 */
export function mergeBowlingRows(
  existing: CricketBowlingRowForm,
  incoming: CricketBowlingRowForm
): CricketBowlingRowForm {
  const merged: CricketBowlingRowForm = {
    ...existing,
    year: newest(existing.year, incoming.year),
    cricket_match_type_id: newest(existing.cricket_match_type_id, incoming.cricket_match_type_id),
    match_category_id: newest(existing.match_category_id, incoming.match_category_id),
    matches: sum(existing.matches, incoming.matches),
    innings: sum(existing.innings, incoming.innings),
    balls: sum(existing.balls, incoming.balls),
    dot_balls: sum(existing.dot_balls, incoming.dot_balls),
    wide_balls: sum(existing.wide_balls, incoming.wide_balls),
    no_balls: sum(existing.no_balls, incoming.no_balls),
    runs: sum(existing.runs, incoming.runs),
    wickets: sum(existing.wickets, incoming.wickets),
    bbi: best(existing.bbi, incoming.bbi),
    bbm: best(existing.bbm, incoming.bbm),
    four_w: sum(existing.four_w, incoming.four_w),
    five_w: sum(existing.five_w, incoming.five_w),
    ten_w: sum(existing.ten_w, incoming.ten_w),
  };

  const wickets = toNum(merged.wickets);
  const balls = toNum(merged.balls);
  const runs = toNum(merged.runs);
  if (wickets > 0) {
    merged.average = round2(runs / wickets);
    merged.sr = round2(balls / wickets);
  }
  if (balls > 0) {
    merged.economy = round2(runs / (balls / 6));
  }

  return merged;
}

/**
 * The Category+Division+Year combination that identifies a Career Stat
 * entry — two entries with the same key merge instead of duplicating. Year
 * is part of the key (not just a field on the row): U13 · Div IV · 2026 and
 * U13 · Div IV · 2027 are two separate entries, but adding another U13 ·
 * Div IV match within 2026 merges into that same 2026 entry.
 */
export function entryKey(row: { age_category_id: string; format_id: string; year: string }): string {
  return `${row.age_category_id}|${row.format_id}|${row.year}`;
}
