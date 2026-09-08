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
import { CollegeLogoUpload } from '../../../src/components/player/CollegeLogoUpload';
import { useSportLogos } from '../../../src/hooks/useSportLogos';
import { CricketMatchEntryCard } from '../../../src/components/player/CricketMatchEntryCard';
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
import { CRICKET_CATEGORIES, CRICKET_FORMATS } from '../../../src/constants/cricketLookups';
import { calculateAge, sortRecentMatchesNewestFirst } from '../../../src/utils/date';
import { ApiError, CricketProfileFormValues, CricketRecentMatchRowForm, PickedImage } from '../../../src/types';

const EMPTY_BATTING_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', cricket_match_type_id: '', year: '',
  matches: '', won: '', lost: '', innings: '', not_out: '', runs: '', balls: '', hs: '', average: '',
  best: '', sr: '', hundreds: '', fifties: '', fours: '', sixes: '', catches: '', stumpings: '',
  run_outs: '', direct_hits: '', runs_saved: '', runs_giving: '', stumps_missing: '',
};

const EMPTY_BOWLING_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', cricket_match_type_id: '', year: '',
  matches: '', innings: '', balls: '', dot_balls: '', wide_balls: '', no_balls: '',
  runs: '', wickets: '', bbi: '', bbm: '', average: '', economy: '', sr: '',
  four_w: '', five_w: '', ten_w: '',
};

const EMPTY_RECENT_MATCH_ROW: CricketRecentMatchRowForm = {
  age_category_id: '', format_id: '', match_date: '', opponent: '', ground: '',
  year: String(new Date().getFullYear()), played_xi: false,
  batting_innings: '', runs: '', balls: '', not_out: false, hs: '', fours: '', sixes: '',
  hundreds: false, fifties: false, overs: '', maidens: '',
  bowling_innings: '', bowling_balls: '', bowling_runs: '', wickets: '', bbi: '', bbm: '',
  three_w: false, four_w: false, five_w: false, ten_w: false, catches: '', stumpings: '',
};

// Kept only for its keys (used by `mapRow` when loading an existing profile) —
// the Drop Catches table itself is no longer part of this form; see the
// removed "Drop Catches" section below for why.
const EMPTY_DROP_CATCH_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', field_position_id: '', drop_reason_id: '',
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

  // One new match (Batting + Bowling + Fielding together, see
  // CricketMatchEntryCard) per save — it locks its own "Add" button the
  // moment a match goes in. Bumping this after a successful save tells it
  // that match is now saved, so it forgets it and unlocks Add for a
  // genuinely fresh session.
  const [savedVersion, setSavedVersion] = useState(0);

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const {
    teamLogos,
    collegeLogoUrl,
    initLogos,
    handleUploadCollegeLogo,
    handleRemoveCollegeLogo,
    handleUploadTeamLogo,
    handleRemoveTeamLogo,
  } = useSportLogos('cricket');
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
        initLogos(cricketProfile.team_logos, cricketProfile.college_logo_url);

        const ov = profile.overview;

        reset({
          born: cricketProfile.born || ov?.born || '',
          age: toFormString(cricketProfile.age || ov?.age),
          batting_style: cricketProfile.batting_style ?? '',
          bowling_style: cricketProfile.bowling_style ?? '',
          playing_role: cricketProfile.playing_role ?? '',
          height: cricketProfile.height || ov?.height || '',
          college_university: cricketProfile.college_university || ov?.college_university || '',
          pitching_line_breakdown: breakdownToFormValues(cricketProfile.pitching_line_breakdown),
          ball_type_breakdown: breakdownToFormValues(cricketProfile.ball_type_breakdown),
          teams: cricketProfile.teams ?? [],
          batting: cricketProfile.batting.map((row) =>
            mapRow(row, Object.keys(EMPTY_BATTING_ROW))
          ) as unknown as CricketProfileFormValues['batting'],
          bowling: cricketProfile.bowling.map((row) =>
            mapRow(row, Object.keys(EMPTY_BOWLING_ROW))
          ) as unknown as CricketProfileFormValues['bowling'],
          recent_matches: sortRecentMatchesNewestFirst(
            cricketProfile.recent_matches.map((row) => ({
              ...mapRow(row, [
                'age_category_id', 'format_id', 'match_date', 'opponent', 'ground', 'year',
                'batting_innings', 'runs', 'balls', 'hs', 'fours', 'sixes', 'overs', 'maidens',
                'bowling_innings', 'bowling_balls', 'bowling_runs', 'wickets', 'bbi', 'bbm',
                'catches', 'stumpings',
              ]),
              played_xi: Boolean(row.played_xi),
              not_out: Boolean(row.not_out),
              hundreds: Boolean(row.hundreds),
              fifties: Boolean(row.fifties),
              three_w: Boolean(row.three_w),
              four_w: Boolean(row.four_w),
              five_w: Boolean(row.five_w),
              ten_w: Boolean(row.ten_w),
            })) as unknown as Record<string, unknown>[]
          ) as unknown as CricketProfileFormValues['recent_matches'],
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
      setSavedVersion((v) => v + 1);
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
        teamLogos={teamLogos}
        collegeLogoUrl={collegeLogoUrl}
        onEditPress={() => setIsViewing(false)}
        onBackPress={() => router.back()}
      />
    );
  }


  // Cricket's own Format/Category lists for the Batting/Bowling "Add New
  // Stat" flow — a fixed, curated set (see CRICKET_FORMATS/CRICKET_CATEGORIES),
  // separate from the shared age_categories/formats other sports use.
  // Filtered + reordered against that canonical list (rather than just
  // mapping every `lookups.cricket_categories`/`cricket_divisions` row) so
  // older values a stat row's foreign key still pins in the database never
  // resurface here — the dropdown only ever shows this exact list, in this
  // exact order.
  const careerCategoryOptions = CRICKET_FORMATS.flatMap((name) => {
    const match = lookups.cricket_categories.find((c) => c.name === name);
    return match ? [{ label: match.name, value: String(match.id) }] : [];
  });
  const careerDivisionOptions = CRICKET_CATEGORIES.flatMap((name) => {
    const match = lookups.cricket_divisions.find((d) => d.name === name);
    return match ? [{ label: match.name, value: String(match.id) }] : [];
  });

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
              name="batting_style"
              render={({ field: { value, onChange } }) => (
                <Dropdown label="Batting Style" value={value} onChange={onChange} options={BATTING_STYLE_OPTIONS} placeholder="Select batting style" />
              )}
            />
          </View>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="bowling_style"
              render={({ field: { value, onChange } }) => (
                <Dropdown label="Bowling Style" value={value} onChange={onChange} options={BOWLING_STYLE_OPTIONS} placeholder="Select bowling style" />
              )}
            />
          </View>
        </View>
        <View style={styles.headerRow}>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="playing_role"
              render={({ field: { value, onChange } }) => (
                <Dropdown label="Playing Role" value={value} onChange={onChange} options={PLAYING_ROLE_OPTIONS} placeholder="Select playing role" />
              )}
            />
          </View>
          <View style={styles.headerRowItem}>
            <Controller
              control={control}
              name="height"
              render={({ field: { value, onChange } }) => (
                <TextField label="Height" value={value} onChangeText={onChange} placeholder="e.g. 5 ft 10 in" />
              )}
            />
          </View>
        </View>
        <Controller
          control={control}
          name="college_university"
          render={({ field: { value, onChange } }) => (
            <View style={[styles.headerRow, styles.collegeRow]}>
              <View style={styles.headerRowItem}>
                <TextField label="College / University" value={value} onChangeText={onChange} placeholder="School or University" />
              </View>
              <CollegeLogoUpload
                logoUrl={collegeLogoUrl}
                onUpload={handleUploadCollegeLogo}
                onRemove={handleRemoveCollegeLogo}
              />
            </View>
          )}
        />
        <Controller
          control={control}
          name="teams"
          render={({ field: { value, onChange } }) => (
            <TeamsInput
              value={value}
              onChange={onChange}
              logos={teamLogos}
              onUploadLogo={handleUploadTeamLogo}
              onRemoveLogo={handleRemoveTeamLogo}
            />
          )}
        />
      </View>

      <CricketMatchEntryCard
        control={control}
        emptyMatchRow={EMPTY_RECENT_MATCH_ROW}
        emptyBattingRow={EMPTY_BATTING_ROW}
        emptyBowlingRow={EMPTY_BOWLING_ROW}
        formats={careerCategoryOptions}
        categories={careerDivisionOptions}
        resetSignal={savedVersion}
      />

      {/*
        Bowling Breakdown (Pitching Line / Ball Type) removed from this form —
        it's not part of the Cricket profile update fields the client wants
        shown here. The form still loads and resubmits whatever breakdown
        values already exist for this player (see reset()/cricketFormToPayload)
        so no data is lost; it's just no longer editable from this screen.
      */}

      {/*
        Drop Catches and "Reason for Matches Missed/Dropped" removed from this
        form — not part of the Cricket profile update fields the client wants
        shown here. Drop catch rows already saved for this player are still
        loaded and resubmitted unchanged (see reset()/cricketFormToPayload)
        so existing data isn't lost; missed_matches never had a backend field
        to begin with. Reconnect a table here if these come back later.
      */}

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
  collegeRow: {
    alignItems: 'flex-end',
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
