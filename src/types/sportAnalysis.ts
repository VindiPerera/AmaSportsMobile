/**
 * Response shape for GET /player/{sport}/analysis — the generic counterpart
 * to CricketAnalysisResponse (see cricketAnalysis.ts) for every sport
 * GenericSportAnalysisService knows how to aggregate. Unlike Cricket, there
 * is no fixed field list: `overview`/`career`/`by_format` entries vary per
 * sport (see SportAnalysisConfig on the backend), so they're typed as
 * open records the UI renders generically by key rather than by name.
 */
export interface SportAnalysisFormatOption {
  id: number;
  name: string;
}

export interface SportAnalysisPersonalBest {
  event: string | null;
  value: string | null;
}

export interface SportAnalysisResponse {
  has_profile: boolean;
  has_any_stats: boolean;
  filter: {
    format_id: number | null;
    format_name: string | null;
  };
  available_formats: SportAnalysisFormatOption[];
  overview: Record<string, number | null>;
  career: Record<string, number | null>;
  by_format: ({ format_id: number; format_name: string } & Record<string, number | null>)[];
  personal_bests: SportAnalysisPersonalBest[];
  recent_form: Record<string, unknown>[];
}
