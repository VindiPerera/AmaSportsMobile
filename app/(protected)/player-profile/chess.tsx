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
import { chessService } from '../../../src/services/chessService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { calculateAge } from '../../../src/utils/date';
import { ChessProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', games: '', win: '', lost: '',
  third_place: '', second_place: '', champion: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', venue: '', win: false, lost: false, place: '',
};

const EMPTY_FORM: ChessProfileFormValues = {
  born: '', age: '', height: '', current_ranking: '', college_university: '',
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

export default function ChessProfileScreen() {
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

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<ChessProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, chessProfile] = await Promise.all([
          playerService.fetchProfile(),
          chessService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: chessProfile.born ?? '',
          age: toFormString(chessProfile.age),
          height: chessProfile.height ?? '',
          current_ranking: chessProfile.current_ranking ?? '',
          college_university: chessProfile.college_university ?? '',
          teams: chessProfile.teams ?? [],
          career_stats: chessProfile.career_stats.map((row) =>
            mapRow(row, Object.keys(EMPTY_CAREER_ROW))
          ) as unknown as ChessProfileFormValues['career_stats'],
          recent_matches: chessProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'venue', 'place']),
            win: Boolean(row.win),
            lost: Boolean(row.lost),
          })) as unknown as ChessProfileFormValues['recent_matches'],
        });
      } catch {
        setError('Could not load your Chess profile. Please try again.');
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

  const onSubmit = async (values: ChessProfileFormValues) => {
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
      await chessService.saveProfile(values);
      setIsViewing(true);
    } catch {
      setError('Could not save your Chess profile. Please check your entries and try again.');
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
      { label: 'CURRENT RANKING', value: formValues.current_ranking },
      { label: 'HEIGHT', value: formValues.height },
      { label: 'EDUCATION', value: formValues.college_university },
    ];

    const mappedRecent = (formValues.recent_matches || []).map((m) => ({
      match_date: m.match_date,
      opponent: m.opponent,
      scoreOrStat: m.place ? `Rank ${m.place}` : '--',
      result: m.win ? 'WIN' : (m.lost ? 'LOSS' : 'DRAW'),
    }));

    return (
      <PlayerSportDetailView
        sportName="Chess"
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        careerStatsHeader="Chess Stats"
        careerStatsColumns={[
          { key: 'format_id', label: 'Format', width: 90 },
          { key: 'games', label: 'Games', width: 55 },
          { key: 'win', label: 'Win', width: 50 },
          { key: 'lost', label: 'Lost', width: 50 },
          { key: 'champion', label: 'Title', width: 60 },
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
        <View style={styles.topModeTitleRow}>
          <Ionicons name="create-outline" size={18} color={colors.energy} />
          <Text style={styles.topModeTitle}>Editing Chess Profile</Text>
        </View>
        <Pressable style={styles.previewButton} onPress={() => setIsViewing(true)}>
          <Ionicons name="eye-outline" size={15} color={colors.white} />
          <Text style={styles.previewButtonText}>View Stats View</Text>
        </Pressable>
      </View>

      <View style={styles.cardSection}>
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
            <Dropdown label="Sport" value="chess" onChange={() => {}} options={[{ label: 'Chess', value: 'chess' }]} disabled />
          </View>
        </View>
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.sectionLabel}>Overview & Personal Details</Text>
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
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.sectionLabel}>Career Stats</Text>
        <StatTable
          title="Career Stats"
          control={control}
          name="career_stats"
          emptyRow={EMPTY_CAREER_ROW}
          columns={[
            { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
            { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
            { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
            { key: 'games', label: 'Games', type: 'number' },
            { key: 'win', label: 'Win', type: 'number' },
            { key: 'lost', label: 'Lost', type: 'number' },
            { key: 'third_place', label: '3rd Place', type: 'number' },
            { key: 'second_place', label: '2nd Place', type: 'number' },
            { key: 'champion', label: 'Champion', type: 'number' },
          ]}
        />
      </View>

      <View style={styles.cardSection}>
        <Text style={styles.sectionLabel}>Recent Matches</Text>
        <StatTable
          title="Recent Matches"
          control={control}
          name="recent_matches"
          emptyRow={EMPTY_RECENT_MATCH_ROW}
          columns={[
            { key: 'match_date', label: 'Date', type: 'date' },
            { key: 'opponent', label: 'Against', type: 'text' },
            { key: 'venue', label: 'Venue', type: 'text' },
            { key: 'win', label: 'Win', type: 'boolean' },
            { key: 'lost', label: 'Lost', type: 'boolean' },
            { key: 'place', label: 'Place', type: 'text' },
          ]}
        />
      </View>

      <Button label="Save Chess Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
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
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
});
