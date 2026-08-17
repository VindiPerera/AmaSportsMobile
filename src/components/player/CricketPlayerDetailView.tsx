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
import { formatBornDate, formatDetailedAge, formatShortMatchDate } from '../../utils/date';

interface CricketPlayerDetailViewProps {
  fullName: string;
  country: string;
  photoUrl?: string | null;
  coverUrl?: string | null;
  values: CricketProfileFormValues;
  lookups: Lookups;
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
  onEditPress,
  onBackPress,
}: CricketPlayerDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches'>('overview');
  const [showAllRecent, setShowAllRecent] = useState(false);

  // Name helpers
  const nameParts = fullName.trim().split(' ');
  const displayName = fullName || 'Player Name';
  const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : displayName;

  // Format lookup helper
  const getFormatName = (formatId: string): string => {
    const found = lookups.formats.find((f) => String(f.id) === String(formatId));
    if (found) return found.name;
    if (!formatId) return 'List A';
    return formatId;
  };

  // Process Batting Rows (or supply clean defaults if empty)
  const hasBattingStats = values.batting && values.batting.length > 0;
  const battingRows = hasBattingStats
    ? values.batting
    : [
        {
          format_id: '1',
          matches: '3',
          innings: '1',
          not_out: '1',
          runs: '12',
          hs: '12*',
          average: '--',
          sr: '100.0',
          hundreds: '0',
          fifties: '0',
          fours: '1',
          sixes: '0',
          catches: '1',
          stumpings: '0',
        },
        {
          format_id: '2',
          matches: '2',
          innings: '0',
          not_out: '0',
          runs: '0',
          hs: '-',
          average: '--',
          sr: '0.0',
          hundreds: '0',
          fifties: '0',
          fours: '0',
          sixes: '0',
          catches: '0',
          stumpings: '0',
        },
      ];

  // Process Bowling Rows
  const hasBowlingStats = values.bowling && values.bowling.length > 0;
  const bowlingRows = hasBowlingStats
    ? values.bowling
    : [
        {
          format_id: '1',
          matches: '3',
          innings: '0',
          balls: '0',
          runs: '0',
          wickets: '0',
          bbi: '-',
          bbm: '-',
          average: '--',
          economy: '0.0',
          sr: '0.0',
          four_w: '0',
          five_w: '0',
        },
        {
          format_id: '2',
          matches: '2',
          innings: '1',
          balls: '18',
          runs: '17',
          wickets: '0',
          bbi: '0/17',
          bbm: '0/17',
          average: '--',
          economy: '5.66',
          sr: '0.0',
          four_w: '0',
          five_w: '0',
        },
      ];

  // Process Recent Matches
  const hasRecentMatches = values.recent_matches && values.recent_matches.length > 0;
  const recentMatches = hasRecentMatches
    ? values.recent_matches
    : [
        {
          match_date: '2024-08-05',
          opponent: 'Chilaw MCC vs Panadura',
          runs: '--',
          wickets: '--',
          overs: '--',
        },
        {
          match_date: '2024-07-30',
          opponent: 'Chilaw MCC vs Bloomfield',
          runs: '12*',
          wickets: '--',
          overs: '--',
        },
        {
          match_date: '2024-05-15',
          opponent: 'Chilaw MCC vs Moors',
          runs: '--',
          wickets: '0',
          overs: '3.0',
        },
        {
          match_date: '2024-05-13',
          opponent: 'Chilaw MCC vs Burgher',
          runs: '--',
          wickets: '--',
          overs: '--',
        },
        {
          match_date: '2024-01-10',
          opponent: 'Chilaw MCC vs Badureliya',
          runs: '--',
          wickets: '--',
          overs: '--',
        },
      ];

  const displayedRecentMatches = showAllRecent ? recentMatches : recentMatches.slice(0, 5);

  // Debut & Last Matches
  const debutLastData = [
    {
      category: 'LIST A MATCHES',
      debut: 'Badureliya vs Chilaw MCC at Maggona - January 10, 2024',
      last: 'Chilaw MCC vs Panadura at Galle - August 05, 2024',
    },
    {
      category: 'T20 MATCHES',
      debut: 'Burgher vs Chilaw MCC at Panagoda - May 13, 2024',
      last: 'Chilaw MCC vs Moors at Colombo (SSC) - May 15, 2024',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Dark Navy Header Banner */}
      <View style={styles.headerBanner}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : null}
        <LinearGradient
          colors={coverUrl ? ['rgba(11, 25, 44, 0.72)', 'rgba(11, 25, 44, 0.92)'] : colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
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
              <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
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
                      {values.batting_style || 'Right hand Bat'}
                    </Text>
                  </View>
                  <View style={styles.gridItemHalf}>
                    <Text style={styles.fieldLabel}>BOWLING STYLE</Text>
                    <Text style={styles.fieldValueBold}>
                      {values.bowling_style || 'Right arm Offbreak'}
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
                    <Text style={styles.fieldValueBold}>{values.college_university}</Text>
                  </View>
                ) : null}

                {/* Teams */}
                <View style={styles.gridItemFull}>
                  <Text style={styles.fieldLabel}>TEAMS</Text>
                  <View style={styles.teamsChipList}>
                    {values.teams && values.teams.length > 0 ? (
                      values.teams.map((team, idx) => (
                        <View key={idx} style={styles.teamBadge}>
                          <View style={styles.teamBadgeIcon}>
                            <Ionicons name="shield" size={14} color={colors.primary} />
                          </View>
                          <Text style={styles.teamBadgeText}>{team}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.teamBadge}>
                        <View style={styles.teamBadgeIcon}>
                          <Ionicons name="shield" size={14} color={colors.primary} />
                        </View>
                        <Text style={styles.teamBadgeText}>Chilaw Marians Cricket Club</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Career Stats */}
            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>{shortName} Career Stats</Text>

              {/* Batting & Fielding */}
              <View style={styles.statSubSection}>
                <Text style={styles.subSectionHeader}>BATTING & FIELDING</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thCell, styles.thFormat]}>Format</Text>
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

              {/* Bowling */}
              <View style={styles.statSubSection}>
                <Text style={styles.subSectionHeader}>BOWLING</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.thCell, styles.thFormat]}>Format</Text>
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
            </View>

            {/* Card 3: Recent Matches */}
            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>Recent Matches of {shortName}</Text>

              <View style={styles.recentMatchesTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, styles.thMatchName]}>Match</Text>
                  <Text style={styles.thCell}>Bat</Text>
                  <Text style={styles.thCell}>Bowl</Text>
                  <Text style={[styles.thCell, styles.thDate]}>Date</Text>
                </View>

                {displayedRecentMatches.map((m, idx) => {
                  const bowlStat =
                    m.wickets && m.wickets !== '--'
                      ? `${m.wickets}/${m.runs || '0'}`
                      : '--';
                  return (
                    <View
                      key={idx}
                      style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                    >
                      <Text
                        style={[styles.tdCellBold, styles.thMatchName]}
                        numberOfLines={1}
                      >
                        {m.opponent}
                      </Text>
                      <Text style={styles.tdCell}>{m.runs || '--'}</Text>
                      <Text style={styles.tdCell}>{bowlStat}</Text>
                      <Text style={[styles.tdCellFaint, styles.thDate]}>
                        {formatShortMatchDate(m.match_date)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {!showAllRecent && recentMatches.length > 3 && (
                <Pressable
                  style={styles.viewMoreButton}
                  onPress={() => setShowAllRecent(true)}
                >
                  <Text style={styles.viewMoreText}>View more</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.primary} />
                </Pressable>
              )}
            </View>

            {/* Card 4: Debut/Last Matches */}
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
          </>
        ) : (
          /* Matches Tab Content */
          <>
            {/* Debut/Last Matches - Player */}
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

            {/* Recent Matches - Player */}
            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>Recent Matches - Player</Text>

              <View style={styles.recentMatchesTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, styles.thMatchName]}>Match</Text>
                  <Text style={styles.thCell}>Bat</Text>
                  <Text style={styles.thCell}>Bowl</Text>
                  <Text style={[styles.thCell, styles.thDate]}>Date</Text>
                </View>

                {recentMatches.map((m, idx) => {
                  const bowlStat =
                    m.wickets && m.wickets !== '--'
                      ? `${m.wickets}/${m.runs || '0'}`
                      : '--';
                  return (
                    <View
                      key={idx}
                      style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                    >
                      <Text
                        style={[styles.tdCellBold, styles.thMatchName]}
                        numberOfLines={1}
                      >
                        {m.opponent}
                      </Text>
                      <Text style={styles.tdCell}>{m.runs || '--'}</Text>
                      <Text style={styles.tdCell}>{bowlStat}</Text>
                      <Text style={[styles.tdCellFaint, styles.thDate]}>
                        {formatShortMatchDate(m.match_date)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Footer Copyright notice matching Cricbuzz layout */}
            <View style={styles.footerBranding}>
              <Text style={styles.footerLegal}>Terms of Use | Privacy Policy | Feedback</Text>
              <Text style={styles.footerCopyright}>© 2026 AmaX Ltd. All rights reserved</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
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
    flex: 1,
    textAlign: 'left',
  },
  thDate: {
    width: 85,
    textAlign: 'right',
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
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  viewMoreText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
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
