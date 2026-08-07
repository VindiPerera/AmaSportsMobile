import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
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
import { colors, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { playerService } from '../../../src/services/playerService';
import { rugbyService } from '../../../src/services/rugbyService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { calculateAge } from '../../../src/utils/date';
import { PickedImage, RugbyProfileFormValues } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', matches: '', win: '', lost: '',
  tries: '', conversion: '', penalty_kick: '', drop_goal: '', yellow_card: '', red_card: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', win: false, lost: false,
  tries: '', conversion: '', penalty_kick: '', drop_goal: '', yellow_card: '', red_card: '',
};

const EMPTY_FORM: RugbyProfileFormValues = {
  born: '', age: '', height: '', weight: '', player_position: '', college_university: '',
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

export default function RugbyProfileScreen() {
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

  const { control, handleSubmit, reset, setValue, getValues } = useForm<RugbyProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, rugbyProfile] = await Promise.all([
          playerService.fetchProfile(),
          rugbyService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: rugbyProfile.born ?? '',
          age: toFormString(rugbyProfile.age),
          height: rugbyProfile.height ?? '',
          weight: rugbyProfile.weight ?? '',
          player_position: rugbyProfile.player_position ?? '',
          college_university: rugbyProfile.college_university ?? '',
          teams: rugbyProfile.teams ?? [],
          career_stats: rugbyProfile.career_stats.map((row) =>
            mapRow(row, Object.keys(EMPTY_CAREER_ROW))
          ) as unknown as RugbyProfileFormValues['career_stats'],
          recent_matches: rugbyProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'tries', 'conversion', 'penalty_kick', 'drop_goal', 'yellow_card', 'red_card']),
            win: Boolean(row.win),
            lost: Boolean(row.lost),
          })) as unknown as RugbyProfileFormValues['recent_matches'],
        });
      } catch {
        setError('Could not load your Rugby profile. Please try again.');
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

  const onSubmit = async (values: RugbyProfileFormValues) => {
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
      await rugbyService.saveProfile(values);
      router.replace('/(protected)/(tabs)/player-profile');
    } catch {
      setError('Could not save your Rugby profile. Please check your entries and try again.');
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

  return (
    <ScreenContainer edges={['bottom']} scroll>
      <ErrorBanner message={error} />

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
          <Dropdown label="Sport" value="rugby" onChange={() => {}} options={[{ label: 'Rugby', value: 'rugby' }]} disabled />
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
          { key: 'win', label: 'Win', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
          { key: 'tries', label: 'Try', type: 'number' },
          { key: 'conversion', label: 'Conversion', type: 'number' },
          { key: 'penalty_kick', label: 'Penalty Kick', type: 'number' },
          { key: 'drop_goal', label: 'Drop Goal', type: 'number' },
          { key: 'yellow_card', label: 'Yellow Card', type: 'number' },
          { key: 'red_card', label: 'Red Card', type: 'number' },
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
          { key: 'win', label: 'Win', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          { key: 'tries', label: 'Try', type: 'number' },
          { key: 'conversion', label: 'Conversion', type: 'number' },
          { key: 'penalty_kick', label: 'Penalty Kick', type: 'number' },
          { key: 'drop_goal', label: 'Drop Goal', type: 'number' },
          { key: 'yellow_card', label: 'Yellow Card', type: 'number' },
          { key: 'red_card', label: 'Red Card', type: 'number' },
        ]}
      />

      <Button label="Submit" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
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
