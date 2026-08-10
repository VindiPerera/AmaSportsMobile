/**
 * Mirrors CricketAnalysisService's response shape exactly — every average/
 * rate arrives pre-computed from the backend (`null` where it can't be
 * safely calculated, e.g. divide-by-zero or a rate that can't be combined
 * across rows). The UI's only job is to render `null` as "N/A", never fall
 * back to computing its own numbers from the raw fields.
 */
export interface CricketFormatOption {
  id: number;
  name: string;
}

export interface CricketBattingAggregate {
  matches: number;
  innings: number;
  not_outs: number;
  runs: number;
  highest_score: string | null;
  average: number | null;
  strike_rate: number | null;
  hundreds: number;
  fifties: number;
  fours: number;
  sixes: number;
  catches: number;
  stumpings: number;
  won: number;
  lost: number;
  win_percentage: number | null;
}

export interface CricketBowlingAggregate {
  matches: number;
  innings: number;
  balls: number;
  runs_conceded: number;
  wickets: number;
  best_bowling_innings: string | null;
  best_bowling_match: string | null;
  average: number | null;
  economy: number | null;
  strike_rate: number | null;
  four_w: number;
  five_w: number;
  ten_w: number;
}

export interface CricketBattingByFormat extends CricketBattingAggregate {
  format_id: number;
  format_name: string;
}

export interface CricketBowlingByFormat extends CricketBowlingAggregate {
  format_id: number;
  format_name: string;
}

export interface CricketRecentFormEntry {
  match_date: string | null;
  opponent: string | null;
  runs: number | null;
  balls: number | null;
  fours: number | null;
  sixes: number | null;
  overs: number | null;
  maidens: number | null;
  wickets: number | null;
  catches: number | null;
  stumpings: number | null;
  /** runs/balls*100, computed server-side; null when balls faced is 0/unknown. */
  strike_rate: number | null;
  /** Always null today — see the "Economy" caveat in CricketAnalysisService's docblock. */
  economy: number | null;
}

/** Shape returned by GET /player/cricket-analysis. */
export interface CricketAnalysisResponse {
  has_profile: boolean;
  has_any_stats: boolean;
  filter: {
    format_id: number | null;
    format_name: string | null;
  };
  available_formats: CricketFormatOption[];
  overview: {
    matches: number;
    runs: number;
    wickets: number;
    batting_average: number | null;
    bowling_average: number | null;
    win_percentage: number | null;
  };
  batting: {
    career: CricketBattingAggregate;
    by_format: CricketBattingByFormat[];
  };
  bowling: {
    career: CricketBowlingAggregate;
    by_format: CricketBowlingByFormat[];
  };
  boundaries: {
    fours: number;
    sixes: number;
  };
  recent_form: CricketRecentFormEntry[];
}
