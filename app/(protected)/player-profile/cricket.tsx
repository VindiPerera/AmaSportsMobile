import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { TextField } from '../../../src/components/ui/TextField';
import { Button } from '../../../src/components/ui/Button';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { CoverPhotoUpload } from '../../../src/components/player/CoverPhotoUpload';
import { AvatarPhotoUpload } from '../../../src/components/player/AvatarPhotoUpload';
import { Dropdown } from '../../../src/components/player/Dropdown';
import { DateField } from '../../../src/components/player/DateField';
import { TeamsInput } from '../../../src/components/player/TeamsInput';
import { StatTable } from '../../../src/components/player/StatTable';
import { ViewOnlyBanner } from '../../../src/components/player/ViewOnlyBanner';
import { CricketPlayerDetailView } from '../../../src/components/player/CricketPlayerDetailView';
import { SportProfileLayout, sportStyles } from '../../../src/components/player/SportProfileLayout';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import {
  BATTING_STYLE_OPTIONS,
  BOWLING_STYLE_OPTIONS,
  PLAYING_ROLE_OPTIONS,
} from '../../../src/constants/cricketOptions';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, CricketProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_BATTING_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', cricket_match_type_id: '',
  matches: '', won: '', lost: '', innings: '', not_out: '', runs: '', hs: '', average: '',
  best: '', sr: '', hundreds: '', fifties: '', fours: '', sixes: '', catches: '', stumpings: '',
  run_outs: '', direct_hits: '', runs_saved: '', runs_giving: '', stumps_missing: '',
};

const EMPTY_BOWLING_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', cricket_match_type_id: '',
  matches: '', innings: '', balls: '', dot_balls: '', wide_balls: '', no_balls: '',
  runs: '', wickets: '', bbi: '', bbm: '', average: '', economy: '', sr: '',
  four_w: '', five_w: '', ten_w: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', played_xi: false, runs: '', balls: '', fours: '', sixes: '',
  overs: '', maidens: '', wickets: '', catches: '', stumpings: '',
};

const EMPTY_DROP_CATCH_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', field_position_id: '', drop_reason_id: '',
};

const EMPTY_MISSED_MATCH_ROW = {
  match_date: '',
};

const EMPTY_FORM: CricketProfileFormValues = {
  born: '', age: '', batting_style: '', bowling_style: '', playing_role: '', height: '',
  college_university: '', pitching_line_breakdown: {}, ball_type_breakdown: {},
  teams: [], batting: [], bowling: [], recent_matches: [], drop_catches: [], missed_matches: [],
};

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

/** Converts the API's `{ [lookupId]: count }` breakdown map to form-state strings. */
function breakdownToFormValues(breakdown: Record<string, number>): Record<string, string> {
  const mapped: Record<string, string> = {};
  Object.entries(breakdown ?? {}).forEach(([key, value]) => {
    mapped[key] = toFormString(value);
  });
  return mapped;
}

export default function CricketProfileScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [isViewing, setIsViewing] = useState(mode === 'view');

  const lookups = useLookupStore((s) => s.lookups);
  const ensureLoaded = useLookupStore((s) => s.ensureLoaded);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [coverPicked, setCoverPicked] = useState<PickedImage | null>(null);
  const [avatarPicked, setAvatarPicked] = useState<PickedImage | null>(null);

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<CricketProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, cricketProfile] = await Promise.all([
          playerService.fetchProfile(),
          playerService.fetchCricketProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
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
            mapRow(row, Object.keys(EMPTY_BATTING_ROW))
          ) as unknown as CricketProfileFormValues['batting'],
          bowling: cricketProfile.bowling.map((row) =>
            mapRow(row, Object.keys(EMPTY_BOWLING_ROW))
          ) as unknown as CricketProfileFormValues['bowling'],
          recent_matches: cricketProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'runs', 'balls', 'fours', 'sixes', 'overs', 'maidens', 'wickets', 'catches', 'stumpings']),
            played_xi: Boolean(row.played_xi),
          })) as unknown as CricketProfileFormValues['recent_matches'],
          drop_catches: cricketProfile.drop_catches.map((row) =>
            mapRow(row, Object.keys(EMPTY_DROP_CATCH_ROW))
          ) as unknown as CricketProfileFormValues['drop_catches'],
          // No backend field for this yet — always starts empty on load.
          missed_matches: [],
        });
      } catch {
        setError('Could not load your Cricket profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [ensureLoaded, reset]);

  /** Auto-fills Age from Born, but only while the player hasn't typed an age of their own. */
  const handleBornChange = (isoDate: string, onChange: (value: string) => void) => {
    onChange(isoDate);
    if (!getValues('age')) {
      const computed = calculateAge(isoDate);
      if (computed !== null) setValue('age', String(computed));
    }
  };

  const onSubmit = async (values: CricketProfileFormValues) => {
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const updatedProfile = await playerService.updateProfile({
        full_name: fullName.trim(),
        country: country || undefined,
        cover_photo: coverPicked,
        photo: avatarPicked,
      });
      if (updatedProfile) {
        if (updatedProfile.photo_url) setExistingPhotoUrl(updatedProfile.photo_url);
        if (updatedProfile.cover_photo_url) setExistingCoverUrl(updatedProfile.cover_photo_url);
        setAvatarPicked(null);
        setCoverPicked(null);
      }
      await playerService.saveCricketProfile(values);
      await useAuthStore.getState().refreshProfile();
      setIsViewing(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save your Cricket profile. Please check your entries and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !lookups) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
      </ScreenContainer>
    );
  }

  // If in View Mode, render the Cricbuzz-style Player Detail View
  if (isViewing) {
    return (
      <CricketPlayerDetailView
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        coverUrl={coverPicked?.uri || existingCoverUrl}
        values={formValues}
        lookups={lookups}
        onEditPress={() => setIsViewing(false)}
        onBackPress={() => router.back()}
      />
    );
  }


  const formatOptions = lookups.formats.map((f) => ({ label: f.name, value: String(f.id) }));
  const ageOptions = lookups.age_categories.map((a) => ({ label: a.name, value: String(a.id) }));
  const categoryOptions = lookups.match_categories.map((c) => ({ label: c.name, value: String(c.id) }));
  const matchTypeOptions = lookups.cricket_match_types.map((m) => ({ label: m.name, value: String(m.id) }));
  const fieldPositionOptions = lookups.field_positions.map((p) => ({ label: p.name, value: String(p.id) }));
  const dropReasonOptions = lookups.drop_reasons.map((r) => ({ label: r.name, value: String(r.id) }));

  return (
    <SportProfileLayout
      sportName="Cricket"
      sportIcon="baseball-outline"
      fullName={fullName}
      error={error}
      onBack={() => router.back()}
    >
      <View style={sportStyles.coverBlock}>
        <CoverPhotoUpload existingUrl={existingCoverUrl} picked={coverPicked} onPick={setCoverPicked} />
        <View style={sportStyles.avatarOverlay}>
          <AvatarPhotoUpload existingUrl={existingPhotoUrl} picked={avatarPicked} onPick={setAvatarPicked} />
        </View>
      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
          Player Overview
        </Text>
        <TextField label="Player Name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Dropdown label="Country" value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
          </View>
          <View style={styles.headerRowItem}>
            <Dropdown label="Sport" value="cricket" onChange={() => {}} options={[{ label: 'Cricket', value: 'cricket' }]} disabled />
          </View>
        </View>
        <Controller
          control={control}
          name="born"
          render={({ field: { value, onChange } }) => (
            <DateField label="Born" value={value} onChange={(isoDate) => handleBornChange(isoDate, onChange)} />
          )}
        />
        <Controller
          control={control}
          name="age"
          render={({ field: { value, onChange } }) => (
            <TextField label="Age" value={value} onChangeText={onChange} keyboardType="number-pad" />
          )}
        />
        <Controller
          control={control}
          name="batting_style"
          render={({ field: { value, onChange } }) => (
            <Dropdown label="Batting Style" value={value} onChange={onChange} options={BATTING_STYLE_OPTIONS} placeholder="Select batting style" />
          )}
        />
        <Controller
          control={control}
          name="bowling_style"
          render={({ field: { value, onChange } }) => (
            <Dropdown label="Bowling Style" value={value} onChange={onChange} options={BOWLING_STYLE_OPTIONS} placeholder="Select bowling style" />
          )}
        />
        <Controller
          control={control}
          name="playing_role"
          render={({ field: { value, onChange } }) => (
            <Dropdown label="Playing Role" value={value} onChange={onChange} options={PLAYING_ROLE_OPTIONS} placeholder="Select playing role" />
          )}
        />
        <Controller
          control={control}
          name="height"
          render={({ field: { value, onChange } }) => (
            <TextField label="Height" value={value} onChangeText={onChange} placeholder="e.g. 5 ft 10 in" />
          )}
        />
        <Controller
          control={control}
          name="college_university"
          render={({ field: { value, onChange } }) => (
            <TextField label="College / University" value={value} onChangeText={onChange} placeholder="School or University" />
          )}
        />
        <Controller
          control={control}
          name="teams"
          render={({ field: { value, onChange } }) => <TeamsInput value={value} onChange={onChange} />}
        />
      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
          Batting Career Stats
        </Text>
      <StatTable
        title="Batting Career Stats"
        control={control}
        name="batting"
        emptyRow={EMPTY_BATTING_ROW}
        columns={[
          { key: 'match_type_id', label: 'Match Type', type: 'select', options: matchTypeOptions },
          { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
          { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
          { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'innings', label: 'Innings', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'highest_score', label: 'High Score', type: 'number' },
          { key: 'average', label: 'Average', type: 'text' },
          { key: 'strike_rate', label: 'Strike Rate', type: 'text' },
          { key: 'hundreds', label: '100s', type: 'number' },
          { key: 'fifties', label: '50s', type: 'number' },
          { key: 'fours', label: '4s', type: 'number' },
          { key: 'sixes', label: '6s', type: 'number' },
          { key: 'catches', label: 'Catches', type: 'number' },
          { key: 'stumpings', label: 'Stumpings (Successful)', type: 'number' },
          { key: 'stumps_missing', label: 'Stumpings (Missed)', type: 'number' },
          { key: 'run_outs', label: 'Run Outs', type: 'number' },
          { key: 'direct_hits', label: 'Direct Hits', type: 'number' },
          { key: 'runs_saved', label: 'Runs Saved', type: 'number' },
          { key: 'runs_giving', label: 'Runs Giving', type: 'number' },
        ]}
      />

      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
          Bowling Career Stats
        </Text>
      <StatTable
        title="Bowling Career Stats"
        control={control}
        name="bowling"
        emptyRow={EMPTY_BOWLING_ROW}
        columns={[
          { key: 'match_type_id', label: 'Match Type', type: 'select', options: matchTypeOptions },
          { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
          { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
          { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'innings', label: 'Innings', type: 'number' },
          { key: 'overs', label: 'Overs', type: 'text' },
          { key: 'dot_balls', label: 'Dot Balls', type: 'number' },
          { key: 'wide_balls', label: 'Wide Balls', type: 'number' },
          { key: 'no_balls', label: 'No Balls', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'wickets', label: 'Wickets', type: 'number' },
          { key: 'best_bowling', label: 'Best Bowling', type: 'text' },
          { key: 'average', label: 'Average', type: 'text' },
          { key: 'economy', label: 'Economy', type: 'text' },
          { key: 'five_wickets', label: '5w', type: 'number' },
        ]}
      />
      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
          Bowling Breakdown — Pitching Line
        </Text>
        <Text style={styles.sectionHint}>
          Career-to-date count of balls bowled at each pitching line.
        </Text>
        <View style={styles.breakdownGrid}>
          {lookups.pitching_lines.map((line) => (
            <Controller
              key={line.id}
              control={control}
              name={`pitching_line_breakdown.${line.id}`}
              render={({ field: { value, onChange } }) => (
                <View style={styles.breakdownItem}>
                  <TextField
                    label={line.name}
                    value={value ?? ''}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    placeholder="0"
                  />
                </View>
              )}
            />
          ))}
        </View>
      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
          Bowling Breakdown — Ball Type
        </Text>
        <Text style={styles.sectionHint}>
          Career-to-date count of balls bowled of each type.
        </Text>
        <View style={styles.breakdownGrid}>
          {lookups.ball_types.map((type) => (
            <Controller
              key={type.id}
              control={control}
              name={`ball_type_breakdown.${type.id}`}
              render={({ field: { value, onChange } }) => (
                <View style={styles.breakdownItem}>
                  <TextField
                    label={type.name}
                    value={value ?? ''}
                    onChangeText={onChange}
                    keyboardType="number-pad"
                    placeholder="0"
                  />
                </View>
              )}
            />
          ))}
        </View>
      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          Recent Matches
        </Text>
      <StatTable
        title="Recent Matches"
        control={control}
        name="recent_matches"
        emptyRow={EMPTY_RECENT_MATCH_ROW}
        columns={[
          { key: 'match_date', label: 'Date', type: 'date' },
          { key: 'opponent', label: 'Match vs', type: 'text' },
          { key: 'played_xi', label: 'Played XI', type: 'boolean' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'balls', label: 'Balls', type: 'number' },
          { key: 'fours', label: '4s', type: 'number' },
          { key: 'sixes', label: '6s', type: 'number' },
          { key: 'overs', label: 'Overs', type: 'text' },
          { key: 'maidens', label: 'Maidens', type: 'number' },
          { key: 'wickets', label: 'Wkts', type: 'number' },
          { key: 'catches', label: 'Catches', type: 'number' },
          { key: 'stumpings', label: 'Stumpings', type: 'number' },
        ]}
      />

      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
          Drop Catches
        </Text>
      <StatTable
        title="Drop Catches"
        control={control}
        name="drop_catches"
        emptyRow={EMPTY_DROP_CATCH_ROW}
        columns={[
          { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
          { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
          { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
          { key: 'field_position_id', label: 'Field Position', type: 'select', options: fieldPositionOptions, width: 160 },
          { key: 'drop_reason_id', label: 'How to Drop', type: 'select', options: dropReasonOptions, width: 200 },
        ]}
      />
      </View>

      <View style={[sportStyles.sectionCard, shadows.sm]}>
        <Text style={sportStyles.sectionTitle}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
          Reason for Matches Missed / Dropped
        </Text>
      <StatTable
        title="Missed/Dropped Matches"
        control={control}
        name="missed_matches"
        emptyRow={EMPTY_MISSED_MATCH_ROW}
        columns={[
          { key: 'match_date', label: 'Match Date', type: 'date' },
        ]}
      />
      </View>

      <Button label="Save Cricket Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
    </SportProfileLayout>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  topModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navyDark,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  topModeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  topModeTitle: {
    ...typography.subtitle,
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    ...shadows.sm,
  },
  previewButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  cardSection: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  coverBlock: {
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: -32,
    right: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerRowItem: {
    flex: 1,
  },
  sectionLabel: {
    ...typography.overline,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  breakdownItem: {
    width: 140,
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
});
