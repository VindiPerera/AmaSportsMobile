import { DominantHand } from './player';

/**
 * Shared Tennis / Badminton / Table Tennis form (spec Phase 2 §B3). The
 * form keeps Single/Double/Mix Double as three separate row arrays (so the
 * existing StatTable component "just works" per table); playerService
 * stamps each row with its `category` when building the submit payload.
 */
export interface RacketSportCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  matches: string;
  win: string;
  lost: string;
  set_win: string;
  set_lost: string;
  quarter_final: string;
  semi_final: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface RacketSportRecentMatchRowForm {
  match_date: string;
  opponent: string;
  win: boolean;
  lost: boolean;
  set_1: string;
  set_2: string;
  set_3: string;
  set_4: string;
  set_5: string;
}

export interface RacketSportProfileFormValues {
  born: string;
  age: string;
  height: string;
  dominant_hand: DominantHand | '';
  weight: string;
  current_ranking: string;
  college_university: string;
  teams: string[];
  single_stats: RacketSportCareerRowForm[];
  double_stats: RacketSportCareerRowForm[];
  mix_double_stats: RacketSportCareerRowForm[];
  recent_matches: RacketSportRecentMatchRowForm[];
}

export interface RacketSportProfileResponse {
  id: number | null;
  sport_id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  dominant_hand: DominantHand | null;
  weight: string | null;
  current_ranking: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
