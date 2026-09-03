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
import { StatSectionWizard } from '../../../src/components/player/StatSectionWizard';
import { RecentMatchTable } from '../../../src/components/player/RecentMatchTable';
import { ViewOnlyBanner } from '../../../src/components/player/ViewOnlyBanner';
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { SportProfileLayout, sportStyles } from '../../../src/components/player/SportProfileLayout';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { karateService } from '../../../src/services/karateService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, KarateProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_CAREER_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', style: '', fights: '', win: '', lost: '',
  weight_category: '', third_place: '', second_place: '', champion: '', year: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', venue: '', style: '', win: false, lost: false,
  weight_category: '', age_category: '', place: '',
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
  const [careerLocked, setCareerLocked] = useState(false);
  const [recentLocked, setRecentLocked] = useState(false);

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
            ...mapRow(row, ['match_date', 'opponent', 'venue', 'style', 'weight_category', 'age_category', 'place']),
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
      await karateService.saveProfile(values);
      await useAuthStore.getState().refreshProfile();
      setIsViewing(true);
      setCareerLocked(false);
      setRecentLocked(false);
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

  const formatOptions = lookups.formats.map((f) => ({ label: f.name, value: String(f.id) }));
  const ageOptions = lookups.age_categories.map((a) => ({ label: a.name, value: String(a.id) }));
  const categoryOptions = lookups.match_categories.map((c) => ({ label: c.name, value: String(c.id) }));
  const styleOptions = lookups.karate_styles.map((s) => ({ label: s.name, value: String(s.id) }));
  const labelFor = (options: { label: string; value: string }[], id: unknown) =>
    options.find((o) => o.value === String(id ?? ''))?.label ?? String(id ?? '-');

  if (isViewing) {
    const fields = [
      { label: 'STYLE', value: labelFor(styleOptions, formValues.player_style_id) },
      { label: 'RANKING', value: formValues.current_ranking },
      { label: 'HEIGHT', value: formValues.height },
      { label: 'WEIGHT', value: formValues.weight },
      { label: 'EDUCATION', value: formValues.college_university },
    ];

    const careerRows = (formValues.career_stats || []).map((r) => ({
      ...r,
      format_id: labelFor(formatOptions, r.format_id),
      age_category_id: labelFor(ageOptions, r.age_category_id),
      match_category_id: labelFor(categoryOptions, r.match_category_id),
      style: labelFor(styleOptions, r.style),
    }));

    const recentRows = (formValues.recent_matches || []).map((m) => ({
      ...m,
      result: m.win ? 'WIN' : m.lost ? 'LOSS' : '-',
    }));

    return (
      <PlayerSportDetailView
        sportName="Karate"
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
            header: 'Karate Fight Stats',
            columns: [
              { key: 'year', label: 'Year', width: 55 },
              { key: 'format_id', label: 'Format', width: 90 },
              { key: 'age_category_id', label: 'Age', width: 70 },
              { key: 'match_category_id', label: 'Category', width: 90 },
              { key: 'style', label: 'Style', width: 85 },
              { key: 'fights', label: 'Total Fights', width: 80 },
              { key: 'win', label: 'Win', width: 45 },
              { key: 'lost', label: 'Lost', width: 45 },
              { key: 'weight_category', label: 'Weight Cat.', width: 80 },
              { key: 'third_place', label: '3rd', width: 40 },
              { key: 'second_place', label: '2nd', width: 40 },
              { key: 'champion', label: 'Gold', width: 55 },
            ],
            rows: careerRows,
          },
        ]}
        recentCards={[
          {
            header: 'Recent Matches',
            columns: [
              { key: 'match_date', label: 'Date', width: 85 },
              { key: 'opponent', label: 'Fight vs', width: 110 },
              { key: 'venue', label: 'Venue', width: 100 },
              { key: 'style', label: 'Style', width: 85 },
              { key: 'result', label: 'Result', width: 60 },
              { key: 'weight_category', label: 'Weight Cat.', width: 80 },
              { key: 'age_category', label: 'Age Cat.', width: 80 },
              { key: 'place', label: 'Place', width: 60 },
            ],
            rows: recentRows,
          },
        ]}
        onEditPress={() => setIsViewing(false)}
        onBackPress={() => router.back()}
      />
    );
  }

  return (
    <SportProfileLayout
      sportName="Karate"
      sportIcon="body"
      fullName={fullName}
      error={error}
      onBack={() => router.back()}
    >
      {/* Cover & Avatar Upload Block */}
      <View style={sportStyles.coverBlock}>
        <CoverPhotoUpload existingUrl={existingCoverUrl} picked={coverPicked} onPick={setCoverPicked} />
        <View style={sportStyles.avatarOverlay}>
          <AvatarPhotoUpload existingUrl={existingPhotoUrl} picked={avatarPicked} onPick={setAvatarPicked} />
        </View>
      </View>

      {/* Form Section 1: Overview */}
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
          { key: 'style', label: 'Style', type: 'select', options: styleOptions },
          { key: 'fights', label: 'Total Fights', type: 'number' },
          { key: 'win', label: 'Win', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
          { key: 'weight_category', label: 'Weight Cat.', type: 'text' },
          { key: 'third_place', label: '3rd Place', type: 'number' },
          { key: 'second_place', label: '2nd Place', type: 'number' },
          { key: 'champion', label: 'Champion', type: 'number' },
        ]}
      />

      {/* Form Section 3: Recent Matches Table */}
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
          { key: 'opponent', label: 'Fight vs', type: 'text' },
          { key: 'venue', label: 'Venue', type: 'text' },
          { key: 'style', label: 'Style', type: 'select', options: styleOptions },
          { key: 'win', label: 'Win', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          { key: 'weight_category', label: 'Weight Cat.', type: 'text' },
          { key: 'age_category', label: 'Age Cat.', type: 'text' },
          { key: 'place', label: 'Place', type: 'text' },
        ]}
      />

      <Button label="Save Karate Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
    </SportProfileLayout>
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
