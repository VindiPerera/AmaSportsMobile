import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, getSportTheme, radius, shadows, spacing, typography } from '../../theme';
import { CricketProfileFormValues, Lookups } from '../../types';
import { formatBornDate, formatDetailedAge, formatShortMatchDate, sortCareerStatsNewestFirst, sortRecentMatchesNewestFirst } from '../../utils/date';
import { ImageLightbox } from '../ui/ImageLightbox';
import { AchievementsTabPanel } from '../achievements/AchievementsTabPanel';

const CRICKET_TAB_ITEMS: {
  key: 'overview' | 'stats' | 'matches' | 'achievements';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'overview', label: 'Overview', icon: 'person-outline' },
  { key: 'stats', label: 'Stats', icon: 'stats-chart-outline' },
  { key: 'matches', label: 'Matches', icon: 'calendar-outline' },
  { key: 'achievements', label: 'Achievements', icon: 'trophy-outline' },
];

interface CricketPlayerDetailViewProps {
  fullName: string;
  country: string;
  photoUrl?: string | null;
  coverUrl?: string | null;
  values: CricketProfileFormValues;
  lookups: Lookups;
  /** Logo per team name (see TeamsInput) — a team with no entry here just
   * shows the default shield icon. */
  teamLogos?: Record<string, string>;
  /** College/University logo (see CollegeLogoUpload). */
  collegeLogoUrl?: string | null;
  onEditPress?: () => void;
  onBackPress?: () => void;
  /** True when embedded inline in another screen that already provides its
   * own header/photo/edit affordance (see the Player Profile tab) — skips
   * this component's own cover-photo/nav-bar/identity header and dark tab
   * styling, and renders as a plain block (no `flex:1` + internal
   * ScrollView, which don't nest inside another scrolling screen) instead
   * of a self-contained full-screen view. `onBackPress`/coverUrl/photoUrl
   * are unused in this mode. */
  embedded?: boolean;
}

export function CricketPlayerDetailView({
  fullName,
  country,
  photoUrl,
  coverUrl,
  values,
  lookups,
  teamLogos,
  collegeLogoUrl,
  onEditPress,
  onBackPress,
  embedded = false,
}: CricketPlayerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'matches' | 'achievements'>('overview');
  // Tapping the cover photo or the avatar opens it full-screen in this.
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  // Name helpers
  const nameParts = fullName.trim().split(' ');
  const displayName = fullName || 'Player Name';
  const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : displayName;

  // Category lookup helper — `cricket_divisions` (not the shared `formats`
  // table other sports use), shown under the "Category" header below.
  const getFormatName = (formatId: string): string => {
    if (!formatId) return '-';
    const found = lookups.cricket_divisions.find((f) => String(f.id) === String(formatId));
    return found ? found.name : '-';
  };

  // Format lookup helper — `cricket_categories` (not the shared
  // `age_categories` table other sports use), shown under the "Format" header.
  const getAgeCategoryName = (ageCategoryId: string): string => {
    const found = lookups.cricket_categories.find((a) => String(a.id) === String(ageCategoryId));
    return found ? found.name : '-';
  };

  // Process Batting Rows — newest Year first
  const hasBattingStats = values.batting && values.batting.length > 0;
  const battingRows = hasBattingStats ? sortCareerStatsNewestFirst(values.batting) : [];

  // Process Bowling Rows — newest Year first
  const hasBowlingStats = values.bowling && values.bowling.length > 0;
  const bowlingRows = hasBowlingStats ? sortCareerStatsNewestFirst(values.bowling) : [];

  // Process Recent Matches — newest first
  const hasRecentMatches = values.recent_matches && values.recent_matches.length > 0;
  const recentMatches = hasRecentMatches ? sortRecentMatchesNewestFirst(values.recent_matches) : [];

  // Highlight Stats calculations for header/summary
  const totalMatches = Math.max(
    battingRows.reduce((sum, r) => sum + (parseInt(r.matches, 10) || 0), 0),
    bowlingRows.reduce((sum, r) => sum + (parseInt(r.matches, 10) || 0), 0)
  );
  const totalRuns = battingRows.reduce((sum, r) => sum + (parseInt(r.runs, 10) || 0), 0);
  const totalWickets = bowlingRows.reduce((sum, r) => sum + (parseInt(r.wickets, 10) || 0), 0);
  const primaryStatLabel = totalRuns >= totalWickets ? 'Runs' : 'Wickets';
  const primaryStatValue = totalRuns >= totalWickets ? totalRuns : totalWickets;

  // Debut & Last Matches (not supported yet)
  const debutLastData: any[] = [];

  const sportTheme = getSportTheme('cricket');

  return (
    <View style={embedded ? styles.embeddedContainer : styles.container}>
      {/* Dark Navy Header Banner — skipped when embedded */}
      {!embedded && (
      <View style={[styles.headerBanner, { backgroundColor: sportTheme.primaryDark }]}>
        {coverUrl ? (
          <Pressable onPress={() => setLightboxUri(coverUrl)} style={StyleSheet.absoluteFill}>
            <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(11, 27, 61, 0.45)', sportTheme.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </Pressable>
        ) : (
          <LinearGradient
            colors={sportTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}

        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable onPress={onBackPress} style={styles.navIconButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </Pressable>

          <View style={styles.navActionsRight}>
            {onEditPress && (
              <Pressable onPress={onEditPress} style={[styles.editBadgeButton, { backgroundColor: sportTheme.primary }]}>
                <Ionicons name="create-outline" size={14} color={colors.white} />
                <Text style={styles.editBadgeText}>Edit Profile</Text>
              </Pressable>
            )}
            <Pressable style={styles.navIconButton} hitSlop={8}>
              <Ionicons name="share-social-outline" size={20} color={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* Player Header Identity */}
        <View style={styles.playerIdentityRow}>
          <View style={styles.playerInfoCol}>
            <Text style={styles.headerPlayerName} numberOfLines={2}>
              {shortName}
            </Text>
            <View style={styles.countryRow}>
              <Ionicons name={sportTheme.icon} size={14} color={sportTheme.accent} />
              <Text style={styles.headerSportTag}>CRICKET</Text>
              {!!country && (
                <>
                  <Text style={styles.headerDot}>•</Text>
                  <Text style={styles.headerCountry}>{country}</Text>
                </>
              )}
            </View>
          </View>

          <View style={[styles.avatarContainer, { borderColor: sportTheme.accent }]}>
            {photoUrl ? (
              <Pressable onPress={() => setLightboxUri(photoUrl)} style={styles.avatarPressable}>
                <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
              </Pressable>
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: sportTheme.primaryDark }]}>
                <Text style={styles.avatarInitials}>
                  {displayName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      )}

      {/* Navigation Tabs (Overview / Stats / Matches / Achievements) —
          Dedicated sport-themed rail with zero clipping and high-contrast styling */}
      {!embedded ? (
        <View style={[styles.tabsBarWrapper, { backgroundColor: sportTheme.tabBg }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScrollView}
            contentContainerStyle={styles.tabsRow}
          >
            {CRICKET_TAB_ITEMS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    isActive && [
                      styles.tabButtonActive,
                      {
                        backgroundColor: sportTheme.tabActiveBg,
                        borderColor: sportTheme.tabActiveBorder,
                      },
                    ],
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Ionicons
                    name={tab.icon}
                    size={15}
                    color={isActive ? sportTheme.accent : 'rgba(255, 255, 255, 0.65)'}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      isActive && [styles.tabTextActive, { color: sportTheme.accent }],
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isActive && (
                    <View
                      style={[
                        styles.activeTabIndicator,
                        { backgroundColor: sportTheme.accent },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.embeddedTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.embeddedTabsScrollView}
            contentContainerStyle={styles.embeddedTabsRow}
          >
            {CRICKET_TAB_ITEMS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.embeddedTabButton,
                    isActive && [
                      styles.embeddedTabButtonActive,
                      {
                        backgroundColor: sportTheme.primary,
                        borderColor: sportTheme.primary,
                      },
                    ],
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                >
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={isActive ? colors.white : colors.textMuted}
                    style={styles.tabIcon}
                  />
                  <Text
                    style={[
                      styles.embeddedTabText,
                      isActive && styles.embeddedTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Tab Content */}
      <ScrollView
        scrollEnabled={!embedded}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'overview' ? (
          <>
            {/* Card 1: Personal Overview Details (ABOUT) */}
            <View style={[styles.card, shadows.sm]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.cardHeaderTitle}>About Athlete</Text>
              </View>

              <View style={styles.detailGrid}>
                {/* Full Name */}
                <View style={styles.gridItemFull}>
                  <Text style={styles.fieldLabel}>FULL NAME</Text>
                  <Text style={styles.fieldValueBold}>{displayName}</Text>
                </View>

                {/* Born & Age */}
                <View style={styles.gridRowTwoCol}>
                  <View style={styles.gridItemHalf}>
                    <Text style={styles.fieldLabel}>BORN</Text>
                    <Text style={styles.fieldValueBold}>
                      {formatBornDate(values.born)}
                    </Text>
                  </View>
                  <View style={styles.gridItemHalf}>
                    <Text style={styles.fieldLabel}>AGE</Text>
                    <Text style={styles.fieldValueBold}>
                      {formatDetailedAge(values.born, values.age)}
                    </Text>
                  </View>
                </View>

                {/* Batting & Bowling Style */}
                <View style={styles.gridRowTwoCol}>
                  <View style={styles.gridItemHalf}>
                    <Text style={styles.fieldLabel}>BATTING STYLE</Text>
                    <Text style={styles.fieldValueBold}>
                      {values.batting_style || '-'}
                    </Text>
                  </View>
                  <View style={styles.gridItemHalf}>
                    <Text style={styles.fieldLabel}>BOWLING STYLE</Text>
                    <Text style={styles.fieldValueBold}>
                      {values.bowling_style || '-'}
                    </Text>
                  </View>
                </View>

                {/* Role / Height / Education */}
                {values.playing_role ? (
                  <View style={styles.gridItemFull}>
                    <Text style={styles.fieldLabel}>PLAYING ROLE</Text>
                    <Text style={styles.fieldValueBold}>{values.playing_role}</Text>
                  </View>
                ) : null}

                {values.college_university ? (
                  <View style={styles.gridItemFull}>
                    <Text style={styles.fieldLabel}>EDUCATION</Text>
                    <View style={styles.educationRow}>
                      {collegeLogoUrl ? (
                        <Image source={{ uri: collegeLogoUrl }} style={styles.educationLogo} />
                      ) : null}
                      <Text style={styles.fieldValueBold}>{values.college_university}</Text>
                    </View>
                  </View>
                ) : null}

                {/* Teams */}
                {values.teams && values.teams.length > 0 && (
                  <View style={styles.gridItemFull}>
                    <Text style={styles.fieldLabel}>TEAMS</Text>
                    <View style={styles.teamsChipList}>
                      {values.teams.map((team, idx) => (
                        <View key={idx} style={styles.teamBadge}>
                          <View style={styles.teamBadgeIcon}>
                            {teamLogos?.[team] ? (
                              <Image source={{ uri: teamLogos[team] }} style={styles.teamBadgeLogo} />
                            ) : (
                              <Ionicons name="shield" size={14} color={colors.primary} />
                            )}
                          </View>
                          <Text style={styles.teamBadgeText}>{team}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Card 2: Career Stats */}
            {(hasBattingStats || hasBowlingStats) && (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
                  <Text style={styles.cardHeaderTitle}>{shortName} Career Stats</Text>
                </View>

                {/* Batting & Fielding */}
                {hasBattingStats && (
                  <View style={styles.statSubSection}>
                    <Text style={styles.subSectionHeader}>BATTING & FIELDING</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                          <Text style={styles.thCell}>Year</Text>
                          <Text style={[styles.thCell, styles.thCategoryWide]}>Format</Text>
                          <Text style={[styles.thCell, styles.thFormat]}>Category</Text>
                          <Text style={styles.thCell}>Mat</Text>
                          <Text style={styles.thCell}>Inns</Text>
                          <Text style={styles.thCell}>NO</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Runs</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>HS</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Ave</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>SR</Text>
                          <Text style={styles.thCell}>100s</Text>
                          <Text style={styles.thCell}>50s</Text>
                          <Text style={styles.thCell}>Ct</Text>
                        </View>

                        {/* Table Rows */}
                        {battingRows.map((row, idx) => (
                          <View
                            key={idx}
                            style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                          >
                            <Text style={styles.tdCell}>{row.year || '-'}</Text>
                            <Text style={[styles.tdCell, styles.thCategoryWide]} numberOfLines={1}>{getAgeCategoryName(row.age_category_id)}</Text>
                            <Text style={[styles.tdCellBold, styles.thFormat]} numberOfLines={1}>
                              {getFormatName(row.format_id)}
                            </Text>
                            <Text style={styles.tdCell}>{row.matches || '-'}</Text>
                            <Text style={styles.tdCell}>{row.innings || '-'}</Text>
                            <Text style={styles.tdCell}>{row.not_out || '-'}</Text>
                            <Text style={[styles.tdCellBold, styles.tdCellHighlight, styles.tdCellWide]} numberOfLines={1}>{row.runs || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.hs || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.average || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.sr || '-'}</Text>
                            <Text style={styles.tdCell}>{row.hundreds || '0'}</Text>
                            <Text style={styles.tdCell}>{row.fifties || '0'}</Text>
                            <Text style={styles.tdCell}>{row.catches || '0'}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Bowling */}
                {hasBowlingStats && (
                  <View style={styles.statSubSection}>
                    <Text style={styles.subSectionHeader}>BOWLING</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                          <Text style={styles.thCell}>Year</Text>
                          <Text style={[styles.thCell, styles.thCategoryWide]}>Format</Text>
                          <Text style={[styles.thCell, styles.thFormat]}>Category</Text>
                          <Text style={styles.thCell}>Mat</Text>
                          <Text style={styles.thCell}>Inns</Text>
                          <Text style={styles.thCell}>Balls</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Runs</Text>
                          <Text style={styles.thCell}>Wkts</Text>
                          <Text style={styles.thCell}>BBI</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Ave</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Econ</Text>
                          <Text style={styles.thCell}>4w</Text>
                          <Text style={styles.thCell}>5w</Text>
                        </View>

                        {/* Table Rows */}
                        {bowlingRows.map((row, idx) => (
                          <View
                            key={idx}
                            style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                          >
                            <Text style={styles.tdCell}>{row.year || '-'}</Text>
                            <Text style={[styles.tdCell, styles.thCategoryWide]} numberOfLines={1}>{getAgeCategoryName(row.age_category_id)}</Text>
                            <Text style={[styles.tdCellBold, styles.thFormat]} numberOfLines={1}>
                              {getFormatName(row.format_id)}
                            </Text>
                            <Text style={styles.tdCell}>{row.matches || '-'}</Text>
                            <Text style={styles.tdCell}>{row.innings || '-'}</Text>
                            <Text style={styles.tdCell}>{row.balls || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.runs || '-'}</Text>
                            <Text style={[styles.tdCellBold, styles.tdCellHighlight]}>{row.wickets || '-'}</Text>
                            <Text style={styles.tdCell}>{row.bbi || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.average || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.economy || '-'}</Text>
                            <Text style={styles.tdCell}>{row.four_w || '0'}</Text>
                            <Text style={styles.tdCell}>{row.five_w || '0'}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* Card 3: Recent Matches */}
            {hasRecentMatches && (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.cardHeaderTitle}>Recent Matches of {shortName}</Text>
                </View>

                <RecentMatchesTable matches={recentMatches} />
              </View>
            )}
          </>
        ) : activeTab === 'stats' ? (
          /* Stats Tab Content */
          <>
            {(hasBattingStats || hasBowlingStats) ? (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
                  <Text style={styles.cardHeaderTitle}>{shortName} Career Statistics</Text>
                </View>

                {/* Batting & Fielding */}
                {hasBattingStats && (
                  <View style={styles.statSubSection}>
                    <Text style={styles.subSectionHeader}>BATTING & FIELDING</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tableContainer}>
                        <View style={styles.tableHeaderRow}>
                          <Text style={styles.thCell}>Year</Text>
                          <Text style={[styles.thCell, styles.thCategoryWide]}>Format</Text>
                          <Text style={[styles.thCell, styles.thFormat]}>Category</Text>
                          <Text style={styles.thCell}>Mat</Text>
                          <Text style={styles.thCell}>Inns</Text>
                          <Text style={styles.thCell}>NO</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Runs</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>HS</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Ave</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>SR</Text>
                          <Text style={styles.thCell}>100s</Text>
                          <Text style={styles.thCell}>50s</Text>
                          <Text style={styles.thCell}>Ct</Text>
                        </View>

                        {battingRows.map((row, idx) => (
                          <View
                            key={idx}
                            style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                          >
                            <Text style={styles.tdCell}>{row.year || '-'}</Text>
                            <Text style={[styles.tdCell, styles.thCategoryWide]} numberOfLines={1}>{getAgeCategoryName(row.age_category_id)}</Text>
                            <Text style={[styles.tdCellBold, styles.thFormat]} numberOfLines={1}>
                              {getFormatName(row.format_id)}
                            </Text>
                            <Text style={styles.tdCell}>{row.matches || '-'}</Text>
                            <Text style={styles.tdCell}>{row.innings || '-'}</Text>
                            <Text style={styles.tdCell}>{row.not_out || '-'}</Text>
                            <Text style={[styles.tdCellBold, styles.tdCellHighlight, styles.tdCellWide]} numberOfLines={1}>{row.runs || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.hs || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.average || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.sr || '-'}</Text>
                            <Text style={styles.tdCell}>{row.hundreds || '0'}</Text>
                            <Text style={styles.tdCell}>{row.fifties || '0'}</Text>
                            <Text style={styles.tdCell}>{row.catches || '0'}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Bowling */}
                {hasBowlingStats && (
                  <View style={styles.statSubSection}>
                    <Text style={styles.subSectionHeader}>BOWLING</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tableContainer}>
                        <View style={styles.tableHeaderRow}>
                          <Text style={styles.thCell}>Year</Text>
                          <Text style={[styles.thCell, styles.thCategoryWide]}>Format</Text>
                          <Text style={[styles.thCell, styles.thFormat]}>Category</Text>
                          <Text style={styles.thCell}>Mat</Text>
                          <Text style={styles.thCell}>Inns</Text>
                          <Text style={styles.thCell}>Balls</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Runs</Text>
                          <Text style={styles.thCell}>Wkts</Text>
                          <Text style={styles.thCell}>BBI</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Ave</Text>
                          <Text style={[styles.thCell, styles.thCellWide]}>Econ</Text>
                          <Text style={styles.thCell}>4w</Text>
                          <Text style={styles.thCell}>5w</Text>
                        </View>

                        {bowlingRows.map((row, idx) => (
                          <View
                            key={idx}
                            style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                          >
                            <Text style={styles.tdCell}>{row.year || '-'}</Text>
                            <Text style={[styles.tdCell, styles.thCategoryWide]} numberOfLines={1}>{getAgeCategoryName(row.age_category_id)}</Text>
                            <Text style={[styles.tdCellBold, styles.thFormat]} numberOfLines={1}>
                              {getFormatName(row.format_id)}
                            </Text>
                            <Text style={styles.tdCell}>{row.matches || '-'}</Text>
                            <Text style={styles.tdCell}>{row.innings || '-'}</Text>
                            <Text style={styles.tdCell}>{row.balls || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.runs || '-'}</Text>
                            <Text style={[styles.tdCellBold, styles.tdCellHighlight]}>{row.wickets || '-'}</Text>
                            <Text style={styles.tdCell}>{row.bbi || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.average || '-'}</Text>
                            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{row.economy || '-'}</Text>
                            <Text style={styles.tdCell}>{row.four_w || '0'}</Text>
                            <Text style={styles.tdCell}>{row.five_w || '0'}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.card, styles.emptyStatsCard]}>
                <Ionicons name="stats-chart-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyStatsText}>No career stats recorded yet.</Text>
              </View>
            )}
          </>
        ) : activeTab === 'matches' ? (
          /* Matches Tab Content */
          <>
            {/* Recent Matches */}
            {hasRecentMatches ? (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.cardHeaderTitle}>Recent Matches - {shortName}</Text>
                </View>

                <RecentMatchesTable matches={recentMatches} />
              </View>
            ) : (
              <View style={[styles.card, styles.emptyStatsCard]}>
                <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyStatsText}>No recent matches recorded yet.</Text>
              </View>
            )}

            {/* Footer Copyright notice matching Cricbuzz layout */}
            <View style={styles.footerBranding}>
              <Text style={styles.footerLegal}>Terms of Use | Privacy Policy | Feedback</Text>
              <Text style={styles.footerCopyright}>© 2026 AmaX Ltd. All rights reserved</Text>
            </View>
          </>
        ) : (
          /* Achievements Tab Content */
          <View style={[styles.card, shadows.sm]}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="trophy-outline" size={18} color={colors.primary} />
              <Text style={styles.cardHeaderTitle}>Achievements - {shortName}</Text>
            </View>
            <AchievementsTabPanel />
          </View>
        )}
      </ScrollView>

      {/* Full-screen view of whichever photo (cover or avatar) was tapped. */}
      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
    </View>
  );
}

/**
 * Every field entered on the Recent Matches form — Date, Match, Played XI,
 * Runs, Balls (batting), 4s, 6s, Maidens, Wkts, Catches, Stumpings — not
 * just a Bat/Bowl summary, so nothing entered on the form goes missing in
 * the read-only view. Bowling balls bowled isn't shown here (product
 * decision: one "Balls" column only, for batting) — it still lives in the
 * form and feeds Bowling Career Stats/Economy as normal, just isn't
 * duplicated in this table. Wide by design (11 columns), so it scrolls
 * horizontally like the Batting/Bowling tables above it.
 */
function RecentMatchesTable({ matches }: { matches: CricketProfileFormValues['recent_matches'] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.recentMatchesTable, styles.recentMatchesTableScrollable]}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thCell, styles.thDate]}>Date</Text>
          <Text style={[styles.thCell, styles.thMatchName]}>Match</Text>
          <Text style={styles.thCell}>XI</Text>
          <Text style={[styles.thCell, styles.thCellWide]}>Runs</Text>
          <Text style={styles.thCell}>Balls</Text>
          <Text style={styles.thCell}>4s</Text>
          <Text style={styles.thCell}>6s</Text>
          <Text style={styles.thCell}>Mdns</Text>
          <Text style={styles.thCell}>Wkts</Text>
          <Text style={styles.thCell}>Ct</Text>
          <Text style={styles.thCell}>St</Text>
        </View>

        {matches.map((m, idx) => (
          <View key={idx} style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}>
            <Text style={[styles.tdCellFaint, styles.thDate]}>{formatShortMatchDate(m.match_date)}</Text>
            <Text style={[styles.tdCellBold, styles.thMatchName]} numberOfLines={1}>
              {m.opponent || '-'}
            </Text>
            <Text style={styles.tdCell}>{m.played_xi ? 'Y' : 'N'}</Text>
            <Text style={[styles.tdCell, styles.tdCellWide]} numberOfLines={1}>{m.runs || '-'}</Text>
            <Text style={styles.tdCell}>{m.balls || '-'}</Text>
            <Text style={styles.tdCell}>{m.fours || '0'}</Text>
            <Text style={styles.tdCell}>{m.sixes || '0'}</Text>
            <Text style={styles.tdCell}>{m.maidens || '0'}</Text>
            <Text style={styles.tdCell}>{m.wickets || '-'}</Text>
            <Text style={styles.tdCell}>{m.catches || '0'}</Text>
            <Text style={styles.tdCell}>{m.stumpings || '0'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBanner: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navIconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
  editBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  playerIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  playerInfoCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  headerPlayerName: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 28,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerSportTag: {
    ...typography.caption,
    color: colors.energy,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  headerDot: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  headerCountry: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.white,
    overflow: 'hidden',
    backgroundColor: colors.navyDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPressable: {
    width: '100%',
    height: '100%',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    ...typography.h2,
    color: colors.white,
    fontWeight: '700',
  },
  // Dedicated sport-themed tabs navigation rail
  tabsBarWrapper: {
    minHeight: 52,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    paddingVertical: 6,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  tabButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: -3,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: radius.full,
  },
  embeddedContainer: {
    backgroundColor: colors.background,
  },
  embeddedTabsWrapper: {
    marginBottom: spacing.sm,
  },
  embeddedTabsScrollView: {
    flexGrow: 0,
  },
  embeddedTabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  embeddedTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  embeddedTabButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  embeddedTabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  embeddedTabTextActive: {
    color: colors.white,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },
  emptyStatsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyStatsText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  tdCellHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
  detailGrid: {
    gap: spacing.md,
  },
  gridItemFull: {
    gap: 4,
  },
  gridRowTwoCol: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridItemHalf: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  fieldValueBold: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  educationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  educationLogo: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  teamsChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 4,
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#D0DFFF',
  },
  teamBadgeIcon: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  teamBadgeLogo: {
    width: '100%',
    height: '100%',
  },
  teamBadgeText: {
    ...typography.body,
    color: colors.navy,
    fontWeight: '700',
    fontSize: 13,
  },
  statSubSection: {
    marginBottom: spacing.lg,
  },
  subSectionHeader: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  tableContainer: {
    minWidth: 500,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.cardSubtle,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: '#FAFCFF',
  },
  thCell: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 11,
    width: 38,
    textAlign: 'center',
  },
  // Runs/HS/Ave/SR/Econ can run to 7+ digits (career totals, or a lopsided
  // runs-vs-balls ratio blowing up the derived Ave/SR/Econ) — the default
  // 38px column wraps those onto a second line and breaks row alignment,
  // so these get more room plus a hard one-line clamp.
  thCellWide: {
    width: 82,
  },
  // The Format list (e.g. "State Service Div III") runs far longer than the
  // old Category values it replaced — needs real room, left-aligned like
  // thFormat below rather than centered.
  thCategoryWide: {
    width: 150,
    textAlign: 'left',
  },
  thFormat: {
    width: 85,
    textAlign: 'left',
  },
  thMatchName: {
    // Fixed (not flex: 1) — this column now sits inside a horizontal
    // ScrollView (see recentMatchesTableScrollable) alongside Batting/
    // Bowling, so it needs a real width to size against rather than one
    // that only resolves against a bounding container the ScrollView
    // doesn't provide.
    width: 130,
    textAlign: 'left',
  },
  thDate: {
    // Was 85 with no padding — the date text ("06-May-2026") already used
    // the full width, so adding paddingRight without widening would wrap
    // it instead of creating breathing room before the Match column.
    width: 93,
    textAlign: 'right',
    // Right-aligned against a left-aligned Match column right next to it —
    // without this they sit flush against each other with no gap.
    paddingRight: spacing.sm,
  },
  tdCell: {
    ...typography.body,
    color: colors.text,
    fontSize: 13,
    width: 38,
    textAlign: 'center',
  },
  tdCellBold: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    width: 38,
    textAlign: 'center',
  },
  tdCellWide: {
    width: 82,
  },
  tdCellFaint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  recentMatchesTable: {
    marginTop: spacing.xs,
  },
  recentMatchesTableScrollable: {
    // A little trailing breathing room once scrolled all the way right.
    paddingRight: spacing.sm,
  },
  debutBlock: {
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  debutCategoryHeader: {
    backgroundColor: '#EBEFF7',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  debutCategoryTitle: {
    ...typography.caption,
    color: colors.navy,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  debutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  borderTopDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  debutContent: {
    flex: 1,
    paddingRight: spacing.sm,
    gap: 2,
  },
  debutMatchText: {
    ...typography.body,
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  footerBranding: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    gap: 4,
  },
  footerLegal: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  footerCopyright: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 11,
  },
});
