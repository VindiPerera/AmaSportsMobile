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
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { playerService } from '../../../src/services/playerService';
import { baseBallService } from '../../../src/services/baseBallService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { DOMINANT_HAND_OPTIONS } from '../../../src/constants/hockeyOptions';
import { calculateAge } from '../../../src/utils/date';
import { BaseBallProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', matches: '', nt: '',
  at_bats: '', runs: '', hits: '', rbi: '', won: '', lost: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', venue: '', won: false, lost: false, runs: '',
};

const EMPTY_FORM: BaseBallProfileFormValues = {
  born: '', age: '', height: '', dominant_hand: '', player_position: '', college_university: '',
  teams: [], career_stats: [], recent_matches: [],
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

export default function BaseBallProfileScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [isViewing, setIsViewing] = useState(mode !== 'edit');

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

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<BaseBallProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, baseBallProfile] = await Promise.all([
          playerService.fetchProfile(),
          baseBallService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: baseBallProfile.born ?? '',
          age: toFormString(baseBallProfile.age),
          height: baseBallProfile.height ?? '',
          dominant_hand: baseBallProfile.dominant_hand ?? '',
          player_position: baseBallProfile.player_position ?? '',
          college_university: baseBallProfile.college_university ?? '',
          teams: baseBallProfile.teams ?? [],
          career_stats: baseBallProfile.career_stats.map((row) =>
            mapRow(row, Object.keys(EMPTY_CAREER_ROW))
          ) as unknown as BaseBallProfileFormValues['career_stats'],
          recent_matches: baseBallProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'venue', 'runs']),
            won: Boolean(row.won),
            lost: Boolean(row.lost),
          })) as unknown as BaseBallProfileFormValues['recent_matches'],
        });
      } catch {
        setError('Could not load your Baseball profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [ensureLoaded, reset]);

  const handleBornChange = (isoDate: string, onChange: (value: string) => void) => {
    onChange(isoDate);
    if (!getValues('age')) {
      const computed = calculateAge(isoDate);
      if (computed !== null) setValue('age', String(computed));
    }
  };

  const onSubmit = async (values: BaseBallProfileFormValues) => {
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
      await baseBallService.saveProfile(values);
      setIsViewing(true);
    } catch {
      setError('Could not save your Baseball profile. Please check your entries and try again.');
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
      { label: 'POSITION', value: formValues.player_position },
      { label: 'DOMINANT HAND', value: formValues.dominant_hand },
      { label: 'HEIGHT', value: formValues.height },
      { label: 'EDUCATION', value: formValues.college_university },
    ];

    const mappedRecent = (formValues.recent_matches || []).map((m) => ({
      match_date: m.match_date,
      opponent: m.opponent,
      scoreOrStat: m.runs ? `${m.runs} Runs` : '--',
      result: m.won ? 'WIN' : (m.lost ? 'LOSS' : 'DRAW'),
    }));

    return (
      <PlayerSportDetailView
        sportName="Baseball"
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        careerStatsHeader="Baseball Stats"
        careerStatsColumns={[
          { key: 'format_id', label: 'Format', width: 90 },
          { key: 'matches', label: 'Mat', width: 50 },
          { key: 'at_bats', label: 'AB', width: 50 },
          { key: 'runs', label: 'Runs', width: 55 },
          { key: 'hits', label: 'Hits', width: 50 },
        ]}
        careerStatsRows={formValues.career_stats}
        recentMatches={mappedRecent}
        onEditPress={() => setIsViewing(false)}
        onBackPress={() => router.back()}
      />
    );
  }

  const formatOptions = lookups.formats.map((f) => ({ label: f.name, value: String(f.id) }));
  const ageOptions = lookups.age_categories.map((a) => ({ label: a.name, value: String(a.id) }));
  const categoryOptions = lookups.match_categories.map((c) => ({ label: c.name, value: String(c.id) }));

  return (
    <ScreenContainer edges={['bottom']} scroll>
      <ErrorBanner message={error} />

      <View style={styles.topModeBar}>
        <Text style={styles.topModeTitle}>Editing Baseball Profile</Text>
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
          <Dropdown label="Sport" value="base-ball" onChange={() => {}} options={[{ label: 'Base Ball', value: 'base-ball' }]} disabled />
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
        name="player_position"
        render={({ field: { value, onChange } }) => (
          <TextField label="Player Position" value={value} onChangeText={onChange} />
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

      <Text style={styles.sectionLabel}>Career Status</Text>
      <StatTable
        title="Career Status"
        control={control}
        name="career_stats"
        emptyRow={EMPTY_CAREER_ROW}
        columns={[
          { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
          { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
          { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'nt', label: 'NT', type: 'number' },
          { key: 'at_bats', label: 'At Bats', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'hits', label: 'Hits', type: 'number' },
          { key: 'rbi', label: 'RBI', type: 'number' },
          { key: 'won', label: 'Won', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
        ]}
      />

      <Text style={styles.sectionLabel}>Recent Match</Text>
      <StatTable
        title="Recent Match"
        control={control}
        name="recent_matches"
        emptyRow={EMPTY_RECENT_MATCH_ROW}
        columns={[
          { key: 'match_date', label: 'Date', type: 'date' },
          { key: 'opponent', label: 'Match vs', type: 'text' },
          { key: 'venue', label: 'Venue', type: 'text' },
          { key: 'won', label: 'Won', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          { key: 'runs', label: 'Runs', type: 'number' },
        ]}
      />

      <Button label="Save Baseball Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
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
