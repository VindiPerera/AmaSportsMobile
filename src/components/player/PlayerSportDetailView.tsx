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
import { formatBornDate, formatDetailedAge, formatShortMatchDate } from '../../utils/date';

export interface DetailFieldItem {
  label: string;
  value?: string | null;
}

export interface StatTableColumn {
  key: string;
  label: string;
  width?: number;
}

export interface GenericMatchRow {
  match_date?: string | null;
  opponent?: string | null;
  scoreOrStat?: string | null;
  result?: string | null;
}

interface PlayerSportDetailViewProps {
  sportName: string;
  fullName: string;
  country: string;
  photoUrl?: string | null;
  born?: string | null;
  age?: string | number | null;
  teams?: string[];
  fields?: DetailFieldItem[];
  careerStatsHeader?: string;
  careerStatsColumns?: StatTableColumn[];
  careerStatsRows?: Record<string, unknown>[];
  recentMatches?: GenericMatchRow[];
  debutMatches?: { category: string; debut: string; last: string }[];
  onEditPress?: () => void;
  onBackPress?: () => void;
}

export function PlayerSportDetailView({
  sportName,
  fullName,
  country,
  photoUrl,
  born,
  age,
  teams = [],
  fields = [],
  careerStatsHeader = 'Career Stats',
  careerStatsColumns = [
    { key: 'format', label: 'Format', width: 90 },
    { key: 'matches', label: 'Mat', width: 45 },
    { key: 'goals', label: 'Goals', width: 50 },
    { key: 'assists', label: 'Assists', width: 55 },
    { key: 'rating', label: 'Rating', width: 55 },
  ],
  careerStatsRows = [],
  recentMatches = [],
  debutMatches = [],
  onEditPress,
  onBackPress,
}: PlayerSportDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches'>('overview');

  const displayName = fullName || 'Player Name';
  const nameParts = displayName.trim().split(' ');
  const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : displayName;

  // Fallback career stats if none provided
  const displayCareerRows = careerStatsRows.length > 0
    ? careerStatsRows
    : [
        { format: 'Senior League', matches: '14', goals: '8', assists: '5', rating: '7.8' },
        { format: 'National Cup', matches: '5', goals: '3', assists: '2', rating: '8.1' },
      ];

  // Fallback recent matches if none provided
  const displayRecentMatches = recentMatches.length > 0
    ? recentMatches
    : [
        { match_date: '2024-08-02', opponent: `${sportName} League Finals`, scoreOrStat: '2 Goals', result: 'W 3-1' },
        { match_date: '2024-07-25', opponent: 'Regional Qualifiers', scoreOrStat: '1 Goal, 1 Assist', result: 'W 2-0' },
        { match_date: '2024-06-18', opponent: 'National Invitational', scoreOrStat: '1 Assist', result: 'D 1-1' },
      ];

  // Fallback debut/last matches
  const displayDebutMatches = debutMatches.length > 0
    ? debutMatches
    : [
        {
          category: `${sportName.toUpperCase()} COMPETITIONS`,
          debut: `Debuted in Regional Championship - Jan 15, 2024`,
          last: `Last played vs National Selection - Aug 02, 2024`,
        },
      ];

  return (
    <View style={styles.container}>
      {/* Dark Navy Header Banner */}
      <LinearGradient
        colors={colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
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

        {/* Player Identity Row */}
        <View style={styles.playerIdentityRow}>
          <View style={styles.playerInfoCol}>
            <Text style={styles.headerPlayerName} numberOfLines={2}>
              {shortName}
            </Text>
            <View style={styles.countryRow}>
              <Ionicons name="trophy-outline" size={14} color={colors.energy} />
              <Text style={styles.headerSportTag}>{sportName}</Text>
              <Text style={styles.headerDot}>•</Text>
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

        {/* Navigation Tabs */}
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabButton, activeTab === 'overview' && styles.tabButtonActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
            {activeTab === 'overview' && <View style={styles.activeTabLine} />}
          </Pressable>

          <Pressable
            style={[styles.tabButton, activeTab === 'matches' && styles.tabButtonActive]}
            onPress={() => setActiveTab('matches')}
          >
            <Text style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}>
              Matches
            </Text>
            {activeTab === 'matches' && <View style={styles.activeTabLine} />}
          </Pressable>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'overview' ? (
          <>
            {/* Card 1: Personal Overview */}
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
                    <Text style={styles.fieldValueBold}>{formatBornDate(born)}</Text>
                  </View>
                  <View style={styles.gridItemHalf}>
                    <Text style={styles.fieldLabel}>AGE</Text>
                    <Text style={styles.fieldValueBold}>{formatDetailedAge(born, age)}</Text>
                  </View>
                </View>

                {/* Custom Fields */}
                {fields.map((f, idx) =>
                  f.value ? (
                    <View key={idx} style={styles.gridItemFull}>
                      <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
                      <Text style={styles.fieldValueBold}>{f.value}</Text>
                    </View>
                  ) : null
                )}

                {/* Teams */}
                <View style={styles.gridItemFull}>
                  <Text style={styles.fieldLabel}>TEAMS</Text>
                  <View style={styles.teamsChipList}>
                    {teams.length > 0 ? (
                      teams.map((t, idx) => (
                        <View key={idx} style={styles.teamBadge}>
                          <View style={styles.teamBadgeIcon}>
                            <Ionicons name="shield" size={14} color={colors.primary} />
                          </View>
                          <Text style={styles.teamBadgeText}>{t}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.teamBadge}>
                        <View style={styles.teamBadgeIcon}>
                          <Ionicons name="shield" size={14} color={colors.primary} />
                        </View>
                        <Text style={styles.teamBadgeText}>{sportName} Team / Club</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Career Stats */}
            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>{shortName} {careerStatsHeader}</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tableContainer}>
                  {/* Header Row */}
                  <View style={styles.tableHeaderRow}>
                    {careerStatsColumns.map((col, idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.thCell,
                          col.width ? { width: col.width } : { flex: 1 },
                          idx === 0 && { textAlign: 'left' },
                        ]}
                      >
                        {col.label}
                      </Text>
                    ))}
                  </View>

                  {/* Data Rows */}
                  {displayCareerRows.map((row, rIdx) => (
                    <View
                      key={rIdx}
                      style={[styles.tableDataRow, rIdx % 2 === 1 && styles.tableRowAlt]}
                    >
                      {careerStatsColumns.map((col, cIdx) => {
                        const val = String(row[col.key] ?? '-');
                        return (
                          <Text
                            key={cIdx}
                            style={[
                              cIdx === 0 ? styles.tdCellBold : styles.tdCell,
                              col.width ? { width: col.width } : { flex: 1 },
                              cIdx === 0 && { textAlign: 'left' },
                            ]}
                          >
                            {val}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Card 3: Recent Matches */}
            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>Recent Matches of {shortName}</Text>

              <View style={styles.recentMatchesTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, styles.thMatchName]}>Match</Text>
                  <Text style={styles.thCellStat}>Perf</Text>
                  <Text style={styles.thCellResult}>Result</Text>
                  <Text style={[styles.thCell, styles.thDate]}>Date</Text>
                </View>

                {displayRecentMatches.map((m, idx) => (
                  <View
                    key={idx}
                    style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.tdCellBold, styles.thMatchName]} numberOfLines={1}>
                      {m.opponent || 'Match'}
                    </Text>
                    <Text style={styles.tdCellStat}>{m.scoreOrStat || '--'}</Text>
                    <Text style={styles.tdCellResult}>{m.result || '--'}</Text>
                    <Text style={[styles.tdCellFaint, styles.thDate]}>
                      {formatShortMatchDate(m.match_date)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Card 4: Debut/Last Matches */}
            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>Debut/Last Matches of {shortName}</Text>

              {displayDebutMatches.map((item, idx) => (
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
          </>
        ) : (
          /* Matches Tab Content */
          <>
            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>Debut/Last Matches - Player</Text>

              {displayDebutMatches.map((item, idx) => (
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

            <View style={[styles.card, shadows.sm]}>
              <Text style={styles.cardHeaderTitle}>Recent Matches - Player</Text>

              <View style={styles.recentMatchesTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thCell, styles.thMatchName]}>Match</Text>
                  <Text style={styles.thCellStat}>Perf</Text>
                  <Text style={styles.thCellResult}>Result</Text>
                  <Text style={[styles.thCell, styles.thDate]}>Date</Text>
                </View>

                {displayRecentMatches.map((m, idx) => (
                  <View
                    key={idx}
                    style={[styles.tableDataRow, idx % 2 === 1 && styles.tableRowAlt]}
                  >
                    <Text style={[styles.tdCellBold, styles.thMatchName]} numberOfLines={1}>
                      {m.opponent || 'Match'}
                    </Text>
                    <Text style={styles.tdCellStat}>{m.scoreOrStat || '--'}</Text>
                    <Text style={styles.tdCellResult}>{m.result || '--'}</Text>
                    <Text style={[styles.tdCellFaint, styles.thDate]}>
                      {formatShortMatchDate(m.match_date)}
                    </Text>
                  </View>
                ))}
              </View>
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
  headerSportTag: {
    ...typography.caption,
    color: colors.energy,
    fontWeight: '700',
    fontSize: 12,
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
  tableContainer: {
    minWidth: 400,
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
    textAlign: 'center',
  },
  thMatchName: {
    flex: 1,
    textAlign: 'left',
  },
  thCellStat: {
    width: 80,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 11,
  },
  thCellResult: {
    width: 60,
    textAlign: 'center',
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 11,
  },
  thDate: {
    width: 85,
    textAlign: 'right',
  },
  tdCell: {
    ...typography.body,
    color: colors.text,
    fontSize: 13,
    textAlign: 'center',
  },
  tdCellBold: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  tdCellStat: {
    width: 80,
    textAlign: 'center',
    ...typography.body,
    color: colors.text,
    fontSize: 13,
  },
  tdCellResult: {
    width: 60,
    textAlign: 'center',
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
    fontSize: 13,
  },
  tdCellFaint: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  recentMatchesTable: {
    marginTop: spacing.xs,
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
});
