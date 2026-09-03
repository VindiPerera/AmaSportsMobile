export interface KarateCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  style: string;
  fights: string;
  win: string;
  lost: string;
  weight_category: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface KarateRecentMatchRowForm {
  match_date: string;
  opponent: string;
  venue: string;
  style: string;
  win: boolean;
  lost: boolean;
  weight_category: string;
  age_category: string;
  place: string;
}

export interface KarateProfileFormValues {
  born: string;
  age: string;
  height: string;
  weight: string;
  player_style_id: string;
  current_ranking: string;
  college_university: string;
  teams: string[];
  career_stats: KarateCareerRowForm[];
  recent_matches: KarateRecentMatchRowForm[];
}

export interface KarateProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  player_style_id: number | null;
  current_ranking: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_matches: Record<string, unknown>[];
}
