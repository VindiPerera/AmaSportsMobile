import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { CricketPlayerDetailView } from '../../../src/components/player/CricketPlayerDetailView';
import { colors } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { playerService } from '../../../src/services/playerService';
import { CricketProfileFormValues } from '../../../src/types';

const BATTING_KEYS = [
  'format_id', 'age_category_id', 'match_category_id', 'cricket_match_type_id',
  'matches', 'won', 'lost', 'innings', 'not_out', 'runs', 'hs', 'average', 'best', 'sr',
  'hundreds', 'fifties', 'fours', 'sixes', 'catches', 'stumpings',
  'run_outs', 'direct_hits', 'runs_saved', 'runs_giving', 'stumps_missing',
];

const BOWLING_KEYS = [
  'format_id', 'age_category_id', 'match_category_id', 'cricket_match_type_id',
  'matches', 'innings', 'balls', 'dot_balls', 'wide_balls', 'no_balls',
  'runs', 'wickets', 'bbi', 'bbm', 'average', 'economy', 'sr', 'four_w', 'five_w', 'ten_w',
];

const DROP_CATCH_KEYS = ['format_id', 'age_category_id', 'match_category_id', 'field_position_id', 'drop_reason_id'];

const RECENT_MATCH_KEYS = [
  'match_date', 'opponent', 'runs', 'balls', 'fours', 'sixes', 'overs', 'maidens', 'wickets', 'catches', 'stumpings',
];

/** Same conversion cricket.tsx uses to turn the API's numeric response into the form-state string shape CricketPlayerDetailView expects. */
function toFormString(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function mapRow(row: Record<string, unknown>, keys: string[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  keys.forEach((key) => {
    mapped[key] = toFormString(row[key]);
  });
  return mapped;
}

function breakdownToFormValues(breakdown: Record<string, number>): Record<string, string> {
  const mapped: Record<string, string> = {};
  Object.entries(breakdown ?? {}).forEach(([key, value]) => {
    mapped[key] = toFormString(value);
  });
  return mapped;
}

/**
 * "View Full Profile" from Player Search — read-only, any player by id.
 * Reuses CricketPlayerDetailView (the same component the player's own
 * Cricket Profile screen renders in view mode) instead of a new detail UI;
 * just omit `onEditPress` so no edit affordance shows for someone else's data.
 */
export default function PublicCricketProfileScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const lookups = useLookupStore((s) => s.lookups);
  const ensureLoaded = useLookupStore((s) => s.ensureLoaded);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [values, setValues] = useState<CricketProfileFormValues | null>(null);

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      try {
        await ensureLoaded();
        const data = await playerService.fetchPublicCricketProfile(Number(playerId));

        setFullName(data.player.full_name ?? '');
        setCountry(data.player.country ?? '');
        setPhotoUrl(data.player.photo_url);
        setCoverUrl(data.player.cover_photo_url);

        const cricketProfile = data.cricket_profile;
        setValues({
          born: cricketProfile.born ?? '',
          age: toFormString(cricketProfile.age),
          batting_style: cricketProfile.batting_style ?? '',
          bowling_style: cricketProfile.bowling_style ?? '',
          playing_role: cricketProfile.playing_role ?? '',
          height: cricketProfile.height ?? '',
          college_university: cricketProfile.college_university ?? '',
          pitching_line_breakdown: breakdownToFormValues(cricketProfile.pitching_line_breakdown),
          ball_type_breakdown: breakdownToFormValues(cricketProfile.ball_type_breakdown),
          teams: cricketProfile.teams ?? [],
          batting: cricketProfile.batting.map((row) =>
            mapRow(row, BATTING_KEYS)
          ) as unknown as CricketProfileFormValues['batting'],
          bowling: cricketProfile.bowling.map((row) =>
            mapRow(row, BOWLING_KEYS)
          ) as unknown as CricketProfileFormValues['bowling'],
          recent_matches: cricketProfile.recent_matches.map((row) => ({
            ...mapRow(row, RECENT_MATCH_KEYS),
            played_xi: Boolean(row.played_xi),
          })) as unknown as CricketProfileFormValues['recent_matches'],
          drop_catches: cricketProfile.drop_catches.map((row) =>
            mapRow(row, DROP_CATCH_KEYS)
          ) as unknown as CricketProfileFormValues['drop_catches'],
        });
      } catch {
        setError('Could not load this player&apos;s profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [playerId, ensureLoaded]);

  if (isLoading || !lookups) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      </ScreenContainer>
    );
  }

  if (error || !values) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ErrorBanner message={error ?? 'Player not found.'} />
      </ScreenContainer>
    );
  }

  return (
    <CricketPlayerDetailView
      fullName={fullName}
      country={country}
      photoUrl={photoUrl}
      coverUrl={coverUrl}
      values={values}
      lookups={lookups}
      onBackPress={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: 40,
  },
});
