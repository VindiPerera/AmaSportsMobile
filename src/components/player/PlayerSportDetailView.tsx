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
import { formatBornDate, formatDetailedAge } from '../../utils/date';

export interface DetailFieldItem {
  label: string;
  value?: string | null;
}

export interface StatTableColumn {
  key: string;
  label: string;
  width?: number;
}

/** One stats table (Career Stats, Bowling, Recent Matches, ...) — its own
 * card, shown only when it has rows. A sport can pass several `statCards`
 * (e.g. Batting + Bowling, like Cricket) and several `recentCards`. */
export interface StatCardConfig {
  header: string;
  columns: StatTableColumn[];
  rows: Record<string, unknown>[];
}

export interface PersonalBestItem {
  label: string;
  value: string;
}

const RECENT_DISPLAY_LIMIT = 5;

interface PlayerSportDetailViewProps {
  sportName: string;
  fullName: string;
  country: string;
  photoUrl?: string | null;
  coverUrl?: string | null;
  born?: string | null;
  age?: string | number | null;
  teams?: string[];
  fields?: DetailFieldItem[];
  /** Events & Personal Best card (Athletics/Swimming) — omitted for sports
   * without a personal-best concept. */
  personalBests?: PersonalBestItem[];
  /** Career-style stats tables — one card per entry, each shown only when
   * it has rows (mirrors Cricket's independent Batting/Bowling cards). */
  statCards?: StatCardConfig[];
  /** Recent Matches/Fights/Events tables — sliced to the last 5 with a
   * "View more" toggle, same as Cricket's Recent Matches card. */
  recentCards?: StatCardConfig[];
  onEditPress?: () => void;
  onBackPress?: () => void;
}

function DataTable({ card }: { card: StatCardConfig }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          {card.columns.map((col, idx) => (
            <Text
              key={idx}
              style={[styles.thCell, col.width ? { width: col.width } : { flex: 1 }, idx === 0 && { textAlign: 'left' }]}
            >
              {col.label}
            </Text>
          ))}
        </View>

        {card.rows.map((row, rIdx) => (
          <View key={rIdx} style={[styles.tableDataRow, rIdx % 2 === 1 && styles.tableRowAlt]}>
            {card.columns.map((col, cIdx) => {
              const raw = row[col.key];
              const val = raw === null || raw === undefined || raw === '' ? '-' : String(raw);
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
  );
}

export function PlayerSportDetailView({
  sportName,
  fullName,
  country,
  photoUrl,
  coverUrl,
  born,
  age,
  teams = [],
  fields = [],
  personalBests = [],
  statCards = [],
  recentCards = [],
  onEditPress,
  onBackPress,
}: PlayerSportDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'matches'>('overview');
  const [expandedRecent, setExpandedRecent] = useState<Record<number, boolean>>({});

  const displayName = fullName || 'Player Name';
  const nameParts = displayName.trim().split(' ');
  const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : displayName;

  const hasAnyRecent = recentCards.some((c) => c.rows.length > 0);

  const renderRecentCard = (card: StatCardConfig, idx: number, limit?: number) => {
    if (card.rows.length === 0) return null;
    const isExpanded = !!expandedRecent[idx];
    const rows = limit && !isExpanded ? card.rows.slice(0, limit) : card.rows;
    return (
      <View key={idx} style={[styles.card, shadows.sm]}>
        <Text style={styles.cardHeaderTitle}>{card.header}</Text>
        <DataTable card={{ ...card, rows }} />
        {limit && !isExpanded && card.rows.length > limit ? (
          <Pressable onPress={() => setExpandedRecent((prev) => ({ ...prev, [idx]: true }))} style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>View more</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dark Navy Header Banner */}
      <View style={styles.headerBanner}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <LinearGradient
          colors={coverUrl ? ['rgba(11, 25, 44, 0.72)', 'rgba(11, 25, 44, 0.92)'] : colors.gradientHero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
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

        {/* Player Identity Row */}
        <View style={styles.playerIdentityRow}>
          <View style={styles.playerInfoCol}>
            <Text style={styles.headerPlayerName} numberOfLines={2}>
              {shortName}
            </Text>
            <View style={styles.countryRow}>
              <Ionicons name="trophy-outline" size={14} color={colors.energy} />
              <Text style={styles.headerSportTag}>{sportName}</Text>
              {!!country && (
                <>
                  <Text style={styles.headerDot}>•</Text>
                  <Text style={styles.headerCountry}>{country}</Text>
                </>
              )}
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

        {/* Navigation Tabs — Matches tab only shown when player has match data */}
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

          {hasAnyRecent && (
            <Pressable
              style={[styles.tabButton, activeTab === 'matches' && styles.tabButtonActive]}
              onPress={() => setActiveTab('matches')}
            >
              <Text style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}>
                Matches
              </Text>
              {activeTab === 'matches' && <View style={styles.activeTabLine} />}
            </Pressable>
          )}
        </View>
      </View>

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

                {/* Teams — only shown when player has added at least one team */}
                {teams.length > 0 && (
                  <View style={styles.gridItemFull}>
                    <Text style={styles.fieldLabel}>TEAMS</Text>
                    <View style={styles.teamsChipList}>
                      {teams.map((t, idx) => (
                        <View key={idx} style={styles.teamBadge}>
                          <View style={styles.teamBadgeIcon}>
                            <Ionicons name="shield" size={14} color={colors.primary} />
                          </View>
                          <Text style={styles.teamBadgeText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Card: Events & Personal Best — Athletics/Swimming only */}
            {personalBests.length > 0 && (
              <View style={[styles.card, shadows.sm]}>
                <Text style={styles.cardHeaderTitle}>Events &amp; Personal Best</Text>
                {personalBests.map((pb, idx) => (
                  <View key={idx} style={[styles.personalBestRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={styles.tdCellBold}>{pb.label}</Text>
                    <Text style={styles.tdCell}>{pb.value || '-'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Stat Cards — one per section, each shown only when it has rows */}
            {statCards.map(
              (card, idx) =>
                card.rows.length > 0 && (
                  <View key={idx} style={[styles.card, shadows.sm]}>
                    <Text style={styles.cardHeaderTitle}>{shortName} {card.header}</Text>
                    <DataTable card={card} />
                  </View>
                )
            )}

            {/* Recent Cards — sliced to 5 with a "View more" toggle */}
            {recentCards.map((card, idx) => renderRecentCard(card, idx, RECENT_DISPLAY_LIMIT))}
          </>
        ) : (
          /* Matches Tab Content — full recent history, no slicing */
          <>{recentCards.map((card, idx) => renderRecentCard(card, idx))}</>
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
  personalBestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  viewMoreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
});
