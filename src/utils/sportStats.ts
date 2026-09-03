import { CricketAnalysisResponse } from '../types/cricketAnalysis';
import { SportAnalysisResponse } from '../types/sportAnalysis';

export interface HeadlineStat {
  label: string;
  value: string;
}

/** 'win_percentage' -> 'Win %', 'assist_goals' -> 'Assist Goals'. */
function humanizeStatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\bpercentage\b/i, '%')
    .split(' ')
    .map((word) => (word === '%' ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
    .trim();
}

function formatStatValue(key: string, value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  if (/percentage/i.test(key)) return `${Math.round(value)}%`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * The 3 headline numbers shown on a stat-tile row (Player Profile tab's
 * player card, Home's Performance Analytics) — a FotMob-style "Age / Games
 * / Goals" strip, adapted to what's actually available generically: a
 * per-sport Age tile would need a separate profile fetch per sport (each
 * has its own shape — fetchCricketProfile vs fetchHockeyProfile, etc., no
 * generic equivalent), so this sticks to 3 real analysis numbers instead.
 * Cricket has a fixed overview shape; every other supported sport's is an
 * open record keyed per SportAnalysisConfig on the backend — so the generic
 * path just takes the first three entries rather than needing a label map
 * per sport.
 */
export function headlineStatsForCricket(overview: CricketAnalysisResponse['overview'] | undefined): HeadlineStat[] {
  if (!overview) return [];
  return [
    { label: 'Matches', value: formatStatValue('matches', overview.matches) },
    { label: 'Runs', value: formatStatValue('runs', overview.runs) },
    { label: 'Wickets', value: formatStatValue('wickets', overview.wickets) },
  ];
}

export function headlineStatsForSport(overview: SportAnalysisResponse['overview'] | undefined): HeadlineStat[] {
  if (!overview) return [];
  return Object.entries(overview)
    .slice(0, 3)
    .map(([key, value]) => ({ label: humanizeStatKey(key), value: formatStatValue(key, value) }));
}
