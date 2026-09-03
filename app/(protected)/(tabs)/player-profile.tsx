import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { CricketPlayerDetailView } from '../../../src/components/player/CricketPlayerDetailView';
import { PlayerSportDetailView } from '../../../src/components/player/PlayerSportDetailView';
import { colors, radius, shadows, spacing, typography } from '../../../src/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { useLookupStore } from '../../../src/store/lookupStore';
import { playerService } from '../../../src/services/playerService';
import { resolveSportRoute, RACKET_SPORT_SLUGS } from '../../../src/utils/sportRoutes';
import { sportIconFor } from '../../../src/constants/sportIcons';
import { pickAndCompressPhoto } from '../../../src/utils/imageCompression';
import { calculateAge } from '../../../src/utils/date';
import {
  buildRacketSportConfig,
  buildSportDetailProps,
  mapAllToStrings,
  SPORT_DETAIL_CONFIGS,
  SportDetailConfig,
} from '../../../src/utils/sportDetailConfig';
import { CricketProfileFormValues, PlayerProfile, PlayerSportEntry } from '../../../src/types';

const HERO_HEIGHT = 410;
const MAX_PHOTOS = 10;

/** What's currently loaded for the active sport's embedded detail view. */
type SportDetailState =
  | { status: 'loading' }
  | { status: 'unsupported' }
  | { status: 'cricket'; values: CricketProfileFormValues; teamLogos: Record<string, string>; collegeLogoUrl: string | null }
  | { status: 'generic'; config: SportDetailConfig; profile: Record<string, unknown> };

/**
 * Modern Sports Player Profile screen — inspired by world-class athlete cards (Neymar PSG sample),
 * adhering strictly to Ama Sports brand colors.
 */
export default function PlayerProfileHubScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [sports, setSports] = useState<PlayerSportEntry[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isSportPickerVisible, setIsSportPickerVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sportDetail, setSportDetail] = useState<SportDetailState>({ status: 'loading' });

  const { width: screenWidth } = useWindowDimensions();
  const lookups = useLookupStore((s) => s.lookups);
  const ensureLookupsLoaded = useLookupStore((s) => s.ensureLoaded);

  const load = useCallback(async () => {
    try {
      const [playerData, sportsData] = await Promise.all([
        playerService.fetchProfile(),
        playerService.fetchSports(),
        ensureLookupsLoaded(),
      ]);
      setPlayer(playerData);
      setSports(sportsData);
      setActiveSlug((prev) => prev ?? sportsData[0]?.sport.slug ?? null);
    } catch {
      // Swallow — screen shows last fetched state
    } finally {
      setIsLoading(false);
    }
  }, [ensureLookupsLoaded]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!activeSlug || !lookups) return;
    let cancelled = false;
    setSportDetail({ status: 'loading' });

    (async () => {
      try {
        if (activeSlug === 'cricket') {
          const p = await playerService.fetchCricketProfile();
          if (cancelled) return;
          const values: CricketProfileFormValues = {
            born: p.born ?? '',
            age: p.age === null || p.age === undefined ? '' : String(p.age),
            batting_style: p.batting_style ?? '',
            bowling_style: p.bowling_style ?? '',
            playing_role: p.playing_role ?? '',
            height: p.height ?? '',
            college_university: p.college_university ?? '',
            pitching_line_breakdown: {},
            ball_type_breakdown: {},
            teams: p.teams ?? [],
            batting: p.batting.map((row) => mapAllToStrings(row)) as unknown as CricketProfileFormValues['batting'],
            bowling: p.bowling.map((row) => mapAllToStrings(row)) as unknown as CricketProfileFormValues['bowling'],
            recent_matches: p.recent_matches.map((row) => ({
              ...mapAllToStrings(row),
              played_xi: Boolean(row.played_xi),
            })) as unknown as CricketProfileFormValues['recent_matches'],
            drop_catches: [],
            missed_matches: [],
          };
          setSportDetail({
            status: 'cricket',
            values,
            teamLogos: Object.fromEntries((p.team_logos ?? []).map((l) => [l.team_name, l.logo_url])),
            collegeLogoUrl: p.college_logo_url ?? null,
          });
          return;
        }

        let config: SportDetailConfig | undefined = SPORT_DETAIL_CONFIGS[activeSlug];
        if (!config && RACKET_SPORT_SLUGS.has(activeSlug)) {
          const sportOption = lookups.sports.find((s) => s.slug === activeSlug);
          if (sportOption) config = buildRacketSportConfig(sportOption.name, sportOption.id);
        }
        if (!config) {
          if (!cancelled) setSportDetail({ status: 'unsupported' });
          return;
        }
        const profile = await config.fetchProfile();
        if (!cancelled) setSportDetail({ status: 'generic', config, profile });
      } catch {
        if (!cancelled) setSportDetail({ status: 'unsupported' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSlug, lookups]);

  const performLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) performLogout();
      return;
    }
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  const handleShare = async () => {
    const athleteName = player?.full_name || user?.name || 'Athlete';
    try {
      await Share.share({
        title: `${athleteName} - Ama Sports Profile`,
        message: `Check out ${athleteName}'s official sports profile and statistics on Ama Sports!`,
      });
    } catch {
      // User cancelled or share unavailable
    }
  };

  const handleAddPhoto = async () => {
    if (isAddingPhoto || (player?.photos.length ?? 0) >= MAX_PHOTOS) return;
    setIsAddingPhoto(true);
    try {
      const webp = await pickAndCompressPhoto();
      if (!webp) return;
      const uploaded = await playerService.uploadPlayerPhoto(webp);
      setPlayer((prev) => (prev ? { ...prev, photos: [...prev.photos, uploaded] } : prev));
    } catch {
      Alert.alert('Upload failed', 'Could not upload that photo. Please try again.');
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const handleRemovePhoto = (photoId: number) => {
    Alert.alert('Remove photo?', 'This photo will be removed from your profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await playerService.removePlayerPhoto(photoId);
            setPlayer((prev) => (prev ? { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) } : prev));
          } catch {
            Alert.alert('Remove failed', 'Could not remove that photo. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEditPress = () => {
    if (sports.length === 0) return;
    if (sports.length === 1) {
      router.push(resolveSportRoute(sports[0].sport));
      return;
    }
    setIsSportPickerVisible(true);
  };

  const handlePickSportToEdit = (entry: PlayerSportEntry) => {
    setIsSportPickerVisible(false);
    router.push(resolveSportRoute(entry.sport));
  };

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
    setCarouselIndex(index);
  };

  const photos = player?.photos ?? [];
  const canAddMorePhotos = photos.length < MAX_PHOTOS;
  const carouselPageCount = photos.length + (canAddMorePhotos ? 1 : 0);
  const activeSportEntry = sports.find((s) => s.sport.slug === activeSlug) ?? sports[0];

  // Dynamically compute the 3 Signature Highlight Stat Cards (from Neymar sample)
  let heroAge = '--';
  let heroMatches = '--';
  let heroPrimaryLabel = 'Runs';
  let heroPrimaryValue = '--';
  let heroRole = activeSportEntry?.sport.name ? `${activeSportEntry.sport.name.toUpperCase()} ATHLETE` : 'ATHLETE';
  let primaryTeam: string | null = null;
  let primaryTeamLogo: string | null = null;

  if (sportDetail.status === 'cricket') {
    const v = sportDetail.values;
    heroAge = v.age || (v.born ? calculateAge(v.born) : null) || '--';

    const battingMatches = v.batting.reduce((sum, r) => sum + (parseInt(r.matches, 10) || 0), 0);
    const bowlingMatches = v.bowling.reduce((sum, r) => sum + (parseInt(r.matches, 10) || 0), 0);
    const totalMatches = Math.max(battingMatches, bowlingMatches) || v.recent_matches.length;
    heroMatches = totalMatches > 0 ? String(totalMatches) : (v.recent_matches.length > 0 ? String(v.recent_matches.length) : '--');

    const totalRuns = v.batting.reduce((sum, r) => sum + (parseInt(r.runs, 10) || 0), 0);
    const totalWickets = v.bowling.reduce((sum, r) => sum + (parseInt(r.wickets, 10) || 0), 0);
    if (totalRuns >= totalWickets && totalRuns > 0) {
      heroPrimaryLabel = 'Runs';
      heroPrimaryValue = String(totalRuns);
    } else if (totalWickets > 0) {
      heroPrimaryLabel = 'Wkts';
      heroPrimaryValue = String(totalWickets);
    } else if (v.recent_matches.length > 0) {
      const recentRuns = v.recent_matches.reduce((sum, r) => sum + (parseInt(r.runs, 10) || 0), 0);
      heroPrimaryLabel = 'Runs';
      heroPrimaryValue = recentRuns > 0 ? String(recentRuns) : '--';
    }

    if (v.playing_role) {
      heroRole = v.playing_role.toUpperCase();
    } else if (v.batting_style) {
      heroRole = `${v.batting_style.toUpperCase()} BATTER`;
    } else {
      heroRole = 'ALL-ROUNDER';
    }

    primaryTeam = v.teams?.[0] || null;
    primaryTeamLogo = primaryTeam && sportDetail.teamLogos?.[primaryTeam] ? sportDetail.teamLogos[primaryTeam] : null;
  } else if (sportDetail.status === 'generic') {
    const p = sportDetail.profile as Record<string, unknown>;
    heroAge = p.age ? String(p.age) : (p.born ? calculateAge(String(p.born)) : '--');
    heroRole = String(p.position || p.playing_role || `${activeSportEntry?.sport.name || 'SPORT'} ATHLETE`).toUpperCase();
    primaryTeam = Array.isArray(p.teams) && p.teams.length > 0 ? String(p.teams[0]) : null;
    heroPrimaryLabel = 'Goals';
    if (p.matches) heroMatches = String(p.matches);
    if (p.goals) heroPrimaryValue = String(p.goals);
  }

  // Split name for Messi style two-line display (e.g., "Lionel" / "Andrés Messi" or "Mia" / "Kalifa")
  const fullPlayerName = (player?.full_name || user?.name || 'Athlete').trim();
  const nameParts = fullPlayerName.split(' ');
  const firstName = nameParts[0] || 'Athlete';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  // Signature Watermark (like "LM10" for Lionel Messi in the sample)
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  const watermarkText = `${firstInitial}${lastInitial || '10'}10`;

  if (isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll style={styles.screen} backgroundColor={colors.background}>
      {/* 1. Light Modern Hero Athlete Card with Photo Carousel (Marcelo Reference Design) */}
      <View style={[styles.heroCardContainer, { height: HERO_HEIGHT }]}>
        {/* Clean Light Subtle Gradient Background Canvas */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Large Faint Crest / Sport Watermark (like Real Madrid crest watermark on Marcelo card) */}
        <View style={styles.watermarkContainer} pointerEvents="none">
          <Ionicons name={sportIconFor(activeSlug ?? '')} size={210} color="rgba(15, 23, 42, 0.04)" />
        </View>

        {/* Athlete Photo Carousel with Light Mode Clean Blending */}
        {carouselPageCount === 0 ? (
          <View style={styles.emptyCarousel}>
            <Ionicons name="images-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyCarouselText}>No photos yet</Text>
            <Pressable onPress={handleAddPhoto} style={styles.emptyAddBtn} hitSlop={8}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.emptyAddText}>Add Athlete Photo</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onCarouselScroll}
            scrollEventThrottle={32}
            style={styles.carouselScrollView}
          >
            {photos.map((photo) => (
              <View
                key={photo.id}
                style={[styles.carouselPage, { width: screenWidth }]}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={styles.carouselImage}
                />
                <Pressable
                  onPress={() => handleRemovePhoto(photo.id)}
                  style={styles.deleteBadge}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="trash-outline" size={15} color={colors.white} />
                </Pressable>
              </View>
            ))}

            {canAddMorePhotos ? (
              <Pressable
                style={[styles.carouselPage, styles.addPage, { width: screenWidth }]}
                onPress={handleAddPhoto}
                disabled={isAddingPhoto}
              >
                {isAddingPhoto ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <View style={styles.addPageIconCircle}>
                      <Ionicons name="add" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.addPageText}>Add Photo</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </ScrollView>
        )}

        {/* Light Bottom & Side Fade for clean transition into cards */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.75)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.5)',
            'rgba(247, 247, 242, 0.98)',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Top Navigation & Action Controls (Light UI with Crisp Pill Buttons) */}
        <View style={styles.topControlRow}>
          <View style={styles.countryBadgePill}>
            <Ionicons name="location-sharp" size={12} color={colors.primary} />
            <Text style={styles.countryBadgeText} numberOfLines={1}>
              {player?.country || 'National Athlete'}
            </Text>
          </View>

          <View style={styles.topRightActions}>
            {sports.length > 0 && (
              <Pressable
                onPress={handleEditPress}
                style={[styles.actionIconButton, styles.editActionBtn]}
                hitSlop={8}
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="create-outline" size={17} color={colors.primary} />
              </Pressable>
            )}

            <Pressable
              onPress={handleLogout}
              style={styles.actionIconButton}
              hitSlop={8}
              accessibilityLabel="Log out"
            >
              <Ionicons name="log-out-outline" size={17} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* BOTTOM / FOREGROUND SECTION OF HERO (Marcelo Light Style) */}
        <View style={styles.heroBottomBar} pointerEvents="box-none">
          <View style={styles.heroNameBlock}>
            {/* Team Crest & Country Mini Badges on Top of Name */}
            <View style={styles.heroBadgeRow}>
              {primaryTeamLogo ? (
                <Image source={{ uri: primaryTeamLogo }} style={styles.heroMiniBadge} resizeMode="contain" />
              ) : (
                <View style={styles.heroMiniBadgeFallback}>
                  <Ionicons name="shield" size={14} color={colors.primary} />
                </View>
              )}
              <View style={styles.countryPillSmall}>
                <Ionicons name="globe-outline" size={12} color={colors.primary} />
                <Text style={styles.countryPillSmallText} numberOfLines={1}>
                  {player?.country ? player.country.toUpperCase() : 'SRI LANKA'}
                </Text>
              </View>
            </View>

            {/* Clean Bold Name */}
            <Text style={styles.heroFullName} numberOfLines={1}>
              {fullPlayerName}
            </Text>

            {/* Jersey / Playing Role Subheading (Red Jersey in Reference) */}
            <View style={styles.roleJerseyRow}>
              <View style={styles.jerseyIconBox}>
                <Ionicons name="shirt" size={13} color="#E31B23" />
              </View>
              <Text style={styles.heroRoleText}>{heroRole}</Text>
            </View>
          </View>
        </View>

        {/* Pagination Dots */}
        {carouselPageCount > 1 ? (
          <View style={styles.dotsRow} pointerEvents="none">
            {Array.from({ length: carouselPageCount }).map((_, i) => (
              <View key={i} style={[styles.dot, i === carouselIndex && styles.dotActive]} />
            ))}
          </View>
        ) : null}
      </View>

      {/* 2. THE 3 SIGNATURE STAT HIGHLIGHT CARDS (Marcelo White Card Style) */}
      <View style={styles.statsCardsRow}>
        <View style={[styles.statHighlightCard, shadows.sm]}>
          <Text style={styles.statHighlightLabel}>Age</Text>
          <Text style={styles.statHighlightValue}>{heroAge}</Text>
        </View>

        <View style={[styles.statHighlightCard, shadows.sm]}>
          <Text style={styles.statHighlightLabel}>Games</Text>
          <Text style={styles.statHighlightValue}>{heroMatches}</Text>
        </View>

        <View style={[styles.statHighlightCard, styles.statHighlightCardFeatured, shadows.sm]}>
          <Text style={[styles.statHighlightLabel, styles.statHighlightLabelFeatured]}>
            {heroPrimaryLabel}
          </Text>
          <Text style={[styles.statHighlightValue, styles.statHighlightValueFeatured]}>
            {heroPrimaryValue}
          </Text>
          <View style={styles.featuredStatIndicator} />
        </View>
      </View>

      {/* 3. Multi-Sport Switcher (if player has 2+ sports, e.g. Cricket & Hockey) */}
      {sports.length > 1 && (
        <View style={styles.switcherContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.switcherRow}
          >
            {sports.map((entry) => {
              const active = entry.sport.slug === activeSlug;
              return (
                <Pressable
                  key={entry.id}
                  style={[styles.sportPill, active && styles.sportPillActive]}
                  onPress={() => setActiveSlug(entry.sport.slug)}
                >
                  <Ionicons
                    name={sportIconFor(entry.sport.slug)}
                    size={16}
                    color={active ? colors.energy : colors.textMuted}
                  />
                  <Text style={[styles.sportPillText, active && styles.sportPillTextActive]}>
                    {entry.sport.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}


      {/* 5. Sport Empty State (if no sports yet) */}
      {sports.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="trophy-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No sports added yet</Text>
          <Text style={styles.emptyText}>Head to Home to add your first sport profile.</Text>
          <Pressable
            style={({ pressed }) => [styles.emptyCta, pressed && styles.pressedOpacity]}
            onPress={() => router.push('/(protected)/(tabs)/home')}
          >
            <Text style={styles.emptyCtaText}>Go to Home</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.white} />
          </Pressable>
        </View>
      ) : (
        /* 6. Embedded Sport Profile (About, Career Stats, Recent Matches) */
        <View style={styles.embeddedWrapper}>
          {sportDetail.status === 'loading' || !lookups ? (
            <ActivityIndicator color={colors.primary} style={styles.statsLoading} />
          ) : sportDetail.status === 'unsupported' ? (
            <View style={styles.statsPromptCard}>
              <Text style={styles.statsPromptText}>
                Detailed profile view for {activeSportEntry?.sport.name ?? 'this sport'} is coming soon.
              </Text>
            </View>
          ) : sportDetail.status === 'cricket' ? (
            <CricketPlayerDetailView
              embedded
              fullName={player?.full_name || user?.name || 'Athlete'}
              country={player?.country || ''}
              values={sportDetail.values}
              lookups={lookups}
              teamLogos={sportDetail.teamLogos}
              collegeLogoUrl={sportDetail.collegeLogoUrl}
            />
          ) : (
            <PlayerSportDetailView
              embedded
              sportName={sportDetail.config.sportName}
              fullName={player?.full_name || user?.name || 'Athlete'}
              country={player?.country || ''}
              {...buildSportDetailProps(sportDetail.config, sportDetail.profile, lookups)}
            />
          )}
        </View>
      )}

      {isLoggingOut && <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />}

      {/* Edit Sport Picker Sheet (2+ sports) */}
      <Modal
        visible={isSportPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSportPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setIsSportPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit which sport?</Text>
            {sports.map((entry) => (
              <Pressable key={entry.id} style={styles.modalRow} onPress={() => handlePickSportToEdit(entry)}>
                <View style={styles.modalIconCircle}>
                  <Ionicons name={sportIconFor(entry.sport.slug)} size={18} color={colors.primary} />
                </View>
                <Text style={styles.modalRowText}>{entry.sport.name}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    backgroundColor: colors.background,
  },
  loadingIndicator: {
    marginVertical: spacing.xl,
  },
  pressedOpacity: {
    opacity: 0.9,
  },
  heroCardContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    ...shadows.sm,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 20,
    left: -20,
    zIndex: 1,
  },
  emptyCarousel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8FAFC',
  },
  emptyCarouselText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 14,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  emptyAddText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  carouselScrollView: {
    flex: 1,
    zIndex: 2,
  },
  carouselPage: {
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.92,
  },

  deleteBadge: {
    position: 'absolute',
    top: spacing.lg + 52,
    right: spacing.lg,
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  addPage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#F1F5F9',
  },
  addPageIconCircle: {
    width: 54,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPageText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  topControlRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  countryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  countryBadgeText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '800',
    fontSize: 11,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  editActionBtn: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.borderStrong,
  },
  heroBottomBar: {
    position: 'absolute',
    bottom: spacing.lg + 6,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 15,
  },
  heroNameBlock: {
    flex: 1,
    gap: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  heroMiniBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroMiniBadgeFallback: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.cardSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryPillSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  heroFullName: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  roleJerseyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  jerseyIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRoleText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  statsCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 10,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  statHighlightCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 90,
  },
  statHighlightCardFeatured: {
    borderColor: colors.borderStrong,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredStatIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  statHighlightLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statHighlightLabelFeatured: {
    color: colors.primary,
  },
  statHighlightValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginTop: 6,
  },
  statHighlightValueFeatured: {
    color: colors.primary,
  },
  discussingSection: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  discussingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  discussingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discussingDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: '#3B82F6',
  },
  discussingTitle: {
    ...typography.subtitle,
    fontSize: 14,
    fontWeight: '800',
    color: '#3B82F6',
  },
  avatarPile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pileAvatar: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pileText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.white,
  },
  newsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newsSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newsSourceAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  newsSourceAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsSourceTitle: {
    ...typography.body,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  newsSourceSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  newsShareBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    borderStyle: 'dashed',
  },
  newsBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newsDateBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  newsDateDay: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 16,
  },
  newsDateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  newsHeadline: {
    flex: 1,
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
  },
  switcherContainer: {
    marginBottom: spacing.md,
  },
  switcherRow: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sportPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sportPillText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sportPillTextActive: {
    color: colors.white,
  },

  embeddedWrapper: {
    paddingHorizontal: 0,
  },
  statsLoading: {
    marginVertical: spacing.lg,
  },
  statsPromptCard: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  statsPromptText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: spacing.sm,
  },
  emptyCtaText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRowText: {
    flex: 1,
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
});
