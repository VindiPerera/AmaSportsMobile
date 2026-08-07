import { DominantHand } from './player';

export interface BeachVolleyballCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  win: string;
  lost: string;
  passes: string;
  setting: string;
  serve: string;
  attacking: string;
  blocking: string;
  digging: string;
  third_place: string;
  second_place: string;
  champion: string;
}

/** Best-of-3 (spec §D2) — only 3 set columns, unlike indoor Volleyball's 5. */
export interface BeachVolleyballRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  win: boolean;
  lost: boolean;
  set_1: string;
  set_2: string;
  set_3: string;
}

export interface BeachVolleyballProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: BeachVolleyballCareerRowForm[];
  recent_matches: BeachVolleyballRecentMatchRowForm[];
}

export interface BeachVolleyballProfileResponse {
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
