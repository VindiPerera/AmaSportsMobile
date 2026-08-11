import React, { useEffect, useMemo, useState } from 'react';
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
import { StatTable, StatColumn } from '../../../src/components/player/StatTable';
import { ViewOnlyBanner } from '../../../src/components/player/ViewOnlyBanner';
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { playerService } from '../../../src/services/playerService';
import { racketSportService } from '../../../src/services/racketSportService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { DOMINANT_HAND_OPTIONS } from '../../../src/constants/hockeyOptions';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, PickedImage, RacketSportProfileFormValues } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', matches: '', win: '', lost: '',
  set_win: '', set_lost: '', quarter_final: '', semi_final: '', third_place: '', second_place: '', champion: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', win: false, lost: false,
  set_1: '', set_2: '', set_3: '', set_4: '', set_5: '',
};

const EMPTY_FORM: RacketSportProfileFormValues = {
  born: '', age: '', height: '', dominant_hand: '', weight: '', current_ranking: '', college_university: '',
  teams: [], single_stats: [], double_stats: [], mix_double_stats: [], recent_matches: [],
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

const CAREER_ROW_KEYS = Object.keys(EMPTY_CAREER_ROW);

/** Sport display names — the shared form's title/labels adapt to whichever of the three was picked. */
const SPORT_LABELS: Record<string, string> = {
  tennis: 'Tennis',
  badminton: 'Badminton',
  'table-tennis': 'Table Tennis',
};

export default function RacketSportProfileScreen() {
  const { mode, sport: sportSlug } = useLocalSearchParams<{ mode?: string; sport?: string }>();
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

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<RacketSportProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  const sport = useMemo(
    () => lookups?.sports.find((s) => s.slug === sportSlug) ?? null,
    [lookups, sportSlug]
  );
  const sportLabel = SPORT_LABELS[sportSlug ?? ''] ?? 'Tennis / Badminton';

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
      } catch {
        setError('Could not load form options. Please try again.');
        setIsLoading(false);
      }
    })();
  }, [ensureLoaded]);

  useEffect(() => {
    if (!sport) return;

    (async () => {
      try {
        const [profile, racketProfile] = await Promise.all([
          playerService.fetchProfile(),
          racketSportService.fetchProfile(sport.id),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        const singleStats = racketProfile.career_stats.filter((row) => row.category === 'single');
        const doubleStats = racketProfile.career_stats.filter((row) => row.category === 'double');
        const mixDoubleStats = racketProfile.career_stats.filter((row) => row.category === 'mix_double');

        reset({
          born: racketProfile.born ?? '',
          age: toFormString(racketProfile.age),
          height: racketProfile.height ?? '',
          dominant_hand: racketProfile.dominant_hand ?? '',
          weight: racketProfile.weight ?? '',
          current_ranking: racketProfile.current_ranking ?? '',
          college_university: racketProfile.college_university ?? '',
          teams: racketProfile.teams ?? [],
          single_stats: singleStats.map((row) => mapRow(row, CAREER_ROW_KEYS)) as unknown as RacketSportProfileFormValues['single_stats'],
          double_stats: doubleStats.map((row) => mapRow(row, CAREER_ROW_KEYS)) as unknown as RacketSportProfileFormValues['double_stats'],
          mix_double_stats: mixDoubleStats.map((row) => mapRow(row, CAREER_ROW_KEYS)) as unknown as RacketSportProfileFormValues['mix_double_stats'],
          recent_matches: racketProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'set_1', 'set_2', 'set_3', 'set_4', 'set_5']),
            win: Boolean(row.win),
            lost: Boolean(row.lost),
          })) as unknown as RacketSportProfileFormValues['recent_matches'],
        });
      } catch {
        setError(`Could not load your ${sportLabel} profile. Please try again.`);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport?.id]);

  const handleBornChange = (isoDate: string, onChange: (value: string) => void) => {
    onChange(isoDate);
    if (!getValues('age')) {
      const computed = calculateAge(isoDate);
      if (computed !== null) setValue('age', String(computed));
    }
  };

  const onSubmit = async (values: RacketSportProfileFormValues) => {
    if (!sport) return;
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await playerService.updateProfile({
        full_name: fullName.trim(),
        country: country || undefined,
        cover_photo: coverPicked,
        photo: avatarPicked,
      });
      await racketSportService.saveProfile(sport.id, values);
      setIsViewing(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Could not save your ${sportLabel} profile. Please check your entries and try again.`
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

  if (isViewing) {
    const fields = [
      { label: 'RANKING', value: formValues.current_ranking },
      { label: 'PLAYING HAND', value: formValues.dominant_hand },
      { label: 'HEIGHT', value: formValues.height },
      { label: 'WEIGHT', value: formValues.weight },
    ];

    const mappedRecent = (formValues.recent_matches || []).map((m) => ({
      match_date: m.match_date,
      opponent: m.opponent,
      scoreOrStat: m.set_1 ? `Sets: ${m.set_1}-${m.set_2}` : '--',
      result: m.win ? 'WIN' : (m.lost ? 'LOSS' : 'DRAW'),
    }));

    const combinedCareerStats = [
      ...(formValues.single_stats || []),
      ...(formValues.double_stats || []),
      ...(formValues.mix_double_stats || []),
    ];

    return (
      <PlayerSportDetailView
        sportName={sportLabel}
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        careerStatsHeader={`${sportLabel} Stats`}
        careerStatsColumns={[
          { key: 'format_id', label: 'Format', width: 90 },
          { key: 'matches', label: 'Mat', width: 50 },
          { key: 'win', label: 'Win', width: 50 },
          { key: 'lost', label: 'Lost', width: 50 },
          { key: 'champion', label: 'Titles', width: 55 },
        ]}
        careerStatsRows={combinedCareerStats}
        recentMatches={mappedRecent}
        onEditPress={() => setIsViewing(false)}
        onBackPress={() => router.back()}
      />
    );
  }

  const formatOptions = lookups.formats.map((f) => ({ label: f.name, value: String(f.id) }));
  const ageOptions = lookups.age_categories.map((a) => ({ label: a.name, value: String(a.id) }));
  const categoryOptions = lookups.match_categories.map((c) => ({ label: c.name, value: String(c.id) }));

  const careerColumns: StatColumn[] = [
    { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
    { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
    { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
    { key: 'matches', label: 'Matches', type: 'number' },
    { key: 'win', label: 'Win', type: 'number' },
    { key: 'lost', label: 'Lost', type: 'number' },
    { key: 'set_win', label: 'Set Win', type: 'number' },
    { key: 'set_lost', label: 'Set Lost', type: 'number' },
    { key: 'quarter_final', label: 'Quarter Final', type: 'number' },
    { key: 'semi_final', label: 'Semi Final', type: 'number' },
    { key: 'third_place', label: '3rd Place', type: 'number' },
    { key: 'second_place', label: '2nd Place', type: 'number' },
    { key: 'champion', label: 'Champion', type: 'number' },
  ];

  return (
    <ScreenContainer edges={['bottom']} scroll>
      <ErrorBanner message={error} />

      <View style={styles.topModeBar}>
        <Text style={styles.topModeTitle}>Editing {sportLabel} Profile</Text>
        <Pressable style={styles.previewButton} onPress={() => setIsViewing(true)}>
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
          <Text style={styles.previewButtonText}>View Player Stats</Text>
        </Pressable>
      </View>

      <View style={styles.coverBlock}>
        <CoverPhotoUpload existingUrl={existingCoverUrl} picked={coverPicked} onPick={setCoverPicked} />
        <View style={styles.avatarOverlay}>
          <AvatarPhotoUpload existingUrl={existingPhotoUrl} picked={avatarPicked} onPick={setAvatarPicked} />
        </View>
      </View>

      <TextField label="Player Name" value={fullName} onChangeText={setFullName} placeholder="Full name" />
      <View style={styles.headerRow}>
        <View style={styles.headerRowItem}>
          <Dropdown label="Country" value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
        </View>
        <View style={styles.headerRowItem}>
          <Dropdown label="Sport" value={sport.slug} onChange={() => {}} options={[{ label: sportLabel, value: sport.slug }]} disabled />
        </View>
      </View>

      <Text style={styles.sectionLabel}>Overview</Text>
      <TextField label="Full name" value={fullName} onChangeText={setFullName} />
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
        name="height"
        render={({ field: { value, onChange } }) => (
          <TextField label="Height" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="dominant_hand"
        render={({ field: { value, onChange } }) => (
          <Dropdown label="Dominant Hand" value={value} onChange={onChange} options={DOMINANT_HAND_OPTIONS} />
        )}
      />
      <Controller
        control={control}
        name="weight"
        render={({ field: { value, onChange } }) => (
          <TextField label="Weight" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="current_ranking"
        render={({ field: { value, onChange } }) => (
          <TextField label="Current Ranking" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="college_university"
        render={({ field: { value, onChange } }) => (
          <TextField label="College/University" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="teams"
        render={({ field: { value, onChange } }) => <TeamsInput value={value} onChange={onChange} />}
      />

      <Text style={styles.sectionLabel}>{sportLabel} career status</Text>
      <StatTable
        title="Career Status — Single"
        control={control}
        name="single_stats"
        emptyRow={EMPTY_CAREER_ROW}
        columns={careerColumns}
      />
      <StatTable
        title="Career Status — Double"
        control={control}
        name="double_stats"
        emptyRow={EMPTY_CAREER_ROW}
        columns={careerColumns}
      />
      <StatTable
        title="Career Status — Mix Double"
        control={control}
        name="mix_double_stats"
        emptyRow={EMPTY_CAREER_ROW}
        columns={careerColumns}
      />

      <Text style={styles.sectionLabel}>Recent Matches</Text>
      <StatTable
        title="Recent Matches"
        control={control}
        name="recent_matches"
        emptyRow={EMPTY_RECENT_MATCH_ROW}
        columns={[
          { key: 'match_date', label: 'Date', type: 'date' },
          { key: 'opponent', label: 'Match vs', type: 'text' },
          { key: 'win', label: 'Win', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          { key: 'set_1', label: '1st Set', type: 'text' },
          { key: 'set_2', label: '2nd Set', type: 'text' },
          { key: 'set_3', label: '3rd Set', type: 'text' },
          { key: 'set_4', label: '4th Set', type: 'text' },
          { key: 'set_5', label: '5th Set', type: 'text' },
        ]}
      />

      <Button label={`Save ${sportLabel} Profile`} onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
    </ScreenContainer>
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
    backgroundColor: colors.cardSubtle,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.xs,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topModeTitle: {
    ...typography.subtitle,
    color: colors.navy,
    fontWeight: '700',
    fontSize: 14,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  previewButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  coverBlock: {
    marginTop: spacing.md,
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
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing['2xl'],
  },
});
