import { athleticsService } from '../services/athleticsService';
import { baseBallService } from '../services/baseBallService';
import { basketballService } from '../services/basketballService';
import { beachVolleyballService } from '../services/beachVolleyballService';
import { boxingService } from '../services/boxingService';
import { chessService } from '../services/chessService';
import { elleService } from '../services/elleService';
import { footballService } from '../services/footballService';
import { judoService } from '../services/judoService';
import { kabadiService } from '../services/kabadiService';
import { karateService } from '../services/karateService';
import { netBallService } from '../services/netBallService';
import { playerService } from '../services/playerService';
import { racketSportService } from '../services/racketSportService';
import { rugbyService } from '../services/rugbyService';
import { softBallCricketService } from '../services/softBallCricketService';
import { swimmingService } from '../services/swimmingService';
import { volleyballService } from '../services/volleyballService';
import { Lookups } from '../types';
import { DetailFieldItem, PersonalBestItem, StatCardConfig, StatTableColumn } from '../components/player/PlayerSportDetailView';

/** How a recent-history row's "Result" column (WIN/LOSS/...) is derived —
 * every non-cricket sport form collects this as boolean flags or a placing,
 * never a precomputed label, so the view has to compute it (see StoreX
 * ProfileRequest validation on the backend — always `win`/`lost` booleans
 * or a numeric `place`, never a `result` string). */
type ResultMode = 'win_lost' | 'won_lost' | 'win_lost_drawn' | 'won_lost_draw_noresult' | 'place_medal' | 'place_rank';

interface TableConfig {
  /** Field name on the raw profile response (e.g. 'career_stats', 'recent_fights'). */
  key: string;
  header: string;
  columns: StatTableColumn[];
  /** True when any of format_id/age_category_id/match_category_id appear in
   * `columns` — resolved against the shared `lookups` (not sport-specific
   * tables like Cricket's own cricket_categories/cricket_divisions). */
  usesLookups?: boolean;
  resultMode?: ResultMode;
}

export interface SportDetailConfig {
  sportName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchProfile: () => Promise<any>;
  overviewFields: { key: string; label: string; lookupList?: keyof Lookups }[];
  hasTeams: boolean;
  /** Athletics/Swimming only — raw array field name + which event lookup
   * list its `*_event_id` resolves against. */
  personalBests?: { key: string; eventIdKey: string; lookupList: keyof Lookups; valueKey: string };
  statTables: TableConfig[];
  recentTables: TableConfig[];
}

/** Every value on `row` stringified (Cricket's form types are all-string,
 * like every other sport form — the API returns numbers/null, so this
 * bridges a raw API row into that shape without hand-copying Cricket's ~15
 * batting/bowling field names here too; the API already returns every
 * column the model has, so nothing is silently dropped). */
export function mapAllToStrings(row: Record<string, unknown>): Record<string, string> {
  const mapped: Record<string, string> = {};
  Object.entries(row).forEach(([key, value]) => {
    mapped[key] = value === null || value === undefined ? '' : String(value);
  });
  return mapped;
}

function resolveLookupLabel(list: unknown, id: unknown): string {
  if (id === null || id === undefined || id === '' || !Array.isArray(list)) return '-';
  const found = (list as Array<{ id: number; name?: string; label?: string }>).find(
    (o) => String(o.id) === String(id)
  );
  return found ? (found.name ?? found.label ?? '-') : '-';
}

function computeResult(row: Record<string, unknown>, mode: ResultMode): string {
  switch (mode) {
    case 'win_lost':
      return row.win ? 'WIN' : row.lost ? 'LOSS' : '-';
    case 'won_lost':
      return row.won ? 'WIN' : row.lost ? 'LOSS' : '-';
    case 'win_lost_drawn':
      return row.win ? 'WIN' : row.lost ? 'LOSS' : row.drawn ? 'DRAW' : '-';
    case 'won_lost_draw_noresult':
      return row.won ? 'WIN' : row.lost ? 'LOSS' : row.draw ? 'DRAW' : row.no_result ? 'NR' : '-';
    case 'place_medal': {
      const place = Number(row.place);
      return place === 1 ? 'GOLD' : place === 2 ? 'SILVER' : place === 3 ? 'BRONZE' : row.place ? `Rank ${row.place}` : '-';
    }
    case 'place_rank':
      return row.place ? `Rank ${row.place}` : '-';
    default:
      return '-';
  }
}

/** Career/Recent table columns come straight from each sport's own form
 * (see SportDetailConfig above) — format_id/age_category_id/match_category_id
 * are resolved to names here (they arrive as raw ids), and a `result`
 * column is computed here too when the table config asks for one. Every
 * other column is passed through as-is; DataTable stringifies it. */
function mapRows(rows: unknown, table: TableConfig, lookups: Lookups): Record<string, unknown>[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row: Record<string, unknown>) => {
    const mapped: Record<string, unknown> = { ...row };
    if (table.usesLookups) {
      if ('format_id' in row) mapped.format_id = resolveLookupLabel(lookups.formats, row.format_id);
      if ('age_category_id' in row) mapped.age_category_id = resolveLookupLabel(lookups.age_categories, row.age_category_id);
      if ('match_category_id' in row) mapped.match_category_id = resolveLookupLabel(lookups.match_categories, row.match_category_id);
    }
    if (table.resultMode) mapped.result = computeResult(row, table.resultMode);
    return mapped;
  });
}

function buildStatCards(profile: Record<string, unknown>, tables: TableConfig[], lookups: Lookups): StatCardConfig[] {
  return tables.map((table) => ({
    header: table.header,
    columns: table.columns,
    rows: mapRows(profile[table.key], table, lookups),
  }));
}

/**
 * Turns a sport's raw profile response + shared lookups into everything
 * PlayerSportDetailView needs beyond identity (fullName/country/photo —
 * those come from the player's own shared profile, not this per-sport one).
 */
export function buildSportDetailProps(
  config: SportDetailConfig,
  profile: Record<string, unknown>,
  lookups: Lookups
): {
  born: string | null;
  age: string | number | null;
  teams: string[];
  fields: DetailFieldItem[];
  personalBests: PersonalBestItem[];
  statCards: StatCardConfig[];
  recentCards: StatCardConfig[];
} {
  const fields: DetailFieldItem[] = config.overviewFields
    .filter((f) => f.key !== 'born' && f.key !== 'age')
    .map((f) => ({
      label: f.label,
      value: f.lookupList
        ? resolveLookupLabel(lookups[f.lookupList], profile[f.key])
        : (profile[f.key] as string | null | undefined) ?? null,
    }));

  const personalBests: PersonalBestItem[] = config.personalBests
    ? ((profile[config.personalBests.key] as Record<string, unknown>[] | undefined) ?? []).map((row) => ({
        label: resolveLookupLabel(lookups[config.personalBests!.lookupList], row[config.personalBests!.eventIdKey]),
        value: String(row[config.personalBests!.valueKey] ?? '-'),
      }))
    : [];

  return {
    born: (profile.born as string | null) ?? null,
    age: (profile.age as string | number | null) ?? null,
    teams: config.hasTeams ? ((profile.teams as string[] | undefined) ?? []) : [],
    fields,
    personalBests,
    statCards: buildStatCards(profile, config.statTables, lookups),
    recentCards: buildStatCards(profile, config.recentTables, lookups),
  };
}

const LOOKUP_COLS: StatTableColumn[] = [
  { key: 'format_id', label: 'Format' },
  { key: 'age_category_id', label: 'Age' },
  { key: 'match_category_id', label: 'Category' },
];

export const SPORT_DETAIL_CONFIGS: Record<string, SportDetailConfig> = {
  hockey: {
    sportName: 'Hockey',
    fetchProfile: () => playerService.fetchHockeyProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_hand', label: 'Dominant Hand' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Hockey Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'play_position', label: 'Position' },
          { key: 'total_matches', label: 'Mat' },
          { key: 'goals', label: 'Goals' },
          { key: 'assist_goals', label: 'Assist' },
          { key: 'defeat_goal', label: 'Def. Goal' },
          { key: 'won', label: 'Won' },
          { key: 'lost', label: 'Lost' },
          { key: 'drawn', label: 'Drawn' },
          { key: 'yellow_card', label: 'YC' },
          { key: 'red_card', label: 'RC' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'won_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Match vs' },
          { key: 'result', label: 'Result' },
          { key: 'goals', label: 'Goals' },
          { key: 'assist_goals', label: 'Assist' },
          { key: 'yellow_card', label: 'YC' },
          { key: 'red_card', label: 'RC' },
        ],
      },
    ],
  },

  football: {
    sportName: 'Football',
    fetchProfile: () => footballService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_leg', label: 'Dominant Leg' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Football Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'play_position', label: 'Position' },
          { key: 'matches', label: 'Mat' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'goals', label: 'Goals' },
          { key: 'assists', label: 'Assists' },
          { key: 'yellow_card', label: 'YC' },
          { key: 'red_card', label: 'RC' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Match vs' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'goals', label: 'Goals' },
          { key: 'assists', label: 'Assists' },
        ],
      },
    ],
  },

  basketball: {
    sportName: 'Basketball',
    fetchProfile: () => basketballService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_hand', label: 'Dominant Hand' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Basketball Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'play_position', label: 'Position' },
          { key: 'matches', label: 'Mat' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'points', label: 'PTS' },
          { key: 'rebounds', label: 'REB' },
          { key: 'assists', label: 'AST' },
          { key: 'blocks', label: 'BLK' },
          { key: 'steals', label: 'STL' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Match vs' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'points', label: 'Points' },
          { key: 'rebounds', label: 'Rebounds' },
          { key: 'assists', label: 'Assists' },
        ],
      },
    ],
  },

  rugby: {
    sportName: 'Rugby',
    fetchProfile: () => rugbyService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Rugby Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'play_position', label: 'Position' },
          { key: 'matches', label: 'Mat' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'tries', label: 'Tries' },
          { key: 'conversion', label: 'Conv' },
          { key: 'penalty_kick', label: 'Pen Kick' },
          { key: 'drop_goal', label: 'Drop Goal' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'tries', label: 'Tries' },
          { key: 'conversion', label: 'Conv' },
        ],
      },
    ],
  },

  netball: {
    sportName: 'Netball',
    fetchProfile: () => netBallService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_hand', label: 'Dominant Hand' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Netball Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'play_position', label: 'Position' },
          { key: 'matches', label: 'Mat' },
          { key: 'goals', label: 'Goals' },
          { key: 'attempts', label: 'Attempts' },
          { key: 'goal_accuracy', label: 'Acc %' },
          { key: 'won', label: 'Won' },
          { key: 'lost', label: 'Lost' },
          { key: 'draw', label: 'Draw' },
          { key: 'no_result', label: 'NR' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'won_lost_draw_noresult',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Match vs' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'goals', label: 'Goals' },
          { key: 'goal_accuracy', label: 'Acc %' },
        ],
      },
    ],
  },

  'base-ball': {
    sportName: 'Baseball',
    fetchProfile: () => baseBallService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_hand', label: 'Dominant Hand' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Baseball Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'total_matches', label: 'Mat' },
          { key: 'at_bats', label: 'At Bats' },
          { key: 'runs', label: 'Runs' },
          { key: 'hits', label: 'Hits' },
          { key: 'rbi', label: 'RBI' },
          { key: 'won', label: 'Won' },
          { key: 'lost', label: 'Lost' },
          { key: 'no_result', label: 'NR' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'won_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Match vs' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'at_bats', label: 'At Bats' },
          { key: 'runs', label: 'Runs' },
          { key: 'hits', label: 'Hits' },
        ],
      },
    ],
  },

  volleyball: {
    sportName: 'Volleyball',
    fetchProfile: () => volleyballService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_hand', label: 'Dominant Hand' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Volleyball Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'matches', label: 'Mat' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'attacking', label: 'Attacking' },
          { key: 'blocking', label: 'Blocking' },
          { key: 'digging', label: 'Digging' },
          { key: 'champion', label: 'Titles' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Match vs' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'set_1', label: 'Set 1' },
          { key: 'set_2', label: 'Set 2' },
          { key: 'set_3', label: 'Set 3' },
        ],
      },
    ],
  },

  'beach-volleyball': {
    sportName: 'Beach Volleyball',
    fetchProfile: () => beachVolleyballService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_hand', label: 'Dominant Hand' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Beach Volleyball Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'matches', label: 'Mat' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'attacking', label: 'Attacking' },
          { key: 'blocking', label: 'Blocking' },
          { key: 'digging', label: 'Digging' },
          { key: 'champion', label: 'Titles' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'set_1', label: 'Set 1' },
          { key: 'set_2', label: 'Set 2' },
          { key: 'set_3', label: 'Set 3' },
        ],
      },
    ],
  },

  elle: {
    sportName: 'Elle',
    fetchProfile: () => elleService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'dominant_hand', label: 'Dominant Hand' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Elle Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'matches', label: 'Mat' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'runs', label: 'Runs' },
          { key: 'catches', label: 'Catches' },
          { key: 'champion', label: 'Titles' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'runs', label: 'Runs' },
          { key: 'catches', label: 'Catches' },
        ],
      },
    ],
  },

  boxing: {
    sportName: 'Boxing',
    fetchProfile: () => boxingService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'weight_class_id', label: 'Weight Class', lookupList: 'boxing_weight_classes' },
      { key: 'current_ranking', label: 'Ranking' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Boxing Fight Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'champion', label: 'Belt' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_fights',
        header: 'Recent Fights',
        resultMode: 'win_lost',
        columns: [
          { key: 'fight_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'place', label: 'Place' },
        ],
      },
    ],
  },

  judo: {
    sportName: 'Judo',
    fetchProfile: () => judoService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'weight_position_id', label: 'Weight Position', lookupList: 'weight_positions' },
      { key: 'competition_level_id', label: 'Competition Level', lookupList: 'competition_levels' },
      { key: 'current_ranking', label: 'Ranking' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Judo Fight Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'matches', label: 'Fights' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'champion', label: 'Title' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_fights',
        header: 'Recent Fights',
        resultMode: 'win_lost',
        columns: [
          { key: 'fight_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'place', label: 'Place' },
        ],
      },
    ],
  },

  karate: {
    sportName: 'Karate',
    fetchProfile: () => karateService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'player_style_id', label: 'Style', lookupList: 'karate_styles' },
      { key: 'current_ranking', label: 'Ranking' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Karate Fight Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'fights', label: 'Fights' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'weight_category', label: 'Weight Cat.' },
          { key: 'champion', label: 'Gold' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Fight vs' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'weight_category', label: 'Weight Cat.' },
        ],
      },
    ],
  },

  kabadi: {
    sportName: 'Kabaddi',
    fetchProfile: () => kabadiService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'player_position', label: 'Position' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Kabaddi Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'matches', label: 'Mat' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'raids', label: 'Raids' },
          { key: 'successful_raids', label: 'Successful Raids' },
          { key: 'tackles', label: 'Tackles' },
          { key: 'successful_tackles', label: 'Successful Tackles' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
          { key: 'raids', label: 'Raids' },
          { key: 'tackles', label: 'Tackles' },
        ],
      },
    ],
  },

  chess: {
    sportName: 'Chess',
    fetchProfile: () => chessService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'current_ranking', label: 'Ranking' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'career_stats',
        header: 'Chess Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'games', label: 'Games' },
          { key: 'win', label: 'Win' },
          { key: 'lost', label: 'Lost' },
          { key: 'champion', label: 'Champion' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Against' },
          { key: 'venue', label: 'Venue' },
          { key: 'result', label: 'Result' },
        ],
      },
    ],
  },

  athletics: {
    sportName: 'Athletics',
    fetchProfile: () => athleticsService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    personalBests: {
      key: 'personal_bests',
      eventIdKey: 'athletics_event_id',
      lookupList: 'athletics_events',
      valueKey: 'personal_best',
    },
    statTables: [
      {
        key: 'career_stats',
        header: 'Athletics Career Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'personal_best', label: 'Personal Best' },
          { key: 'champion', label: 'Champion' },
          { key: 'second_place', label: '2nd' },
          { key: 'third_place', label: '3rd' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_events',
        header: 'Recent Events',
        resultMode: 'place_medal',
        columns: [
          { key: 'event_date', label: 'Date' },
          { key: 'personal_best', label: 'Personal Best' },
          { key: 'result', label: 'Result' },
        ],
      },
    ],
  },

  swimming: {
    sportName: 'Swimming',
    fetchProfile: () => swimmingService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    personalBests: {
      key: 'personal_bests',
      eventIdKey: 'swimming_event_id',
      lookupList: 'swimming_events',
      valueKey: 'personal_best',
    },
    statTables: [
      {
        key: 'career_stats',
        header: 'Swimming Career Stats',
        usesLookups: true,
        columns: [
          ...LOOKUP_COLS,
          { key: 'current_time', label: 'Current Best' },
          { key: 'champion', label: 'Gold' },
          { key: 'second_place', label: 'Silver' },
          { key: 'third_place', label: 'Bronze' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_events',
        header: 'Recent Events',
        resultMode: 'place_medal',
        columns: [
          { key: 'event_date', label: 'Date' },
          { key: 'performance_time', label: 'Performance' },
          { key: 'result', label: 'Result' },
        ],
      },
    ],
  },

  'soft-ball-cricket': {
    sportName: 'Soft Ball Cricket',
    fetchProfile: () => softBallCricketService.fetchProfile(),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'batting_style', label: 'Batting Style' },
      { key: 'bowling_style', label: 'Bowling Style' },
      { key: 'playing_role', label: 'Playing Role' },
      { key: 'height', label: 'Height' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      {
        key: 'batting',
        header: 'Batting Career Stats',
        columns: [
          { key: 'matches', label: 'Mat' },
          { key: 'runs', label: 'Runs' },
          { key: 'innings', label: 'Inn' },
          { key: 'highest', label: 'HS' },
          { key: 'not_out', label: 'NO' },
          { key: 'hundreds', label: '100s' },
          { key: 'fifties', label: '50s' },
          { key: 'won', label: 'Won' },
          { key: 'lost', label: 'Lost' },
        ],
      },
      {
        key: 'bowling',
        header: 'Bowling Career Stats',
        columns: [
          { key: 'matches', label: 'Mat' },
          { key: 'balls', label: 'Balls' },
          { key: 'runs', label: 'Runs' },
          { key: 'wickets', label: 'Wkts' },
          { key: 'average', label: 'Avg' },
          { key: 'economy', label: 'Econ' },
          { key: 'career_best', label: 'Best' },
        ],
      },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'won_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'result', label: 'Result' },
          { key: 'runs', label: 'Runs' },
          { key: 'wickets', label: 'Wkts' },
          { key: 'catches', label: 'Catches' },
        ],
      },
    ],
  },
};

/** Tennis/Badminton/Table Tennis share one screen and service, keyed by
 * numeric sport id rather than slug — resolved from `lookups.sports` by the
 * caller before building this config (see buildRacketSportConfig). */
export function buildRacketSportConfig(sportName: string, sportId: number): SportDetailConfig {
  const careerColumns: StatTableColumn[] = [
    ...LOOKUP_COLS,
    { key: 'matches', label: 'Mat' },
    { key: 'win', label: 'Win' },
    { key: 'lost', label: 'Lost' },
    { key: 'set_win', label: 'Set Win' },
    { key: 'set_lost', label: 'Set Lost' },
    { key: 'champion', label: 'Titles' },
  ];
  return {
    sportName,
    fetchProfile: () => racketSportService.fetchProfile(sportId),
    overviewFields: [
      { key: 'born', label: 'Born' },
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'dominant_hand', label: 'Playing Hand' },
      { key: 'current_ranking', label: 'Ranking' },
      { key: 'college_university', label: 'Education' },
    ],
    hasTeams: true,
    statTables: [
      { key: 'single_stats', header: `${sportName} Stats — Single`, usesLookups: true, columns: careerColumns },
      { key: 'double_stats', header: `${sportName} Stats — Double`, usesLookups: true, columns: careerColumns },
      { key: 'mix_double_stats', header: `${sportName} Stats — Mix Double`, usesLookups: true, columns: careerColumns },
    ],
    recentTables: [
      {
        key: 'recent_matches',
        header: 'Recent Matches',
        resultMode: 'win_lost',
        columns: [
          { key: 'match_date', label: 'Date' },
          { key: 'opponent', label: 'Opponent' },
          { key: 'result', label: 'Result' },
          { key: 'set_1', label: 'Set 1' },
          { key: 'set_2', label: 'Set 2' },
          { key: 'set_3', label: 'Set 3' },
        ],
      },
    ],
  };
}
