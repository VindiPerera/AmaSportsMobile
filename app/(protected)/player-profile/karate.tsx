import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { karateService } from '../../../src/services/karateService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, KarateProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', matches: '', fights: '', win: '', lost: '',
  stats: '', weight_category: '', age_category: '', third_place: '', second_place: '', champion: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', venue: '', win: false, lost: false,
  stats: '', weight_category: '', age_category: '', place: '',
};

const EMPTY_FORM: KarateProfileFormValues = {
  born: '', age: '', height: '', weight: '', player_style_id: '', current_ranking: '',
  college_university: '', teams: [], career_stats: [], recent_matches: [],
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

export default function KarateProfileScreen() {
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

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<KarateProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, karateProfile] = await Promise.all([
          playerService.fetchProfile(),
          karateService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: karateProfile.born ?? '',
          age: toFormString(karateProfile.age),
          height: karateProfile.height ?? '',
          weight: karateProfile.weight ?? '',
          player_style_id: toFormString(karateProfile.player_style_id),
          current_ranking: karateProfile.current_ranking ?? '',
          college_university: karateProfile.college_university ?? '',
          teams: karateProfile.teams ?? [],
          career_stats: karateProfile.career_stats.map((row) =>
            mapRow(row, Object.keys(EMPTY_CAREER_ROW))
          ) as unknown as KarateProfileFormValues['career_stats'],
          recent_matches: karateProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'venue', 'stats', 'weight_category', 'age_category', 'place']),
            win: Boolean(row.win),
            lost: Boolean(row.lost),
          })) as unknown as KarateProfileFormValues['recent_matches'],
        });
      } catch {
        setError('Could not load your Karate profile. Please try again.');
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

  const onSubmit = async (values: KarateProfileFormValues) => {
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
      await karateService.saveProfile(values);
      setIsViewing(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save your Karate profile. Please check your entries and try again.'
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
      { label: 'HEIGHT', value: formValues.height },
      { label: 'WEIGHT', value: formValues.weight },
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
        sportName="Karate"
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        careerStatsHeader="Karate Fight Stats"
        careerStatsColumns={[
          { key: 'format_id', label: 'Format', width: 90 },
          { key: 'matches', label: 'Bouts', width: 55 },
          { key: 'win', label: 'Win', width: 50 },
          { key: 'lost', label: 'Lost', width: 50 },
          { key: 'champion', label: 'Gold', width: 55 },
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
  const styleOptions = lookups.karate_styles.map((s) => ({ label: s.name, value: String(s.id) }));

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll>
      {/* Hero Navigation Banner */}
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, shadows.md]}
      >
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </Pressable>
          <View style={styles.sportBadge}>
            <Ionicons name="body" size={14} color={colors.energy} />
            <Text style={styles.sportBadgeText}>KARATE PROFILE</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>{fullName || 'Karate Athlete'}</Text>
        <Text style={styles.headerSubtitle}>
          {isViewOnly
            ? 'Viewing career statistics, physical stats, and match history.'
            : 'Edit career statistics, physical stats, and match history.'}
        </Text>
      </LinearGradient>

      <ErrorBanner message={error} />

      {/* Cover & Avatar Upload Block */}
      <View style={styles.coverBlock}>
        <CoverPhotoUpload existingUrl={existingCoverUrl} picked={coverPicked} onPick={setCoverPicked} />
        <View style={styles.avatarOverlay}>
          <AvatarPhotoUpload existingUrl={existingPhotoUrl} picked={avatarPicked} onPick={setAvatarPicked} />
        </View>
      </View>

      {/* Form Section 1: Overview */}
      <View style={[styles.sectionCard, shadows.sm]}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionCardTitle}>Player Overview</Text>
        </View>

        <TextField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter full name" />
        
        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Dropdown label="Country" value={country} onChange={setCountry} options={COUNTRY_OPTIONS} />
          </View>
          <View style={styles.headerRowItem}>
            <Dropdown label="Sport" value="karate" onChange={() => {}} options={[{ label: 'Karate', value: 'karate' }]} disabled />
          </View>
        </View>

        <Controller
          control={control}
          name="born"
          render={({ field: { value, onChange } }) => (
            <DateField label="Date of Birth" value={value} onChange={(isoDate) => handleBornChange(isoDate, onChange)} />
          )}
        />

        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="age"
              render={({ field: { value, onChange } }) => (
                <TextField label="Age" value={value} onChangeText={onChange} keyboardType="number-pad" placeholder="e.g. 24" />
              )}
            />
          </View>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="height"
              render={({ field: { value, onChange } }) => (
                <TextField label="Height" value={value} onChangeText={onChange} placeholder="e.g. 178 cm" />
              )}
            />
          </View>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="weight"
              render={({ field: { value, onChange } }) => (
                <TextField label="Weight" value={value} onChangeText={onChange} placeholder="e.g. 75 kg" />
              )}
            />
          </View>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="player_style_id"
              render={({ field: { value, onChange } }) => (
                <Dropdown label="Player Style" value={value} onChange={onChange} options={styleOptions} placeholder="Select style" />
              )}
            />
          </View>
        </View>

        <Controller
          control={control}
          name="current_ranking"
          render={({ field: { value, onChange } }) => (
            <TextField label="Current Ranking" value={value} onChangeText={onChange} placeholder="e.g. National #1" />
          )}
        />

        <Controller
          control={control}
          name="college_university"
          render={({ field: { value, onChange } }) => (
            <TextField label="College / University" value={value} onChangeText={onChange} placeholder="University name" />
          )}
        />

        <Controller
          control={control}
          name="teams"
          render={({ field: { value, onChange } }) => <TeamsInput value={value} onChange={onChange} />}
        />
      </View>

      {/* Form Section 2: Career Status Table */}
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
          { key: 'fights', label: 'Fights', type: 'number' },
          { key: 'win', label: 'Win', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
          { key: 'stats', label: 'Stats', type: 'text' },
          { key: 'weight_category', label: 'Weight Cat.', type: 'text' },
          { key: 'age_category', label: 'Age Cat.', type: 'text' },
          { key: 'third_place', label: '3rd Place', type: 'number' },
          { key: 'second_place', label: '2nd Place', type: 'number' },
          { key: 'champion', label: 'Champion', type: 'number' },
        ]}
      />

      {/* Form Section 3: Recent Matches Table */}
      <StatTable
        title="Recent Matches"
        control={control}
        name="recent_matches"
        emptyRow={EMPTY_RECENT_MATCH_ROW}
        columns={[
          { key: 'match_date', label: 'Date', type: 'date' },
          { key: 'opponent', label: 'Fight vs', type: 'text' },
          { key: 'venue', label: 'Venue', type: 'text' },
          { key: 'win', label: 'Win', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          { key: 'stats', label: 'Stats', type: 'text' },
          { key: 'weight_category', label: 'Weight Cat.', type: 'text' },
          { key: 'age_category', label: 'Age Cat.', type: 'text' },
          { key: 'place', label: 'Place', type: 'text' },
        ]}
      />

      <Button label="Save Karate Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  viewOnlyContent: {
    opacity: 0.7,
  },
  heroHeader: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  sportBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
  },
  headerSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
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
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionCardTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerRowItem: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.md,
    marginBottom: spacing['2xl'],
  },
});
