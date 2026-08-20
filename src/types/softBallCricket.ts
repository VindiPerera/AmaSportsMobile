/** Form-state strings; softBallCricketService converts to number|null before submit. */
export interface SoftBallCricketBattingRowForm {
  matches: string;
  runs: string;
  innings: string;
  highest: string;
  not_out: string;
  hundreds: string;
  fifties: string;
  sixes: string;
  fours: string;
  catches: string;
  stumpings: string;
  won: string;
  lost: string;
  tied: string;
}

export interface SoftBallCricketBowlingRowForm {
  matches: string;
  balls: string;
  runs: string;
  wickets: string;
  average: string;
  economy: string;
  three_w: string;
  four_w: string;
  five_w: string;
  career_best: string;
}

export interface SoftBallCricketRecentMatchRowForm {
  match_date: string;
  opponent: string;
  won: boolean;
  lost: boolean;
  runs: string;
  balls: string;
  average: string;
  bowling_balls: string;
  bowling_runs: string;
  wickets: string;
  catches: string;
  stumpings: string;
}

export interface SoftBallCricketProfileFormValues {
  born: string;
  age: string;
  batting_style: string;
  bowling_style: string;
  playing_role: string;
  height: string;
  college_university: string;
  teams: string[];
  batting: SoftBallCricketBattingRowForm[];
  bowling: SoftBallCricketBowlingRowForm[];
  recent_matches: SoftBallCricketRecentMatchRowForm[];
}

export interface SoftBallCricketProfileResponse {
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
