import { DominantHand } from './player';

/** See cricket.ts — same string-form / number-API split. */
export interface HockeyCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  play_position: string;
  total_matches: string;
  goals: string;
  assist_goals: string;
  defeat_goal: string;
  won: string;
  lost: string;
  drawn: string;
  red_card: string;
  yellow_card: string;
  other_card: string;
  year: string;
}

export interface HockeyRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  goals: string;
  assist_goals: string;
  defeat_goals: string;
  won: boolean;
  lost: boolean;
  drawn: boolean;
  red_card: string;
  yellow_card: string;
  other_card: string;
}

export interface HockeyProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  player_position: string;
  college_university: string;
  teams: string[];
  career_stats: HockeyCareerRowForm[];
  recent_matches: HockeyRecentMatchRowForm[];
}

/** Shape returned by GET/PUT /player/hockey-profile. */
export interface HockeyProfileResponse {
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
