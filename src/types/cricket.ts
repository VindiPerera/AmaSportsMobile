/**
 * Every stat-row field below is a form-state string (TextInput/Picker
 * values are always strings) — `playerService` converts these to the
 * number|null shape the API expects right before submit.
 */
export interface CricketBattingRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  cricket_match_type_id: string;
  matches: string;
  won: string;
  lost: string;
  innings: string;
  not_out: string;
  runs: string;
  hs: string;
  average: string;
  best: string;
  sr: string;
  hundreds: string;
  fifties: string;
  fours: string;
  sixes: string;
  catches: string;
  stumpings: string;
}

export interface CricketBowlingRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  cricket_match_type_id: string;
  matches: string;
  innings: string;
  balls: string;
  runs: string;
  wickets: string;
  bbi: string;
  bbm: string;
  average: string;
  economy: string;
  sr: string;
  four_w: string;
  five_w: string;
  ten_w: string;
}

export interface CricketRecentMatchRowForm {
  match_date: string;
  opponent: string;
  played_xi: boolean;
  runs: string;
  balls: string;
  fours: string;
  sixes: string;
  overs: string;
  maidens: string;
  wickets: string;
  catches: string;
  stumpings: string;
}

export interface CricketProfileFormValues {
  born: string;
  age: string;
  batting_style: string;
  bowling_style: string;
  playing_role: string;
  height: string;
  college_university: string;
  teams: string[];
  batting: CricketBattingRowForm[];
  bowling: CricketBowlingRowForm[];
  recent_matches: CricketRecentMatchRowForm[];
}

/** Shape returned by GET/PUT /player/cricket-profile. */
export interface CricketProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  batting_style: string | null;
  bowling_style: string | null;
  playing_role: string | null;
  height: string | null;
  college_university: string | null;
  teams: string[];
  batting: Record<string, unknown>[];
  bowling: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
