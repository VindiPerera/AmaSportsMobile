import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { TextField } from '../../../src/components/ui/TextField';
import { Button } from '../../../src/components/ui/Button';
import { CoverPhotoUpload } from '../../../src/components/player/CoverPhotoUpload';
import { AvatarPhotoUpload } from '../../../src/components/player/AvatarPhotoUpload';
import { Dropdown } from '../../../src/components/player/Dropdown';
import { DateField } from '../../../src/components/player/DateField';
import { TeamsInput } from '../../../src/components/player/TeamsInput';
import { StatTable } from '../../../src/components/player/StatTable';
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { SportProfileLayout, sportStyles } from '../../../src/components/player/SportProfileLayout';
import { colors, shadows, spacing } from '../../../src/theme';
import { useLookupStore } from '../../../src/store/lookupStore';
import { useAuthStore } from '../../../src/store/authStore';
import { playerService } from '../../../src/services/playerService';
import { softBallCricketService } from '../../../src/services/softBallCricketService';
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import {
  BATTING_STYLE_OPTIONS,
  BOWLING_STYLE_OPTIONS,
  PLAYING_ROLE_OPTIONS,
} from '../../../src/constants/cricketOptions';
import { calculateAge } from '../../../src/utils/date';
import { ApiError, PickedImage, SoftBallCricketProfileFormValues } from '../../../src/types';

const EMPTY_BATTING_ROW = {
  matches: '', runs: '', innings: '', highest: '', not_out: '', hundreds: '', fifties: '',
  sixes: '', fours: '', catches: '', stumpings: '', won: '', lost: '', tied: '',
};

const EMPTY_BOWLING_ROW = {
  matches: '', balls: '', runs: '', wickets: '', average: '', economy: '',
  three_w: '', four_w: '', five_w: '', career_best: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', won: false, lost: false, runs: '', balls: '', average: '',
  bowling_balls: '', bowling_runs: '', wickets: '', catches: '', stumpings: '',
};

const EMPTY_FORM: SoftBallCricketProfileFormValues = {
  born: '', age: '', batting_style: '', bowling_style: '', playing_role: '', height: '',
  college_university: '', teams: [], batting: [], bowling: [], recent_matches: [],
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

export default function SoftBallCricketProfileScreen() {
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

  const { control, handleSubmit, reset, setValue, getValues, watch } = useForm<SoftBallCricketProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

  const formValues = watch();

  useEffect(() => {
    (async () => {
      try {
        await ensureLoaded();
        const [profile, sbcProfile] = await Promise.all([
          playerService.fetchProfile(),
          softBallCricketService.fetchProfile(),
        ]);

        setFullName(profile.full_name ?? '');
        setCountry(profile.country ?? '');
        setExistingCoverUrl(profile.cover_photo_url);
        setExistingPhotoUrl(profile.photo_url);

        reset({
          born: sbcProfile.born ?? '',
          age: toFormString(sbcProfile.age),
          batting_style: sbcProfile.batting_style ?? '',
          bowling_style: sbcProfile.bowling_style ?? '',
          playing_role: sbcProfile.playing_role ?? '',
          height: sbcProfile.height ?? '',
          college_university: sbcProfile.college_university ?? '',
          teams: sbcProfile.teams ?? [],
          batting: sbcProfile.batting.map((row) =>
            mapRow(row, Object.keys(EMPTY_BATTING_ROW))
          ) as unknown as SoftBallCricketProfileFormValues['batting'],
          bowling: sbcProfile.bowling.map((row) =>
            mapRow(row, Object.keys(EMPTY_BOWLING_ROW))
          ) as unknown as SoftBallCricketProfileFormValues['bowling'],
          recent_matches: sbcProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'runs', 'balls', 'average', 'bowling_balls', 'bowling_runs', 'wickets', 'catches', 'stumpings']),
            won: Boolean(row.won),
            lost: Boolean(row.lost),
          })) as unknown as SoftBallCricketProfileFormValues['recent_matches'],
        });
      } catch {
        setError('Could not load your Soft Ball Cricket profile. Please try again.');
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

  const onSubmit = async (values: SoftBallCricketProfileFormValues) => {
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
      await softBallCricketService.saveProfile(values);
      await useAuthStore.getState().refreshProfile();
      setIsViewing(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not save your Soft Ball Cricket profile. Please check your entries and try again.'
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
      { label: 'BATTING STYLE', value: formValues.batting_style },
      { label: 'BOWLING STYLE', value: formValues.bowling_style },
      { label: 'PLAYING ROLE', value: formValues.playing_role },
      { label: 'HEIGHT', value: formValues.height },
      { label: 'EDUCATION', value: formValues.college_university },
    ];

    const mappedRecent = (formValues.recent_matches || []).map((m) => {
      const parts: string[] = [];
      if (m.runs) parts.push(`${m.runs} runs`);
      if (m.wickets) parts.push(`${m.wickets} wkts`);
      return {
        match_date: m.match_date,
        opponent: m.opponent,
        scoreOrStat: parts.length > 0 ? parts.join(', ') : '--',
        result: m.won ? 'WIN' : m.lost ? 'LOSS' : '--',
      };
    });

    return (
      <PlayerSportDetailView
        sportName="Soft Ball Cricket"
        fullName={fullName}
        country={country}
        photoUrl={avatarPicked?.uri || existingPhotoUrl}
        coverUrl={coverPicked?.uri || existingCoverUrl}
        born={formValues.born}
        age={formValues.age}
        teams={formValues.teams}
        fields={fields}
        careerStatsHeader="Batting Stats"
        careerStatsColumns={[
          { key: 'matches', label: 'Mat', width: 45 },
          { key: 'runs', label: 'Runs', width: 55 },
          { key: 'innings', label: 'Inn', width: 45 },
          { key: 'highest', label: 'HS', width: 55 },
          { key: 'hundreds', label: '100s', width: 50 },
          { key: 'fifties', label: '50s', width: 50 },
        ]}
        careerStatsRows={formValues.batting}
        secondaryStatsHeader="Bowling Stats"
        secondaryStatsColumns={[
          { key: 'matches', label: 'Mat', width: 45 },
          { key: 'balls', label: 'Balls', width: 55 },
          { key: 'runs', label: 'Runs', width: 55 },
          { key: 'wickets', label: 'Wkts', width: 50 },
          { key: 'average', label: 'Avg', width: 55 },
          { key: 'economy', label: 'Econ', width: 55 },
        ]}
        secondaryStatsRows={formValues.bowling}
        recentMatches={mappedRecent}
        onEditPress={() => setIsViewing(false)}
        onBackPress={() => router.back()}
      />
    );
  }

  return (
    <SportProfileLayout
      sportName="Soft Ball Cricket"
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
            <Dropdown
              label="Sport"
              value="soft-ball-cricket"
              onChange={() => {}}
              options={[{ label: 'Soft Ball Cricket', value: 'soft-ball-cricket' }]}
              disabled
            />
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
            <TextField label="College / University" value={value} onChangeText={onChange} placeholder="School or University" />
          )}
        />
        <Controller
          control={control}
          name="teams"
          render={({ field: { value, onChange } }) => <TeamsInput value={value} onChange={onChange} />}
        />
      </View>

      <StatTable
        title="Batting Career Stats"
        control={control}
        name="batting"
        emptyRow={EMPTY_BATTING_ROW}
        columns={[
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'innings', label: 'Innings', type: 'number' },
          { key: 'highest', label: 'Highest', type: 'text' },
          { key: 'not_out', label: 'Not Out', type: 'number' },
          { key: 'hundreds', label: '100s', type: 'number' },
          { key: 'fifties', label: '50s', type: 'number' },
          { key: 'sixes', label: '6s', type: 'number' },
          { key: 'fours', label: '4s', type: 'number' },
          { key: 'catches', label: 'Catches', type: 'number' },
          { key: 'stumpings', label: 'Stumping', type: 'number' },
          { key: 'won', label: 'Win', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
          { key: 'tied', label: 'Tie', type: 'number' },
        ]}
      />

      <StatTable
        title="Bowling Career Stats"
        control={control}
        name="bowling"
        emptyRow={EMPTY_BOWLING_ROW}
        columns={[
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'balls', label: 'Balls', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'wickets', label: 'Wicket', type: 'number' },
          { key: 'average', label: 'Average', type: 'text' },
          { key: 'economy', label: 'Economy', type: 'text' },
          { key: 'three_w', label: '3w', type: 'number' },
          { key: 'four_w', label: '4w', type: 'number' },
          { key: 'five_w', label: '5w', type: 'number' },
          { key: 'career_best', label: 'Career Best', type: 'text' },
        ]}
      />

      <StatTable
        title="Recent Matches"
        control={control}
        name="recent_matches"
        emptyRow={EMPTY_RECENT_MATCH_ROW}
        columns={[
          { key: 'match_date', label: 'Date', type: 'date' },
          { key: 'opponent', label: 'Play Against', type: 'text' },
          { key: 'won', label: 'Won', type: 'boolean' },
          { key: 'lost', label: 'Lost', type: 'boolean' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'balls', label: 'Balls', type: 'number' },
          { key: 'average', label: 'Average', type: 'text' },
          { key: 'bowling_balls', label: 'Balls', type: 'number' },
          { key: 'bowling_runs', label: 'Runs', type: 'number' },
          { key: 'wickets', label: 'Wicket', type: 'number' },
          { key: 'catches', label: 'Catches', type: 'number' },
          { key: 'stumpings', label: 'Stumping', type: 'number' },
        ]}
      />

      <Button label="Save Soft Ball Cricket Profile" onPress={handleSubmit(onSubmit)} loading={isSaving} style={styles.submitButton} />
    </SportProfileLayout>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerRowItem: {
    flex: 1,
  },
  submitButton: {
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
  },
});
