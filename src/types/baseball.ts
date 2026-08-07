import { DominantHand } from './player';

/** Form-state strings; playerService converts to number|null before submit — see cricket.ts. */
export interface BaseBallCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  nt: string;
  at_bats: string;
  runs: string;
  hits: string;
  rbi: string;
  won: string;
  lost: string;
}

export interface BaseBallRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  won: boolean;
  lost: boolean;
  runs: string;
}

export interface BaseBallProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: BaseBallCareerRowForm[];
  recent_matches: BaseBallRecentMatchRowForm[];
}

export interface BaseBallProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  dominant_hand: DominantHand | null;
  player_position: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
