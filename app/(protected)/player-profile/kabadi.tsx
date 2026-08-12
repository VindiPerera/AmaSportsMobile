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
import { StatTable, StatColumn } from '../../../src/components/player/StatTable';
import { ViewOnlyBanner } from '../../../src/components/player/ViewOnlyBanner';
import { GlossaryDisclosure } from '../../../src/components/player/GlossaryDisclosure';
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { kabadiService } from '../../../src/services/kabadiService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { KABADI_GLOSSARY } from '../../../src/constants/kabadiGlossary';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, KabadiProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_STAT_FIELDS = {
  cbp: '', raids: '', successful_raids: '', unsuccessful_raids: '', raid_touch_point: '',
  raid_bonus_point: '', tackles: '', successful_tackles: '', unsuccessful_tackles: '',
  empty_raids: '', yellow_cards: '', green_cards: '', red_cards: '',
};

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', matches: '', win: '', lost: '',
  ...EMPTY_STAT_FIELDS,
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', venue: '', win: false, lost: false,
  ...EMPTY_STAT_FIELDS,
};

const EMPTY_FORM: KabadiProfileFormValues = {
  born: '', age: '', height: '', weight: '', player_position: '', college_university: '',
  teams: [], career_stats: [], recent_matches: [],
};

const STAT_COLUMNS: StatColumn[] = [
  { key: 'cbp', label: 'CBP', type: 'number' },
  { key: 'raids', label: 'R', type: 'number' },
  { key: 'successful_raids', label: 'SR', type: 'number' },
  { key: 'unsuccessful_raids', label: 'UR', type: 'number' },
  { key: 'raid_touch_point', label: 'RTP', type: 'number' },
  { key: 'raid_bonus_point', label: 'RBP', type: 'number' },
  { key: 'tackles', label: 'T', type: 'number' },
  { key: 'successful_tackles', label: 'ST', type: 'number' },
  { key: 'unsuccessful_tackles', label: 'UT', type: 'number' },
  { key: 'empty_raids', label: 'EM', type: 'number' },
  { key: 'yellow_cards', label: 'YC', type: 'number' },
  { key: 'green_cards', label: 'GC', type: 'number' },
  { key: 'red_cards', label: 'RC', type: 'number' },
];

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

export default function KabadiProfileScreen() {
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

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<KabadiProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, kabadiProfile] = await Promise.all([
          playerService.fetchProfile(),
          kabadiService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: kabadiProfile.born ?? '',
          age: toFormString(kabadiProfile.age),
          height: kabadiProfile.height ?? '',
          weight: kabadiProfile.weight ?? '',
          player_position: kabadiProfile.player_position ?? '',
          college_university: kabadiProfile.college_university ?? '',
          teams: kabadiProfile.teams ?? [],
          career_stats: kabadiProfile.career_stats.map((row) =>
            mapRow(row, Object.keys(EMPTY_CAREER_ROW))
          ) as unknown as KabadiProfileFormValues['career_stats'],
          recent_matches: kabadiProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'venue', ...Object.keys(EMPTY_STAT_FIELDS)]),
            win: Boolean(row.win),
            lost: Boolean(row.lost),
          })) as unknown as KabadiProfileFormValues['recent_matches'],
        });
      } catch {
        setError('Could not load your Kabadi profile. Please try again.');
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

  const onSubmit = async (values: KabadiProfileFormValues) => {
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
      await kabadiService.saveProfile(values);
      await useAuthStore.getState().refreshProfile();
      setIsViewing(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save your Kabadi profile. Please check your entries and try again.'
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
      { label: 'POSITION', value: formValues.player_position },
      { label: 'HEIGHT', value: formValues.height },
      { label: 'WEIGHT', value: formValues.weight },
      { label: 'EDUCATION', value: formValues.college_university },
    ];

    const mappedRecent = (formValues.recent_matches || []).map((m) => ({
      match_date: m.match_date,
      opponent: m.opponent,
      scoreOrStat: m.raids ? `${m.raids} Raids` : '--',
      result: m.win ? 'WIN' : (m.lost ? 'LOSS' : 'DRAW'),
    }));

    return (
      <PlayerSportDetailView
        sportName="Kabaddi"
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        careerStatsHeader="Kabaddi Stats"
        careerStatsColumns={[
          { key: 'format_id', label: 'Format', width: 90 },
          { key: 'matches', label: 'Mat', width: 50 },
          { key: 'raids', label: 'Raids', width: 55 },
          { key: 'successful_raids', label: 'Succ Raids', width: 75 },
          { key: 'tackles', label: 'Tackles', width: 60 },
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
        <Text style={styles.topModeTitle}>Editing Kabaddi Profile</Text>
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
          <Dropdown label="Sport" value="kabadi" onChange={() => {}} options={[{ label: 'Kabadi', value: 'kabadi' }]} disabled />
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
        name="weight"
        render={({ field: { value, onChange } }) => (
          <TextField label="Weight" value={value} onChangeText={onChange} />
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

      <GlossaryDisclosure items={KABADI_GLOSSARY} />

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
          { key: 'matches', label: 'M', type: 'number' },
          { key: 'win', label: 'Win', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
          ...STAT_COLUMNS,
        ]}
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
          { key: 'venue', label: 'Venue', type: 'text' },
          { key: 'win', label: 'Win', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          ...STAT_COLUMNS,
        ]}
      />

      <Button label="Save Kabaddi Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
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
