export interface BoxingCareerRowForm {
  format_id: string;
  age_category_id: string;
  match_category_id: string;
  weight_class_id: string;
  matches: string;
  win: string;
  lost: string;
  third_place: string;
  second_place: string;
  champion: string;
}

export interface BoxingRecentFightRowForm {
  fight_date: string;
  opponent: string;
  venue: string;
  weight_class_id: string;
  win: boolean;
  lost: boolean;
  place: string;
}

export interface BoxingProfileFormValues {
  born: string;
  age: string;
  height: string;
  weight: string;
  weight_class_id: string;
  current_ranking: string;
  college_university: string;
  teams: string[];
  career_stats: BoxingCareerRowForm[];
  recent_fights: BoxingRecentFightRowForm[];
}

export interface BoxingProfileResponse {
  id: number | null;
  born: string | null;
  age: number | null;
  height: string | null;
  weight: string | null;
  weight_class_id: number | null;
  current_ranking: string | null;
  college_university: string | null;
  teams: string[];
  career_stats: Record<string, unknown>[];
  recent_fights: Record<string, unknown>[];
}
