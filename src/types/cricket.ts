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
  // Phase 7 (Fielding Analyses) additions. `stumpings` above is the
  // successful count; `stumps_missing` is its counterpart.
  run_outs: string;
  direct_hits: string;
  runs_saved: string;
  runs_giving: string;
  stumps_missing: string;
}

export interface CricketBowlingRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  cricket_match_type_id: string;
  matches: string;
  innings: string;
  balls: string;
  // Phase 7 (Bowling Analyses) delivery-outcome detail.
  dot_balls: string;
  wide_balls: string;
  no_balls: string;
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

/** Repeatable "Drop Catches" row — Phase 7 spec §2. Format/Age/Category are
 * optional context, unlike the batting/bowling tables. */
export interface CricketDropCatchRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  field_position_id: string;
  drop_reason_id: string;
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

/** Repeatable "Reason for Matches Missed / Dropped" row — client-side only
 * for now; there is no backend field or endpoint for this yet (no matching
 * migration/column on cricket_profiles), so this won't persist on save. */
export interface CricketMissedMatchRowForm {
  match_date: string;
}

/**
 * Career-to-date ball-count breakdown, keyed by lookup id (as a string,
 * since form-state and JSON object keys are always strings) — Phase 7 spec
 * §5. One flat map per player, not per bowling-stat row; see the backend's
 * cricket_profiles migration note for why.
 */
export type CricketBreakdownFormValues = Record<string, string>;

export interface CricketProfileFormValues {
  born: string;
  age: string;
  batting_style: string;
  bowling_style: string;
  playing_role: string;
  height: string;
  college_university: string;
  pitching_line_breakdown: CricketBreakdownFormValues;
  ball_type_breakdown: CricketBreakdownFormValues;
  teams: string[];
  batting: CricketBattingRowForm[];
  bowling: CricketBowlingRowForm[];
  recent_matches: CricketRecentMatchRowForm[];
  drop_catches: CricketDropCatchRowForm[];
  missed_matches: CricketMissedMatchRowForm[];
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
  pitching_line_breakdown: Record<string, number>;
  ball_type_breakdown: Record<string, number>;
  teams: string[];
  batting: Record<string, unknown>[];
  bowling: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
  drop_catches: Record<string, unknown>[];
}
