export interface JudoCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  weight_position_id: string;
  competition_level_id: string;
  matches: string;
  win: string;
  lost: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface JudoRecentFightRowForm {
  fight_date: string;
  opponent: string;
  venue: string;
  weight_position_id: string;
  competition_level_id: string;
  win: boolean;
  lost: boolean;
  place: string;
}

export interface JudoProfileFormValues {
  born: string;
  age: string;
  height: string;
  weight: string;
  weight_position_id: string;
  competition_level_id: string;
  college_university: string;
  current_ranking: string;
  teams: string[];
  career_stats: JudoCareerRowForm[];
  recent_fights: JudoRecentFightRowForm[];
}

export interface JudoProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  weight_position_id: number | null;
  competition_level_id: number | null;
  college_university: string | null;
  current_ranking: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_fights: Record<string, unknown>[];
}
