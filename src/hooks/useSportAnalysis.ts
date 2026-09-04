import { useEffect, useState } from 'react';
import { playerService } from '../services/playerService';
import { headlineStatsForCricket, headlineStatsForSport } from '../utils/sportStats';
import { CricketAnalysisResponse, SportAnalysisResponse } from '../types';

/**
 * Fetches aggregated analysis for whichever sport slug is "active" —
 * cricket has its own fixed-shape endpoint, every other supported sport
 * shares GenericSportAnalysisService (see SportAnalysisConfig on the
 * backend); the sports it doesn't cover yet (tennis/badminton/table-tennis,
 * soft-ball-cricket) 404, caught here as `analysisSupported: false` so
 * callers can show a "coming soon" state instead of an error.
 *
 * Shared by the Home dashboard's Performance Analytics widget and the
 * Player Profile tab's stat tiles — same data, same fallback rules, so one
 * hook keeps them from drifting apart.
 */
export function useSportAnalysis(activeSlug: string | null) {
  const [cricketAnalysis, setCricketAnalysis] = useState<CricketAnalysisResponse | null>(null);
  const [genericAnalysis, setGenericAnalysis] = useState<SportAnalysisResponse | null>(null);
  const [analysisSupported, setAnalysisSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeSlug) return;
    let cancelled = false;
    setIsLoading(true);
    setAnalysisSupported(true);

    if (activeSlug === 'cricket') {
      playerService
        .fetchCricketAnalysis(undefined, { silent: true })
        .then((r) => {
          if (!cancelled) {
            setCricketAnalysis(r);
            setGenericAnalysis(null);
          }
        })
        .catch(() => {
          if (!cancelled) setCricketAnalysis(null);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    } else {
      playerService
        .fetchSportAnalysis(activeSlug, undefined, { silent: true })
        .then((r) => {
          if (!cancelled) {
            setGenericAnalysis(r);
            setCricketAnalysis(null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setGenericAnalysis(null);
            setAnalysisSupported(false);
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  const isCricketActive = activeSlug === 'cricket';
  const hasAnyStats = isCricketActive ? cricketAnalysis?.has_any_stats : genericAnalysis?.has_any_stats;
  const headlineStats = isCricketActive
    ? headlineStatsForCricket(cricketAnalysis?.overview)
    : headlineStatsForSport(genericAnalysis?.overview);

  return {
    cricketAnalysis,
    genericAnalysis,
    analysisSupported,
    isLoading,
    isCricketActive,
    hasAnyStats,
    headlineStats,
  };
}
