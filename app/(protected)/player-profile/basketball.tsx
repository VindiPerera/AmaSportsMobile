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
import { StatSectionWizard } from '../../../src/components/player/StatSectionWizard';
import { RecentMatchTable } from '../../../src/components/player/RecentMatchTable';
import { ViewOnlyBanner } from '../../../src/components/player/ViewOnlyBanner';
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { SportProfileLayout, sportStyles } from '../../../src/components/player/SportProfileLayout';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { basketballService } from '../../../src/services/basketballService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { DOMINANT_HAND_OPTIONS } from '../../../src/constants/commonOptions';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, BasketballProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', play_position: '', matches: '', win: '', lost: '',
  points: '', rebounds: '', assists: '', blocks: '', steals: '', minutes: '', year: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', venue: '', play_position: '', win: false, lost: false,
  points: '', rebounds: '', assists: '', blocks: '', steals: '', minutes: '',
};

const EMPTY_FORM: BasketballProfileFormValues = {
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

export default function BasketballProfileScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [isViewing, setIsViewing] = useState(mode === 'view');

  const lookups = useLookupStore((s) => s.lookups);
  const ensureLoaded = useLookupStore((s) => s.ensureLoaded);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [careerLocked, setCareerLocked] = useState(false);
  const [recentLocked, setRecentLocked] = useState(false);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [coverPicked, setCoverPicked] = useState<PickedImage | null>(null);
  const [avatarPicked, setAvatarPicked] = useState<PickedImage | null>(null);

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<BasketballProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, basketballProfile] = await Promise.all([
          playerService.fetchProfile(),
          basketballService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: basketballProfile.born ?? '',
          age: toFormString(basketballProfile.age),
          height: basketballProfile.height ?? '',
          dominant_hand: basketballProfile.dominant_hand ?? '',
          player_position: basketballProfile.player_position ?? '',
          college_university: basketballProfile.college_university ?? '',
          teams: basketballProfile.teams ?? [],
          career_stats: basketballProfile.career_stats.map((row) =>
            mapRow(row, Object.keys(EMPTY_CAREER_ROW))
          ) as unknown as BasketballProfileFormValues['career_stats'],
          recent_matches: basketballProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'venue', 'play_position', 'points', 'rebounds', 'assists', 'blocks', 'steals', 'minutes']),
            win: Boolean(row.win),
            lost: Boolean(row.lost),
          })) as unknown as BasketballProfileFormValues['recent_matches'],
        });
      } catch {
        setError('Could not load your Basketball profile. Please try again.');
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

  const onSubmit = async (values: BasketballProfileFormValues) => {
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
      await basketballService.saveProfile(values);
      await useAuthStore.getState().refreshProfile();
      setIsViewing(true);
      setCareerLocked(false);
      setRecentLocked(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save your Basketball profile. Please check your entries and try again.'
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

  const formatOptions = lookups.formats.map((f) => ({ label: f.name, value: String(f.id) }));
  const ageOptions = lookups.age_categories.map((a) => ({ label: a.name, value: String(a.id) }));
  const categoryOptions = lookups.match_categories.map((c) => ({ label: c.name, value: String(c.id) }));
  const labelFor = (options: { label: string; value: string }[], id: unknown) =>
    options.find((o) => o.value === String(id ?? ''))?.label ?? String(id ?? '-');

  if (isViewing) {
    const fields = [
      { label: 'POSITION', value: formValues.player_position },
      { label: 'DOMINANT HAND', value: formValues.dominant_hand },
      { label: 'HEIGHT', value: formValues.height },
      { label: 'EDUCATION', value: formValues.college_university },
    ];

    const careerRows = (formValues.career_stats || []).map((r) => ({
      ...r,
      format_id: labelFor(formatOptions, r.format_id),
      age_category_id: labelFor(ageOptions, r.age_category_id),
      match_category_id: labelFor(categoryOptions, r.match_category_id),
    }));

    return (
      <PlayerSportDetailView
        sportName="Basketball"
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        coverUrl={coverPicked?.uri || existingCoverUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        statCards={[
          {
            header: 'Basketball Stats',
            columns: [
              { key: 'year', label: 'Year', width: 55 },
              { key: 'format_id', label: 'Format', width: 90 },
              { key: 'age_category_id', label: 'Age', width: 70 },
              { key: 'match_category_id', label: 'Category', width: 90 },
              { key: 'play_position', label: 'Play Position', width: 95 },
              { key: 'matches', label: 'Mat', width: 45 },
              { key: 'win', label: 'Win', width: 45 },
              { key: 'lost', label: 'Lost', width: 45 },
              { key: 'points', label: 'PTS', width: 50 },
              { key: 'rebounds', label: 'REB', width: 50 },
              { key: 'assists', label: 'AST', width: 50 },
              { key: 'blocks', label: 'BLK', width: 50 },
              { key: 'steals', label: 'STL', width: 50 },
              { key: 'minutes', label: 'MIN', width: 50 },
            ],
            rows: careerRows,
          },
        ]}
        recentCards={[
          {
            header: 'Recent Matches',
            columns: [
              { key: 'match_date', label: 'Date', width: 85 },
              { key: 'opponent', label: 'Opponent', width: 110 },
              { key: 'venue', label: 'Venue', width: 100 },
              { key: 'play_position', label: 'Play Position', width: 95 },
              { key: 'result', label: 'Result', width: 60 },
              { key: 'points', label: 'PTS', width: 50 },
              { key: 'rebounds', label: 'REB', width: 50 },
              { key: 'assists', label: 'AST', width: 50 },
              { key: 'blocks', label: 'BLK', width: 50 },
              { key: 'steals', label: 'STL', width: 50 },
              { key: 'minutes', label: 'MIN', width: 50 },
            ],
            rows: (formValues.recent_matches || []).map((m) => ({
              ...m,
              result: m.win ? 'WIN' : m.lost ? 'LOSS' : '-',
            })),
          },
        ]}
        onEditPress={() => setIsViewing(false)}
        onBackPress={() => router.back()}
      />
    );
  }

  return (
    <SportProfileLayout
      sportName="Basketball"
      sportIcon="basketball"
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
        <TextField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Dropdown label="Country" value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
          </View>
          <View style={styles.headerRowItem}>
            <Dropdown label="Sport" value="basketball" onChange={() => {}} options={[{ label: 'Basketball', value: 'basketball' }]} disabled />
          </View>
        </View>
        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="born"
              render={({ field: { value, onChange } }) => (
                <DateField label="Born" value={value} onChange={(isoDate) => handleBornChange(isoDate, onChange)} />
              )}
            />
          </View>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="age"
              render={({ field: { value, onChange } }) => (
                <TextField label="Age" value={value} onChangeText={onChange} keyboardType="number-pad" />
              )}
            />
          </View>
        </View>
        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="height"
              render={({ field: { value, onChange } }) => (
                <TextField label="Height" value={value} onChangeText={onChange} />
              )}
            />
          </View>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="dominant_hand"
              render={({ field: { value, onChange } }) => (
                <Dropdown label="Dominant Hand" value={value} onChange={onChange} options={DOMINANT_HAND_OPTIONS} />
              )}
            />
          </View>
        </View>
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
      </View>

      <StatSectionWizard
        title="Career Status"
        addLabel="Add New Stat"
        control={control}
        name="career_stats"
        emptyRow={EMPTY_CAREER_ROW}
        identityKey={['format_id', 'age_category_id', 'match_category_id', 'year']}
        locked={careerLocked}
        onEntryAdded={() => setCareerLocked(true)}
        detailColumns={[
          { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
          { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
          { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
          { key: 'play_position', label: 'Play Position', type: 'text' },
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'win', label: 'Win', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
          { key: 'points', label: 'Points', type: 'number' },
          { key: 'rebounds', label: 'Rebounds', type: 'number' },
          { key: 'assists', label: 'Assists', type: 'number' },
          { key: 'blocks', label: 'Blocks', type: 'number' },
          { key: 'steals', label: 'Steals', type: 'number' },
          { key: 'minutes', label: 'Minutes', type: 'number' },
        ]}
      />

      <RecentMatchTable
        title="Recent Matches"
        addLabel="Add New Match"
        control={control}
        name="recent_matches"
        emptyRow={EMPTY_RECENT_MATCH_ROW}
        locked={recentLocked}
        onEntryAdded={() => setRecentLocked(true)}
        columns={[
          { key: 'match_date', label: 'Date', type: 'date' },
          { key: 'opponent', label: 'Match vs', type: 'text' },
          { key: 'venue', label: 'Venue', type: 'text' },
          { key: 'play_position', label: 'Play Position', type: 'text' },
          { key: 'win', label: 'Win', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          { key: 'points', label: 'Points', type: 'number' },
          { key: 'rebounds', label: 'Rebounds', type: 'number' },
          { key: 'assists', label: 'Assists', type: 'number' },
          { key: 'blocks', label: 'Blocks', type: 'number' },
          { key: 'steals', label: 'Steals', type: 'number' },
          { key: 'minutes', label: 'Minutes', type: 'number' },
        ]}
      />

      <Button
        label="Save Basketball Profile"
        onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton}
      />
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
