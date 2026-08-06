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
import { COUNTRY_OPTIONS } from '../../../src/constants/countries';
import {
  BATTING_STYLE_OPTIONS,
  BOWLING_STYLE_OPTIONS,
  PLAYING_ROLE_OPTIONS,
} from '../../../src/constants/cricketOptions';
import { calculateAge } from '../../../src/utils/date';
import { CricketProfileFormValues, PickedImage } from '../../../src/types';

const EMPTY_BATTING_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', cricket_match_type_id: '',
  matches: '', won: '', lost: '', innings: '', not_out: '', runs: '', hs: '', average: '',
  best: '', sr: '', hundreds: '', fifties: '', fours: '', sixes: '', catches: '', stumpings: '',
};

const EMPTY_BOWLING_ROW = {
  format_id: '', age_category_id: '', match_category_id: '', cricket_match_type_id: '',
  matches: '', innings: '', balls: '', runs: '', wickets: '', bbi: '', bbm: '', average: '',
  economy: '', sr: '', four_w: '', five_w: '', ten_w: '',
};

const EMPTY_RECENT_MATCH_ROW = {
  match_date: '', opponent: '', played_xi: false, runs: '', balls: '', fours: '', sixes: '',
  overs: '', maidens: '', wickets: '', catches: '', stumpings: '',
};

const EMPTY_FORM: CricketProfileFormValues = {
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

export default function CricketProfileScreen() {
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

  const { control, handleSubmit, reset, setValue, getValues } = useForm<CricketProfileFormValues>({
    defaultValues: EMPTY_FORM,
  });

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

        reset({
          born: cricketProfile.born ?? '',
          age: toFormString(cricketProfile.age),
          batting_style: cricketProfile.batting_style ?? '',
          bowling_style: cricketProfile.bowling_style ?? '',
          playing_role: cricketProfile.playing_role ?? '',
          height: cricketProfile.height ?? '',
          college_university: cricketProfile.college_university ?? '',
          teams: cricketProfile.teams ?? [],
          batting: cricketProfile.batting.map((row) =>
            mapRow(row, Object.keys(EMPTY_BATTING_ROW))
          ) as unknown as CricketProfileFormValues['batting'],
          bowling: cricketProfile.bowling.map((row) =>
            mapRow(row, Object.keys(EMPTY_BOWLING_ROW))
          ) as unknown as CricketProfileFormValues['bowling'],
          recent_matches: cricketProfile.recent_matches.map((row) => ({
            ...mapRow(row, ['match_date', 'opponent', 'runs', 'balls', 'fours', 'sixes', 'overs', 'maidens', 'wickets', 'catches', 'stumpings']),
            played_xi: Boolean(row.played_xi),
          })) as unknown as CricketProfileFormValues['recent_matches'],
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
      await playerService.updateProfile({
        full_name: fullName.trim(),
        country: country || undefined,
        cover_photo: coverPicked,
        photo: avatarPicked,
      });
      await playerService.saveCricketProfile(values);
      router.replace('/(protected)/(tabs)/player-profile');
    } catch {
      setError('Could not save your Cricket profile. Please check your entries and try again.');
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
  const matchTypeOptions = lookups.cricket_match_types.map((m) => ({ label: m.name, value: String(m.id) }));

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
          <Dropdown label="Sport" value="cricket" onChange={() => {}} options={[{ label: 'Cricket', value: 'cricket' }]} disabled />
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
        name="batting_style"
        render={({ field: { value, onChange } }) => (
          <Dropdown label="Batting Style" value={value} onChange={onChange} options={BATTING_STYLE_OPTIONS} />
        )}
      />
      <Controller
        control={control}
        name="bowling_style"
        render={({ field: { value, onChange } }) => (
          <Dropdown label="Bowling Style" value={value} onChange={onChange} options={BOWLING_STYLE_OPTIONS} />
        )}
      />
      <Controller
        control={control}
        name="playing_role"
        render={({ field: { value, onChange } }) => (
          <Dropdown label="Playing Role" value={value} onChange={onChange} options={PLAYING_ROLE_OPTIONS} />
        )}
      />
      <Controller
        control={control}
        name="height"
        render={({ field: { value, onChange } }) => (
          <TextField label="Height" value={value} onChangeText={onChange} placeholder="e.g. 5ft 10in" />
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
        title="Batting & Fielding"
        control={control}
        name="batting"
        emptyRow={EMPTY_BATTING_ROW}
        columns={[
          { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
          { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
          { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
          { key: 'cricket_match_type_id', label: 'Type', type: 'select', options: matchTypeOptions },
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'won', label: 'Won', type: 'number' },
          { key: 'lost', label: 'Lost', type: 'number' },
          { key: 'innings', label: 'Innings', type: 'number' },
          { key: 'not_out', label: 'Not Out', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'hs', label: 'HS', type: 'text' },
          { key: 'average', label: 'Average', type: 'decimal' },
          { key: 'best', label: 'Best', type: 'number' },
          { key: 'sr', label: 'SR', type: 'decimal' },
          { key: 'hundreds', label: '100s', type: 'number' },
          { key: 'fifties', label: '50s', type: 'number' },
          { key: 'fours', label: '4s', type: 'number' },
          { key: 'sixes', label: '6s', type: 'number' },
          { key: 'catches', label: 'Catches', type: 'number' },
          { key: 'stumpings', label: 'Stumpings', type: 'number' },
        ]}
      />
      <StatTable
        title="Bowling"
        control={control}
        name="bowling"
        emptyRow={EMPTY_BOWLING_ROW}
        columns={[
          { key: 'format_id', label: 'Format', type: 'select', options: formatOptions },
          { key: 'age_category_id', label: 'Age', type: 'select', options: ageOptions },
          { key: 'match_category_id', label: 'Category', type: 'select', options: categoryOptions },
          { key: 'cricket_match_type_id', label: 'Type', type: 'select', options: matchTypeOptions },
          { key: 'matches', label: 'Matches', type: 'number' },
          { key: 'innings', label: 'Innings', type: 'number' },
          { key: 'balls', label: 'Balls', type: 'number' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'wickets', label: 'Wickets', type: 'number' },
          { key: 'bbi', label: 'BBI', type: 'text' },
          { key: 'bbm', label: 'BBM', type: 'text' },
          { key: 'average', label: 'Average', type: 'decimal' },
          { key: 'economy', label: 'Economy', type: 'decimal' },
          { key: 'sr', label: 'SR', type: 'decimal' },
          { key: 'four_w', label: '4w', type: 'number' },
          { key: 'five_w', label: '5w', type: 'number' },
          { key: 'ten_w', label: '10w', type: 'number' },
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
          { key: 'played_xi', label: 'XI', type: 'boolean' },
          { key: 'runs', label: 'Runs', type: 'number' },
          { key: 'balls', label: 'Balls', type: 'number' },
          { key: 'fours', label: '4s', type: 'number' },
          { key: 'sixes', label: '6s', type: 'number' },
          { key: 'overs', label: 'Overs', type: 'decimal' },
          { key: 'maidens', label: 'Maidens', type: 'number' },
          { key: 'wickets', label: 'Wickets', type: 'number' },
          { key: 'catches', label: 'Catches', type: 'number' },
          { key: 'stumpings', label: 'Stumpings', type: 'number' },
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
