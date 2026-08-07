import { DominantHand } from './player';

export interface VolleyballCareerRowForm {
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

/** Indoor Volleyball goes to a 5th set; Beach Volleyball (best-of-3) reuses this minus set_4/set_5. */
export interface VolleyballRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  win: boolean;
  lost: boolean;
  set_1: string;
  set_2: string;
  set_3: string;
  set_4: string;
  set_5: string;
}

export interface VolleyballProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: VolleyballCareerRowForm[];
  recent_matches: VolleyballRecentMatchRowForm[];
}

export interface VolleyballProfileResponse {
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
