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
import { EventPersonalBestInput } from '../../../src/components/player/EventPersonalBestInput';
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { SportProfileLayout, sportStyles } from '../../../src/components/player/SportProfileLayout';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { athleticsService } from '../../../src/services/athleticsService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, AthleticsProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', athletics_event_id: '',
  matches: '', third_place: '', second_place: '', champion: '',
};

const EMPTY_RECENT_EVENT_ROW = {
  event_date: '', age_category_id: '', match_category_id: '', matches: '', athletics_event_id: '', place: '',
};

const EMPTY_FORM: AthleticsProfileFormValues = {
  born: '', age: '', height: '', weight: '', college_university: '',
  teams: [], personal_bests: [], career_stats: [], recent_events: [],
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

export default function AthleticsProfileScreen() {
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

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<AthleticsProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, athleticsProfile] = await Promise.all([
          playerService.fetchProfile(),
          athleticsService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: athleticsProfile.born ?? '',
          age: toFormString(athleticsProfile.age),
          height: athleticsProfile.height ?? '',
          weight: athleticsProfile.weight ?? '',
          college_university: athleticsProfile.college_university ?? '',
          teams: athleticsProfile.teams ?? [],
          personal_bests: athleticsProfile.personal_bests.map((row) =>
            mapRow(row, ['athletics_event_id', 'personal_best'])
          ) as unknown as AthleticsProfileFormValues['personal_bests'],
          career_stats: athleticsProfile.career_stats.map((row) =>
            mapRow(row, Object.keys(EMPTY_CAREER_ROW))
          ) as unknown as AthleticsProfileFormValues['career_stats'],
          recent_events: athleticsProfile.recent_events.map((row) =>
            mapRow(row, Object.keys(EMPTY_RECENT_EVENT_ROW))
          ) as unknown as AthleticsProfileFormValues['recent_events'],
        });
      } catch {
        setError('Could not load your Athletics profile. Please try again.');
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

  const onSubmit = async (values: AthleticsProfileFormValues) => {
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
      await athleticsService.saveProfile(values);
      await useAuthStore.getState().refreshProfile();
      setIsViewing(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save your Athletics profile. Please check your entries and try again.'
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
      { label: 'HEIGHT', value: formValues.height },
      { label: 'WEIGHT', value: formValues.weight },
      { label: 'EDUCATION', value: formValues.college_university },
    ];

    const mappedRecent = (formValues.recent_events || []).map((e) => ({
      match_date: e.event_date,
      opponent: `Athletics Event ${e.athletics_event_id || ''}`,
      scoreOrStat: e.place ? `Place ${e.place}` : '--',
      result: e.place === '1' ? 'GOLD' : (e.place === '2' ? 'SILVER' : 'BRONZE'),
    }));

    return (
      <PlayerSportDetailView
        sportName="Athletics"
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        coverUrl={coverPicked?.uri || existingCoverUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        careerStatsHeader="Athletics Career Stats"
        careerStatsColumns={[
          { key: 'format_id', label: 'Format', width: 90 },
          { key: 'matches', label: 'Events', width: 55 },
          { key: 'champion', label: 'Gold', width: 50 },
          { key: 'second_place', label: 'Silver', width: 50 },
          { key: 'third_place', label: 'Bronze', width: 55 },
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
  const eventOptions = lookups.athletics_events.map((e) => ({ label: e.name, value: String(e.id) }));

  return (
    <SportProfileLayout
      sportName="Athletics"
      sportIcon="walk-outline"
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
            <Dropdown label="Sport" value="athletics" onChange={() => {}} options={[{ label: 'Athletics', value: 'athletics' }]} disabled />
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
              name="weight"
              render={({ field: { value, onChange } }) => (
                <TextField label="Weight" value={value} onChangeText={onChange} />
              )}
            />
          </View>
        </View>
        <Controller
          control={control}
          name="personal_bests"
          render={() => (
            <EventPersonalBestInput
              label="Events & Personal Best"
              control={control}
              name="personal_bests"
              eventIdKey="athletics_event_id"
              events={eventOptions}
            />
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
          render={({ field: { value, onChange } }) => <TeamsInput label="School or Team" value={value} onChange={onChange} />}
        />
      </View>

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
            { key: 'athletics_event_id', label: 'Event', type: 'select', options: eventOptions },
            { key: 'third_place', label: '3rd Place', type: 'number' },
            { key: 'second_place', label: '2nd Place', type: 'number' },
            { key: 'champion', label: 'Champion', type: 'number' },
          ]}
        />

      <StatTable
          title="Recent Events"
          control={control}
          name="recent_events"
          emptyRow={EMPTY_RECENT_EVENT_ROW}
          columns={[
            { key: 'event_date', label: 'Date', type: 'date' },
            { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
            { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
            { key: 'matches', label: 'Matches', type: 'number' },
            { key: 'athletics_event_id', label: 'Event', type: 'select', options: eventOptions },
            { key: 'place', label: 'Place', type: 'text' },
          ]}
        />

      <Button label="Save Athletics Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
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
