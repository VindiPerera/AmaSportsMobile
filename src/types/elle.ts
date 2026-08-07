import { DominantHand } from './player';

export interface ElleCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  win: string;
  lost: string;
  runs: string;
  catches: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface ElleRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  win: boolean;
  lost: boolean;
  runs: string;
  catches: string;
  place: string;
}

export interface ElleProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: ElleCareerRowForm[];
  recent_matches: ElleRecentMatchRowForm[];
}

export interface ElleProfileResponse {
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
