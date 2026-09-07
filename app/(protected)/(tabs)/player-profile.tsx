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
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { ImageLightbox } from '../../../src/components/ui/ImageLightbox';
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
  computeSportHeroMetrics,
  mapAllToStrings,
  SPORT_DETAIL_CONFIGS,
  SportDetailConfig,
} from '../../../src/utils/sportDetailConfig';
import { CricketProfileFormValues, PlayerProfile, PlayerSportEntry } from '../../../src/types';

const HERO_HEIGHT = 435;
const MAX_PHOTOS = 10;

/** Popular sports for fast 1-tap onboarding when an athlete hasn't set up a sport yet. */
const POPULAR_SPORTS = [
  { slug: 'cricket', name: 'Cricket', icon: 'baseball-outline' as const, emoji: '🏏' },
  { slug: 'football', name: 'Football', icon: 'football-outline' as const, emoji: '⚽' },
  { slug: 'badminton', name: 'Badminton', icon: 'tennisball-outline' as const, emoji: '🏸' },
  { slug: 'basketball', name: 'Basketball', icon: 'basketball-outline' as const, emoji: '🏀' },
  { slug: 'athletics', name: 'Athletics', icon: 'walk-outline' as const, emoji: '🏃' },
  { slug: 'swimming', name: 'Swimming', icon: 'water-outline' as const, emoji: '🏊' },
];

/** What's currently loaded for the active sport's embedded detail view. */
type SportDetailState =
  | { status: 'loading' }
  | { status: 'unsupported' }
  | { status: 'cricket'; values: CricketProfileFormValues; teamLogos: Record<string, string>; collegeLogoUrl: string | null }
  | { status: 'generic'; config: SportDetailConfig; profile: Record<string, unknown> };

interface CarouselSlide {
  key: string;
  url?: string;
  isAddPage?: boolean;
  photoId?: number;
}

/**
 * World-Class Pro Athlete Profile & Digital Sports Passport
 * Features:
 * - Swipeable Cover Photo Carousel in the Hero (Cover + up to 10 athlete photos)
 * - Profile Avatar positioned cleanly at bottom-left beside athlete name
 * - Center cover area remains 100% visible and unobstructed
 * - 3 Signature High-Impact Metric Pods (Age, Appearances, Primary Key Stat)
 * - "Activate Your Athlete Passport" Onboarding Hub with 1-tap sport shortcuts
 * - Multi-sport switcher and embedded verified match/career records
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
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);
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
    Alert.alert('Log Out', 'Are you sure you want to log out of your Ama Sports account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: performLogout },
    ]);
  };

  const handleShare = async () => {
    const athleteName = player?.full_name || user?.name || 'Athlete';
    const sportName = activeSportEntry?.sport.name || 'Sports';
    try {
      await Share.share({
        title: `${athleteName} - Official Sports Profile`,
        message: `Check out ${athleteName}'s official ${sportName} profile and verified stats on Ama Sports!`,
      });
    } catch {
      // User cancelled or share unavailable
    }
  };

  const handleUpdateAvatar = async () => {
    if (isAddingPhoto) return;
    try {
      const webp = await pickAndCompressPhoto();
      if (!webp) return;
      setIsAddingPhoto(true);
      const updated = await playerService.updateProfile({ photo: webp });
      if (updated) {
        setPlayer((prev) => (prev ? { ...prev, photo_url: updated.photo_url } : prev));
        await useAuthStore.getState().refreshProfile();
      }
    } catch {
      Alert.alert('Upload failed', 'Could not update avatar photo. Please try again.');
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const handleAddGalleryPhoto = async () => {
    if (isAddingPhoto || (player?.photos.length ?? 0) >= MAX_PHOTOS) return;
    try {
      const webp = await pickAndCompressPhoto();
      if (!webp) return;
      setIsAddingPhoto(true);
      const uploaded = await playerService.uploadPlayerPhoto(webp);
      setPlayer((prev) => (prev ? { ...prev, photos: [...prev.photos, uploaded] } : prev));
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo to cover carousel. Please try again.');
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const handleRemoveGalleryPhoto = (photoId: number) => {
    Alert.alert('Remove photo?', 'This photo will be removed from your cover carousel.', [
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
    if (sports.length === 0) {
      router.push('/(protected)/player-profile/sport-picker');
      return;
    }
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

  const handleQuickSelectSport = (sportItem: typeof POPULAR_SPORTS[number]) => {
    const matched = lookups?.sports.find((s) => s.slug === sportItem.slug);
    if (matched) {
      router.push(resolveSportRoute(matched));
    } else {
      router.push('/(protected)/player-profile/sport-picker');
    }
  };

  const onCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const index = Math.round(offset / screenWidth);
    setCarouselIndex(index);
  };

  const photos = player?.photos ?? [];
  const canAddMorePhotos = photos.length < MAX_PHOTOS;
  const activeSportEntry = sports.find((s) => s.sport.slug === activeSlug) ?? sports[0];

  // Cover photo and Avatar photo from player profile / cricket profile
  const coverUrl = player?.cover_photo_url || null;
  const avatarUrl = player?.photo_url || user?.photo_url || null;

  // Build the slides for the swipeable Cover Carousel
  const slides: CarouselSlide[] = [];
  if (coverUrl) {
    slides.push({ key: 'cover-photo', url: coverUrl });
  }
  photos.forEach((p) => {
    if (p.url !== coverUrl) {
      slides.push({ key: `photo-${p.id}`, url: p.url, photoId: p.id });
    }
  });
  if (canAddMorePhotos) {
    slides.push({ key: 'add-slide', isAddPage: true });
  }

  const totalPhotoCount = slides.filter((s) => !s.isAddPage).length;

  // Signature Highlight Stat Cards
  let heroAge = '--';
  let heroMatches = '--';
  let heroPrimaryLabel = 'Runs';
  let heroPrimaryValue = '--';
  let heroRole = activeSportEntry?.sport.name ? `${activeSportEntry.sport.name.toUpperCase()} ATHLETE` : 'ALL-ROUND ATHLETE';
  let primaryTeam: string | null = null;
  let primaryTeamLogo: string | null = null;

  if (sportDetail.status === 'cricket') {
    const v = sportDetail.values;
    heroAge = String(v.age || (v.born ? calculateAge(v.born) : null) || '--');

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
      heroRole = 'CRICKET ATHLETE';
    }

    primaryTeam = v.teams?.[0] || null;
    primaryTeamLogo = primaryTeam && sportDetail.teamLogos?.[primaryTeam] ? sportDetail.teamLogos[primaryTeam] : null;
  } else if (sportDetail.status === 'generic') {
    const p = sportDetail.profile as Record<string, unknown>;
    heroAge = p.age ? String(p.age) : (p.born ? String(calculateAge(String(p.born)) || '--') : '--');
    heroRole = String(p.position || p.playing_role || `${activeSportEntry?.sport.name || 'SPORT'} ATHLETE`).toUpperCase();
    primaryTeam = Array.isArray(p.teams) && p.teams.length > 0 ? String(p.teams[0]) : null;
    const metrics = computeSportHeroMetrics(activeSlug, p);
    heroMatches = metrics.heroMatches;
    heroPrimaryLabel = metrics.heroPrimaryLabel;
    heroPrimaryValue = metrics.heroPrimaryValue;
  }

  // Name & Initials
  const fullPlayerName = (player?.full_name || user?.name || 'Athlete').trim();
  const nameParts = fullPlayerName.split(' ');
  const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || 'A';
  const secondInitial = nameParts[1]?.charAt(0).toUpperCase() || (nameParts[0]?.charAt(1)?.toUpperCase() || '');
  const initials = `${firstInitial}${secondInitial}`;

  if (isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading athlete card...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} scroll style={styles.screen} backgroundColor={colors.background}>
      {/* 1. SWIPEABLE COVER CAROUSEL HERO (UNOBSTRUCTED COVER + BOTTOM-LEFT AVATAR) */}
      <View style={[styles.heroCardContainer, { height: HERO_HEIGHT }]}>
        {/* Background Fallback Canvas */}
        <LinearGradient
          colors={['#070B14', '#0F172A', '#1E293B']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient Neon Lime Glow (Visible when swiping or on empty cover) */}
        <View style={styles.heroGlowBlob} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="profileAura" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colors.energy} stopOpacity={0.22} />
                <Stop offset="65%" stopColor={colors.energy} stopOpacity={0.05} />
                <Stop offset="100%" stopColor={colors.energy} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill="url(#profileAura)" />
          </Svg>
        </View>

        {/* Faint Sport Watermark Crest */}
        {totalPhotoCount === 0 && (
          <View style={styles.watermarkContainer} pointerEvents="none">
            <Ionicons
              name={sportIconFor(activeSlug ?? '')}
              size={220}
              color="rgba(255, 255, 255, 0.035)"
            />
          </View>
        )}

        {/* SWIPEABLE COVER PHOTO CAROUSEL */}
        {slides.length === 0 ? (
          /* Empty Carousel state */
          <View style={styles.emptyCarouselContainer}>
            <Ionicons name="images-outline" size={44} color={colors.textMuted} />
            <Text style={styles.emptyCarouselText}>No cover photos yet</Text>
            <Pressable
              onPress={handleAddGalleryPhoto}
              style={styles.emptyAddBtn}
              disabled={isAddingPhoto}
            >
              <Ionicons name="add" size={16} color={colors.navy} />
              <Text style={styles.emptyAddText}>
                {isAddingPhoto ? 'Uploading...' : 'Add Cover Photos (0/10)'}
              </Text>
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
            {slides.map((slide) => {
              if (slide.isAddPage) {
                return (
                  <Pressable
                    key={slide.key}
                    style={[styles.carouselSlide, styles.addSlide, { width: screenWidth }]}
                    onPress={handleAddGalleryPhoto}
                    disabled={isAddingPhoto}
                  >
                    {isAddingPhoto ? (
                      <ActivityIndicator color={colors.energy} size="large" />
                    ) : (
                      <View style={styles.addSlideContent}>
                        <View style={styles.addSlideIconCircle}>
                          <Ionicons name="add" size={32} color={colors.navy} />
                        </View>
                        <Text style={styles.addSlideTitle}>Add Photo ({photos.length}/{MAX_PHOTOS})</Text>
                        <Text style={styles.addSlideSub}>Swipeable athlete cover photo</Text>
                      </View>
                    )}
                  </Pressable>
                );
              }

              return (
                <View key={slide.key} style={[styles.carouselSlide, { width: screenWidth }]}>
                  {slide.url ? (
                    <Pressable
                      style={StyleSheet.absoluteFill}
                      onPress={() => slide.url && setLightboxUri(slide.url)}
                      accessibilityRole="imagebutton"
                      accessibilityLabel="View full photo"
                    >
                      <Image source={{ uri: slide.url }} style={styles.carouselImage} resizeMode="cover" />
                    </Pressable>
                  ) : null}

                  {/* Delete Badge for gallery photos (top-right under nav) */}
                  {slide.photoId !== undefined && (
                    <Pressable
                      onPress={() => slide.photoId && handleRemoveGalleryPhoto(slide.photoId)}
                      style={styles.deleteBadge}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.white} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* HIGH-CONTRAST VIGNETTE: Clear in center for unobstructed images, dark at top & bottom */}
        <LinearGradient
          colors={['rgba(7, 11, 20, 0.65)', 'rgba(7, 11, 20, 0.05)', 'rgba(7, 11, 20, 0.95)']}
          locations={[0, 0.45, 0.96]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* TOP FROSTED ACTION BAR */}
        <View style={styles.topControlRow}>
          {/* Country / Location Glass Pill */}
          <View style={styles.countryBadgePill}>
            <Ionicons name="location-sharp" size={13} color="rgba(255, 255, 255, 0.85)" />
            <Text style={styles.countryBadgeText} numberOfLines={1}>
              {player?.country ? player.country.toUpperCase() : 'NATIONAL ATHLETE'}
            </Text>
            <View style={styles.countryLiveDot} />
          </View>

          {/* Quick Actions Cluster */}
          <View style={styles.topRightActions}>
            {canAddMorePhotos && (
              <Pressable
                onPress={handleAddGalleryPhoto}
                style={[styles.actionIconButton, styles.addPhotoActionBtn]}
                hitSlop={8}
                disabled={isAddingPhoto}
                accessibilityLabel="Add photo to cover"
              >
                <Ionicons name="add" size={19} color={colors.white} />
              </Pressable>
            )}

            <Pressable
              onPress={handleShare}
              style={styles.actionIconButton}
              hitSlop={8}
              accessibilityLabel="Share athlete card"
            >
              <Ionicons name="share-social-outline" size={17} color={colors.white} />
            </Pressable>

            {sports.length > 0 && (
              <Pressable
                onPress={handleEditPress}
                style={[styles.actionIconButton, styles.editActionBtn]}
                hitSlop={8}
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="create-outline" size={17} color={colors.white} />
              </Pressable>
            )}

            <Pressable
              onPress={handleLogout}
              style={styles.actionIconButton}
              hitSlop={8}
              accessibilityLabel="Log out"
            >
              <Ionicons name="log-out-outline" size={17} color="rgba(255, 255, 255, 0.85)" />
            </Pressable>
          </View>
        </View>

        {/* BOTTOM FOREGROUND BAR: AVATAR AT BOTTOM-LEFT + ATHLETE CREDENTIALS */}
        <View style={styles.heroBottomBar} pointerEvents="box-none">
          <View style={styles.heroProfileRow} pointerEvents="box-none">
            {/* Avatar positioned at bottom-left — center cover stays 100% visible! */}
            <View style={styles.avatarContainer}>
              <Pressable
                onPress={() => {
                  if (avatarUrl) {
                    setLightboxUri(avatarUrl);
                  } else {
                    handleUpdateAvatar();
                  }
                }}
                style={({ pressed }) => [styles.avatarRingOuter, pressed && styles.pressedOpacity]}
                accessibilityRole="button"
                accessibilityLabel="Player avatar"
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={['#1E293B', '#0F172A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarCircle}
                  >
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </LinearGradient>
                )}
              </Pressable>

              {/* Sibling Camera Badge (No nested <button>) */}
              <Pressable
                style={styles.cameraBadge}
                onPress={handleUpdateAvatar}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Update avatar photo"
              >
                {isAddingPhoto ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <Ionicons name="camera" size={13} color={colors.navy} />
                )}
              </Pressable>
            </View>

            {/* Athlete Credentials next to Avatar */}
            <View style={styles.heroIdentityBlock}>
              <View style={styles.proStatusRow}>
                <View style={styles.verifiedBadgePill}>
                  <Ionicons name="shield-checkmark" size={11} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.verifiedBadgeText}>VERIFIED ATHLETE</Text>
                </View>

                {totalPhotoCount > 1 && (
                  <View style={styles.photoCountPill}>
                    <Ionicons name="images-outline" size={11} color="rgba(255, 255, 255, 0.75)" />
                    <Text style={styles.photoCountText}>
                      {carouselIndex + 1}/{totalPhotoCount}
                    </Text>
                  </View>
                )}
              </View>

              {/* High Impact Athlete Name */}
              <Text style={styles.heroFullName} numberOfLines={1}>
                {fullPlayerName}
              </Text>

              {/* Role & Team Subheading */}
              <View style={styles.roleTeamRow}>
                <View style={styles.jerseyIconBox}>
                  <Ionicons name="shirt" size={12} color="rgba(255, 255, 255, 0.9)" />
                </View>
                <Text style={styles.heroRoleText} numberOfLines={1}>{heroRole}</Text>

                {primaryTeam ? (
                  <>
                    <Text style={styles.roleDivider}>•</Text>
                    {primaryTeamLogo ? (
                      <Image source={{ uri: primaryTeamLogo }} style={styles.teamMiniLogo} resizeMode="contain" />
                    ) : (
                      <Ionicons name="shield-outline" size={12} color="rgba(255, 255, 255, 0.7)" />
                    )}
                    <Text style={styles.primaryTeamText} numberOfLines={1}>{primaryTeam}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* Carousel Pagination Dots */}
        {slides.length > 1 && (
          <View style={styles.dotsRow} pointerEvents="none">
            {slides.map((s, i) => (
              <View
                key={s.key}
                style={[
                  styles.dot,
                  i === carouselIndex && styles.dotActive,
                  s.isAddPage && styles.dotAdd,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* 2. THE 3 SIGNATURE HIGH-OCTANE STAT PODS (FLOATING STRIP) */}
      <View style={styles.statsCardsRow}>
        {/* Stat 1: Age / Physical */}
        <View style={[styles.statHighlightCard, shadows.sm]}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={13} color="#2563EB" />
            </View>
            <Text style={styles.statHighlightLabel}>AGE</Text>
          </View>
          <Text style={styles.statHighlightValue}>{heroAge}</Text>
          <Text style={styles.statSubLabel}>Years Old</Text>
        </View>

        {/* Stat 2: Matches / Appearances */}
        <View style={[styles.statHighlightCard, shadows.sm]}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="trophy-outline" size={13} color="#D97706" />
            </View>
            <Text style={styles.statHighlightLabel}>GAMES</Text>
          </View>
          <Text style={styles.statHighlightValue}>{heroMatches}</Text>
          <Text style={styles.statSubLabel}>Appearances</Text>
        </View>

        {/* Stat 3: Primary Career Metric */}
        <View style={[styles.statHighlightCard, shadows.sm]}>
          <View style={styles.statHeaderRow}>
            <View style={[styles.statIconBadge, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="flash-outline" size={13} color="#16A34A" />
            </View>
            <Text style={styles.statHighlightLabel}>
              {heroPrimaryLabel.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.statHighlightValue}>
            {heroPrimaryValue}
          </Text>
          <Text style={styles.statSubLabel}>Career Mark</Text>
        </View>
      </View>

      {/* 3. MULTI-SPORT SWITCHER (IF PLAYER HAS 2+ SPORTS) */}
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

            <Pressable
              style={styles.addSportPill}
              onPress={() => router.push('/(protected)/player-profile/sport-picker')}
            >
              <Ionicons name="add" size={15} color={colors.primary} />
              <Text style={styles.addSportPillText}>Add Sport</Text>
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* 4. NEW USER EXPERIENCE: PRO PASSPORT ONBOARDING HUB */}
      {sports.length === 0 ? (
        <View style={[styles.passportCard, shadows.sm]}>
          {/* Header Banner */}
          <View style={styles.passportHeader}>
            <View style={styles.passportIconCircle}>
              <Ionicons name="sparkles" size={24} color={colors.navy} />
            </View>
            <View style={styles.passportHeaderText}>
              <Text style={styles.passportTitle}>Activate Your Sports Passport</Text>
              <Text style={styles.passportSubtitle}>
                Select your primary sport to build your verified career card, record statistics, and unlock analysis.
              </Text>
            </View>
          </View>

          {/* Quick Progress Roadmap */}
          <View style={styles.passportRoadmap}>
            <View style={styles.roadmapStep}>
              <View style={[styles.roadmapStepDot, styles.roadmapStepDone]}>
                <Ionicons name="checkmark" size={12} color={colors.white} />
              </View>
              <Text style={styles.roadmapStepLabel}>Account Ready</Text>
            </View>

            <View style={styles.roadmapLine} />

            <Pressable style={styles.roadmapStep} onPress={handleUpdateAvatar}>
              <View style={[styles.roadmapStepDot, avatarUrl ? styles.roadmapStepDone : styles.roadmapStepActive]}>
                <Ionicons
                  name={avatarUrl ? 'checkmark' : 'camera'}
                  size={12}
                  color={avatarUrl ? colors.white : colors.navy}
                />
              </View>
              <Text style={styles.roadmapStepLabel}>
                {avatarUrl ? 'Photo Added' : 'Add Photo'}
              </Text>
            </Pressable>

            <View style={styles.roadmapLine} />

            <View style={styles.roadmapStep}>
              <View style={[styles.roadmapStepDot, styles.roadmapStepPending]}>
                <Ionicons name="trophy-outline" size={12} color={colors.textMuted} />
              </View>
              <Text style={styles.roadmapStepLabel}>Choose Sport</Text>
            </View>
          </View>

          {/* Quick 1-Tap Popular Sports Grid */}
          <Text style={styles.quickSelectTitle}>POPULAR DISCIPLINES</Text>
          <View style={styles.quickSportsGrid}>
            {POPULAR_SPORTS.map((s) => (
              <Pressable
                key={s.slug}
                style={({ pressed }) => [styles.quickSportCard, pressed && styles.pressedOpacity]}
                onPress={() => handleQuickSelectSport(s)}
              >
                <Text style={styles.quickSportEmoji}>{s.emoji}</Text>
                <Text style={styles.quickSportName} numberOfLines={1}>{s.name}</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          {/* Primary Action Button */}
          <Pressable
            style={({ pressed }) => [styles.passportMainCta, pressed && styles.pressedOpacity]}
            onPress={() => router.push('/(protected)/player-profile/sport-picker')}
          >
            <Text style={styles.passportMainCtaText}>Browse All 20+ Sports</Text>
            <View style={styles.passportCtaArrow}>
              <Ionicons name="arrow-forward" size={16} color={colors.navy} />
            </View>
          </Pressable>

          {/* Secondary Link */}
          <Pressable
            style={styles.homeLinkBtn}
            onPress={() => router.push('/(protected)/(tabs)/home')}
          >
            <Text style={styles.homeLinkText}>Go to Home Dashboard</Text>
          </Pressable>
        </View>
      ) : (
        /* 5. EMBEDDED SPORT PROFILE (ABOUT, CAREER STATS, RECENT MATCHES) */
        <View style={styles.embeddedWrapper}>
          {sportDetail.status === 'loading' || !lookups ? (
            <ActivityIndicator color={colors.primary} style={styles.statsLoading} size="large" />
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
              collegeLogoUrl={(player as any)?.college_logo_url || null}
              {...buildSportDetailProps(sportDetail.config, sportDetail.profile, lookups)}
            />
          )}
        </View>
      )}

      {isLoggingOut && <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />}

      {/* Lightbox for full-screen photo viewing */}
      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />

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
  loadingContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 14,
  },
  loadingIndicator: {
    marginVertical: spacing.xl,
  },
  pressedOpacity: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  // 1. HERO ATHLETE CARD
  heroCardContainer: {
    position: 'relative',
    backgroundColor: '#070B14',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    ...shadows.md,
  },
  heroGlowBlob: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 260,
    height: 260,
    zIndex: 1,
  },
  watermarkContainer: {
    position: 'absolute',
    bottom: 20,
    left: -20,
    zIndex: 1,
  },

  // CAROUSEL
  carouselScrollView: {
    flex: 1,
    zIndex: 2,
  },
  carouselSlide: {
    height: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  deleteBadge: {
    position: 'absolute',
    top: spacing.lg + 46,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  addSlide: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlideContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 40,
  },
  addSlideIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.energy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  addSlideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
    marginTop: 4,
  },
  addSlideSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  emptyCarouselContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 50,
  },
  emptyCarouselText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.energy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    marginTop: 4,
  },
  emptyAddText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
  },

  // TOP NAVIGATION
  topControlRow: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 25,
  },
  countryBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(7, 11, 20, 0.65)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  countryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.6,
  },
  countryLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(7, 11, 20, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  editActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  // BOTTOM HERO BAR (AVATAR AT BOTTOM-LEFT + NAME & CREDENTIALS)
  heroBottomBar: {
    position: 'absolute',
    bottom: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 20,
  },
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    ...shadows.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -1,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    zIndex: 15,
    ...shadows.sm,
  },

  heroIdentityBlock: {
    flex: 1,
    gap: 3,
  },
  proStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.8,
  },
  photoCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.full,
  },
  photoCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  heroFullName: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  roleTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  jerseyIconBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRoleText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  roleDivider: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  teamMiniLogo: {
    width: 15,
    height: 15,
    borderRadius: 4,
  },
  primaryTeamText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // CAROUSEL DOTS
  dotsRow: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 22,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 18,
  },
  dotAdd: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },

  // 2. SIGNATURE HIGHLIGHT STAT PODS
  statsCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 10,
    marginTop: -12,
    marginBottom: spacing.md,
    zIndex: 30,
  },
  statHighlightCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  statHighlightCardFeatured: {
    borderColor: colors.border,
    backgroundColor: colors.card,
    position: 'relative',
    overflow: 'hidden',
  },
  featuredStatIndicator: {
    display: 'none',
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statHighlightLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  statHighlightLabelFeatured: {
    color: colors.navy,
  },
  statHighlightValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statHighlightValueFeatured: {
    color: colors.navy,
  },
  statSubLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textFaint,
    marginTop: 2,
  },

  // 3. MULTI-SPORT SWITCHER
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
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  sportPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sportPillTextActive: {
    color: colors.white,
  },
  addSportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  addSportPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // 4. PASSPORT ONBOARDING HUB (ZERO SPORTS STATE)
  passportCard: {
    backgroundColor: colors.card,
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.md,
  },
  passportIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.energy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  passportHeaderText: {
    flex: 1,
  },
  passportTitle: {
    ...typography.h3,
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },
  passportSubtitle: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },

  // ROADMAP
  passportRoadmap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  roadmapStep: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  roadmapStepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roadmapStepDone: {
    backgroundColor: colors.success,
  },
  roadmapStepActive: {
    backgroundColor: colors.energy,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  roadmapStepPending: {
    backgroundColor: colors.border,
  },
  roadmapStepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  roadmapLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.border,
    marginBottom: 14,
  },

  // QUICK SPORTS GRID
  quickSelectTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  quickSportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  quickSportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48.5%',
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickSportEmoji: {
    fontSize: 18,
  },
  quickSportName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  // PASSPORT CTAs
  passportMainCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.navy,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...shadows.sm,
  },
  passportMainCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
  passportCtaArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.energy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeLinkBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  homeLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // 5. EMBEDDED DETAILS & SHARE
  embeddedWrapper: {
    paddingHorizontal: 0,
  },
  statsLoading: {
    marginVertical: spacing.xl,
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

  // MODAL SHEET
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalIconCircle: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRowText: {
    flex: 1,
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
});
