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
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { CricketProfileFormValues, Lookups } from '../../types';
import { formatBornDate, formatDetailedAge, formatShortMatchDate, sortCareerStatsNewestFirst, sortRecentMatchesNewestFirst } from '../../utils/date';
import { ImageLightbox } from '../ui/ImageLightbox';

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
}: CricketPlayerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches'>('overview');
  // Tapping the cover photo or the avatar opens it full-screen in this.
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  // Name helpers
  const nameParts = fullName.trim().split(' ');
  const displayName = fullName || 'Player Name';
  const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : displayName;

  // Division lookup helper — `cricket_divisions` (not the shared `formats`
  // table other sports use), shown under the "Div" header below. Only a
  // handful of Categories have one, so a blank formatId is normal, not an
  // error — shown as "-" rather than a fabricated placeholder.
  const getFormatName = (formatId: string): string => {
    if (!formatId) return '-';
    const found = lookups.cricket_divisions.find((f) => String(f.id) === String(formatId));
    return found ? found.name : '-';
  };

  // Category lookup helper — `cricket_categories` (not the shared
  // `age_categories` table other sports use), shown under the "Cat" header
  // below.
  const getAgeCategoryName = (ageCategoryId: string): string => {
    const found = lookups.cricket_categories.find((a) => String(a.id) === String(ageCategoryId));
    return found ? found.name : '-';
  };

  // Process Batting Rows — newest Year first regardless of the order they
  // arrived in (e.g. a 2027 entry added after a 2026 one shows above it).
  const hasBattingStats = values.batting && values.batting.length > 0;
  const battingRows = hasBattingStats ? sortCareerStatsNewestFirst(values.batting) : [];

  // Process Bowling Rows — same newest-Year-first rule as Batting above.
  const hasBowlingStats = values.bowling && values.bowling.length > 0;
  const bowlingRows = hasBowlingStats ? sortCareerStatsNewestFirst(values.bowling) : [];

  // Process Recent Matches — newest first regardless of the order they
  // arrived in (e.g. older data saved before this rule existed).
  const hasRecentMatches = values.recent_matches && values.recent_matches.length > 0;
  const recentMatches = hasRecentMatches ? sortRecentMatchesNewestFirst(values.recent_matches) : [];

  // Debut & Last Matches (not supported yet)
  const debutLastData: any[] = [];

  return (
    <View style={styles.container}>
      {/* Dark Navy Header Banner */}
      <View style={styles.headerBanner}>
        {coverUrl ? (
          <Pressable onPress={() => setLightboxUri(coverUrl)} style={StyleSheet.absoluteFill}>
            <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </Pressable>
        ) : null}
        {/* Light scrim, not a heavy one — the cover photo itself should read
            clearly; this only needs to keep the white name/icon text
            legible where it sits near the bottom. */}
        <LinearGradient
          colors={coverUrl ? ['rgba(11, 25, 44, 0.15)', 'rgba(11, 25, 44, 0.55)'] : colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable onPress={onBackPress} style={styles.navIconButton} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={colors.white} />
          </Pressable>

          <View style={styles.navActionsRight}>
            {onEditPress && (
              <Pressable onPress={onEditPress} style={styles.editBadgeButton}>
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
              <Ionicons name="location-outline" size={14} color={colors.energy} />
              <Text style={styles.headerCountry}>{country || 'Sri Lanka'}</Text>
            </View>
          </View>

          <View style={styles.avatarContainer}>
            {photoUrl ? (
              <Pressable onPress={() => setLightboxUri(photoUrl)} style={styles.avatarPressable}>
                <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
              </Pressable>
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>
                  {displayName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Navigation Tabs (Overview / Matches) */}
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}
            >
              Overview
            </Text>
            {activeTab === 'overview' && <View style={styles.activeTabLine} />}
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'matches' && styles.tabButtonActive]}
            onPress={() => setActiveTab('matches')}
          >
            <Text
              style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}
            >
              Matches
            </Text>
            {activeTab === 'matches' && <View style={styles.activeTabLine} />}
          </Pressable>
        </View>
      </View>

      {/* Main Tab Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'overview' ? (
          <>
            {/* Card 1: Personal Overview Details */}
            <View style={[styles.card, shadows.sm]}>
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
                <Text style={styles.cardHeaderTitle}>{shortName} Career Stats</Text>

                {/* Batting & Fielding */}
                {hasBattingStats && (
                  <View style={styles.statSubSection}>
                    <Text style={styles.subSectionHeader}>BATTING & FIELDING</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={styles.tableHeaderRow}>
                          <Text style={styles.thCell}>Year</Text>
                          <Text style={styles.thCell}>Cat</Text>
                          <Text style={[styles.thCell, styles.thFormat]}>Div</Text>
                          <Text style={styles.thCell}>Mat</Text>
                          <Text style={styles.thCell}>Inns</Text>
                          <Text style={styles.thCell}>NO</Text>
                          <Text style={styles.thCell}>Runs</Text>
                          <Text style={styles.thCell}>HS</Text>
                          <Text style={styles.thCell}>Ave</Text>
                          <Text style={styles.thCell}>SR</Text>
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
                            <Text style={styles.tdCell}>{getAgeCategoryName(row.age_category_id)}</Text>
                            <Text style={[styles.tdCellBold, styles.thFormat]}>
                              {getFormatName(row.format_id)}
                            </Text>
                            <Text style={styles.tdCell}>{row.matches || '-'}</Text>
                            <Text style={styles.tdCell}>{row.innings || '-'}</Text>
                            <Text style={styles.tdCell}>{row.not_out || '-'}</Text>
                            <Text style={styles.tdCellBold}>{row.runs || '-'}</Text>
                            <Text style={styles.tdCell}>{row.hs || '-'}</Text>
                            <Text style={styles.tdCell}>{row.average || '-'}</Text>
                            <Text style={styles.tdCell}>{row.sr || '-'}</Text>
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
                          <Text style={styles.thCell}>Cat</Text>
                          <Text style={[styles.thCell, styles.thFormat]}>Div</Text>
                          <Text style={styles.thCell}>Mat</Text>
                          <Text style={styles.thCell}>Inns</Text>
                          <Text style={styles.thCell}>Balls</Text>
                          <Text style={styles.thCell}>Runs</Text>
                          <Text style={styles.thCell}>Wkts</Text>
                          <Text style={styles.thCell}>BBI</Text>
                          <Text style={styles.thCell}>Ave</Text>
                          <Text style={styles.thCell}>Econ</Text>
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
                            <Text style={styles.tdCell}>{getAgeCategoryName(row.age_category_id)}</Text>
                            <Text style={[styles.tdCellBold, styles.thFormat]}>
                              {getFormatName(row.format_id)}
                            </Text>
                            <Text style={styles.tdCell}>{row.matches || '-'}</Text>
                            <Text style={styles.tdCell}>{row.innings || '-'}</Text>
                            <Text style={styles.tdCell}>{row.balls || '-'}</Text>
                            <Text style={styles.tdCell}>{row.runs || '-'}</Text>
                            <Text style={styles.tdCellBold}>{row.wickets || '-'}</Text>
                            <Text style={styles.tdCell}>{row.bbi || '-'}</Text>
                            <Text style={styles.tdCell}>{row.average || '-'}</Text>
                            <Text style={styles.tdCell}>{row.economy || '-'}</Text>
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

            {/* Card 3: Recent Matches — always the full (up to 10) list, no
                "View more" toggle to expand first. */}
            {hasRecentMatches && (
              <View style={[styles.card, shadows.sm]}>
                <Text style={styles.cardHeaderTitle}>Recent Matches of {shortName}</Text>

                <RecentMatchesTable matches={recentMatches} />
              </View>
            )}

            {/* Card 4: Debut/Last Matches */}
            {debutLastData.length > 0 && (
              <View style={[styles.card, shadows.sm]}>
                <Text style={styles.cardHeaderTitle}>Debut/Last Matches of {shortName}</Text>

                {debutLastData.map((item, idx) => (
                  <View key={idx} style={styles.debutBlock}>
                    <View style={styles.debutCategoryHeader}>
                      <Text style={styles.debutCategoryTitle}>{item.category}</Text>
                    </View>

                    {/* Debut Entry */}
                    <View style={styles.debutRow}>
                      <View style={styles.debutContent}>
                        <Text style={styles.fieldLabel}>DEBUT</Text>
                        <Text style={styles.debutMatchText}>{item.debut}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                    </View>

                    {/* Last Entry */}
                    <View style={[styles.debutRow, styles.borderTopDivider]}>
                      <View style={styles.debutContent}>
                        <Text style={styles.fieldLabel}>LAST</Text>
                        <Text style={styles.debutMatchText}>{item.last}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* Matches Tab Content */
          <>
            {/* Debut/Last Matches - Player */}
            {debutLastData.length > 0 && (
              <View style={[styles.card, shadows.sm]}>
                <Text style={styles.cardHeaderTitle}>Debut/Last Matches - Player</Text>

                {debutLastData.map((item, idx) => (
                  <View key={idx} style={styles.debutBlock}>
                    <View style={styles.debutCategoryHeader}>
                      <Text style={styles.debutCategoryTitle}>{item.category}</Text>
                    </View>

                    <View style={styles.debutRow}>
                      <View style={styles.debutContent}>
                        <Text style={styles.fieldLabel}>DEBUT</Text>
                        <Text style={styles.debutMatchText}>{item.debut}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                    </View>

                    <View style={[styles.debutRow, styles.borderTopDivider]}>
                      <View style={styles.debutContent}>
                        <Text style={styles.fieldLabel}>LAST</Text>
                        <Text style={styles.debutMatchText}>{item.last}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Matches - Player */}
            {hasRecentMatches && (
              <View style={[styles.card, shadows.sm]}>
                <Text style={styles.cardHeaderTitle}>Recent Matches - Player</Text>

                <RecentMatchesTable matches={recentMatches} />
              </View>
            )}

            {/* Footer Copyright notice matching Cricbuzz layout */}
            <View style={styles.footerBranding}>
              <Text style={styles.footerLegal}>Terms of Use | Privacy Policy | Feedback</Text>
              <Text style={styles.footerCopyright}>© 2026 AmaX Ltd. All rights reserved</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Full-screen view of whichever photo (cover or avatar) was tapped. */}
      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
    </View>
  );
}

/**
 * Every field entered on the Recent Matches form — Date, Match, Played XI,
 * Runs, Balls, 4s, 6s, Overs, Maidens, Wkts, Catches, Stumpings — not just a
 * Bat/Bowl summary, so nothing entered on the form goes missing in the
 * read-only view. Wide by design (12 columns), so it scrolls horizontally
 * like the Batting/Bowling tables above it.
 */
function RecentMatchesTable({ matches }: { matches: CricketProfileFormValues['recent_matches'] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.recentMatchesTable, styles.recentMatchesTableScrollable]}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thCell, styles.thDate]}>Date</Text>
          <Text style={[styles.thCell, styles.thMatchName]}>Match</Text>
          <Text style={styles.thCell}>XI</Text>
          <Text style={styles.thCell}>Runs</Text>
          <Text style={styles.thCell}>Balls</Text>
          <Text style={styles.thCell}>4s</Text>
          <Text style={styles.thCell}>6s</Text>
          <Text style={styles.thCell}>Overs</Text>
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
            <Text style={styles.tdCell}>{m.runs || '-'}</Text>
            <Text style={styles.tdCell}>{m.balls || '-'}</Text>
            <Text style={styles.tdCell}>{m.fours || '0'}</Text>
            <Text style={styles.tdCell}>{m.sixes || '0'}</Text>
            <Text style={styles.tdCell}>{m.overs || '-'}</Text>
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
    paddingBottom: 0,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
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
    marginBottom: spacing.lg,
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
    gap: 4,
    marginTop: 4,
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
  tabsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  tabButtonActive: {},
  tabText: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    fontSize: 15,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  activeTabLine: {
    position: 'absolute',
    bottom: 0,
    left: spacing.lg,
    right: spacing.lg,
    height: 3,
    backgroundColor: colors.energy,
    borderRadius: radius.full,
  },
  scrollContent: {
    padding: spacing.md,
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
  cardHeaderTitle: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.md,
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
  thFormat: {
    width: 75,
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
