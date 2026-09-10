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
import { formatBornDate, formatDetailedAge } from '../../utils/date';
import { abbreviateStatLabel } from '../../utils/statLabels';
import { ImageLightbox } from '../ui/ImageLightbox';

export interface DetailFieldItem {
  label: string;
  value?: string | null;
}

export interface StatTableColumn {
  key: string;
  label: string;
  width?: number;
  /** Shortens long Format/Category names (e.g. "Academy" -> "Aca") for this
   * column's cells — display-only, set on the read-only career-stat column
   * configs, never on the edit form's own field definitions. */
  abbreviate?: boolean;
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

const TAB_ITEMS: {
  key: 'overview' | 'stats' | 'matches' | 'achievements';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'overview', label: 'Overview', icon: 'person-outline' },
  { key: 'stats', label: 'Stats', icon: 'stats-chart-outline' },
  { key: 'matches', label: 'Matches', icon: 'calendar-outline' },
  { key: 'achievements', label: 'Achievements', icon: 'trophy-outline' },
];

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
  collegeLogoUrl?: string | null;
  teamLogos?: Record<string, string | null>;
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
  /** True when embedded inline in another screen that already provides its
   * own header/photo/edit affordance (see the Player Profile tab) — skips
   * this component's own cover-photo/nav-bar/identity header and dark tab
   * styling, and renders as a plain block instead of a self-contained
   * full-screen view (no `flex:1` + internal ScrollView, which don't nest
   * inside another scrolling screen). `onBackPress`/coverUrl/photoUrl are
   * unused in this mode. */
  embedded?: boolean;
}

/** Rough glyph width for the table's ~13px cell text — used only to widen a
 * column past its author-chosen default when actual data (a long career
 * total, or a derived Ave/SR blown up by a lopsided ratio) needs more room
 * than a typical 1-3 digit stat does. */
const CELL_CHAR_WIDTH = 7.4;
const CELL_PADDING = 14;

function cellText(row: Record<string, unknown>, col: StatTableColumn): string {
  const raw = row[col.key];
  const text = raw === null || raw === undefined || raw === '' ? '-' : String(raw);
  return col.abbreviate ? abbreviateStatLabel(text) : text;
}

/** A column's declared `width` is sized for the sport's typical values —
 * fine for "Mat"/"Win"/"Ct" but too narrow for the rare oversized entry
 * (see cricket's Runs/Ave/SR fix), which used to wrap onto a second line or
 * get clipped. Grows the column to fit whatever's actually in it instead of
 * needing every sport's column config hand-tuned. */
function getColumnWidth(col: StatTableColumn, rows: Record<string, unknown>[]): number | undefined {
  if (!col.width) return undefined;
  const longest = rows.reduce((max, row) => Math.max(max, cellText(row, col).length), col.label.length);
  return Math.max(col.width, Math.ceil(longest * CELL_CHAR_WIDTH) + CELL_PADDING);
}

function DataTable({ card }: { card: StatCardConfig }) {
  const columnWidths = card.columns.map((col) => getColumnWidth(col, card.rows));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeaderRow}>
          {card.columns.map((col, idx) => (
            <Text
              key={idx}
              numberOfLines={1}
              style={[styles.thCell, columnWidths[idx] ? { width: columnWidths[idx] } : { flex: 1 }, idx === 0 && { textAlign: 'left' }]}
            >
              {col.label}
            </Text>
          ))}
        </View>

        {card.rows.map((row, rIdx) => (
          <View key={rIdx} style={[styles.tableDataRow, rIdx % 2 === 1 && styles.tableRowAlt]}>
            {card.columns.map((col, cIdx) => (
              <Text
                key={cIdx}
                numberOfLines={1}
                style={[
                  cIdx === 0 ? styles.tdCellBold : styles.tdCell,
                  columnWidths[cIdx] ? { width: columnWidths[cIdx] } : { flex: 1 },
                  cIdx === 0 && { textAlign: 'left' },
                ]}
              >
                {cellText(row, col)}
              </Text>
            ))}
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
  collegeLogoUrl,
  teamLogos,
  personalBests = [],
  statCards = [],
  recentCards = [],
  onEditPress,
  onBackPress,
  embedded = false,
}: PlayerSportDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'matches' | 'achievements'>('overview');
  const [expandedRecent, setExpandedRecent] = useState<Record<number, boolean>>({});
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const sportTheme = getSportTheme(sportName);

  const displayName = fullName || 'Player Name';
  const nameParts = displayName.trim().split(' ');
  const shortName = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}` : displayName;

  const hasAnyRecent = recentCards.some((c) => c.rows.length > 0);
  const hasAnyStats = statCards.some((c) => c.rows.length > 0);

  const renderRecentCard = (card: StatCardConfig, idx: number, limit?: number) => {
    if (card.rows.length === 0) return null;
    const isExpanded = !!expandedRecent[idx];
    const rows = limit && !isExpanded ? card.rows.slice(0, limit) : card.rows;
    return (
      <View key={idx} style={[styles.card, shadows.sm]}>
        <View style={styles.cardHeaderRow}>
          <Ionicons name="calendar-outline" size={18} color={sportTheme.primary} />
          <Text style={styles.cardHeaderTitle}>{card.header} - {shortName}</Text>
        </View>
        <DataTable card={{ ...card, rows }} />
        {limit && !isExpanded && card.rows.length > limit ? (
          <Pressable onPress={() => setExpandedRecent((prev) => ({ ...prev, [idx]: true }))} style={styles.viewMoreButton}>
            <Text style={[styles.viewMoreText, { color: sportTheme.primary }]}>View more</Text>
            <Ionicons name="chevron-down" size={14} color={sportTheme.primary} />
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View style={embedded ? styles.embeddedContainer : styles.container}>
      {/* Sport Themed Header Banner — skipped when embedded */}
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

        {/* Player Identity Row */}
        <View style={styles.playerIdentityRow}>
          <View style={styles.playerInfoCol}>
            <Text style={styles.headerPlayerName} numberOfLines={2}>
              {shortName}
            </Text>
            <View style={styles.countryRow}>
              <Ionicons name={sportTheme.icon} size={14} color={sportTheme.accent} />
              <Text style={[styles.headerSportTag, { color: sportTheme.accent }]}>{sportName.toUpperCase()}</Text>
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
            {TAB_ITEMS.map((tab) => {
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
            {TAB_ITEMS.map((tab) => {
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

      {/* Main Content */}
      <ScrollView
        scrollEnabled={!embedded}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'overview' ? (
          <>
            {/* Card 1: Personal Overview */}
            <View style={[styles.card, shadows.sm]}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="information-circle-outline" size={18} color={sportTheme.primary} />
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
                    <Text style={styles.fieldValueBold}>{formatBornDate(born)}</Text>
                  </View>
                  <View style={styles.gridItemHalf}>
                    <Text style={styles.fieldLabel}>AGE</Text>
                    <Text style={styles.fieldValueBold}>{formatDetailedAge(born, age)}</Text>
                  </View>
                </View>

                {/* Custom Fields */}
                {fields.map((f, idx) => {
                  if (!f.value) return null;
                  const isEducation = f.label.toLowerCase().includes('education');
                  return (
                    <View key={idx} style={styles.gridItemFull}>
                      <Text style={styles.fieldLabel}>{f.label.toUpperCase()}</Text>
                      {isEducation && collegeLogoUrl ? (
                        <View style={styles.educationRow}>
                          <Image source={{ uri: collegeLogoUrl }} style={styles.educationLogo} />
                          <Text style={styles.fieldValueBold}>{f.value}</Text>
                        </View>
                      ) : (
                        <Text style={styles.fieldValueBold}>{f.value}</Text>
                      )}
                    </View>
                  );
                })}

                {/* Teams */}
                {teams.length > 0 && (
                  <View style={styles.gridItemFull}>
                    <Text style={styles.fieldLabel}>TEAMS</Text>
                    <View style={styles.teamsChipList}>
                      {teams.map((t, idx) => (
                        <View key={idx} style={styles.teamBadge}>
                          <View style={styles.teamBadgeIcon}>
                            {teamLogos?.[t] ? (
                              <Image source={{ uri: teamLogos[t]! }} style={styles.teamBadgeLogo} />
                            ) : (
                              <Ionicons name="shield" size={14} color={colors.primary} />
                            )}
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
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
                  <Text style={styles.cardHeaderTitle}>Events &amp; Personal Best</Text>
                </View>
                {personalBests.map((pb, idx) => (
                  <View key={idx} style={[styles.personalBestRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={styles.tdCellBold}>{pb.label}</Text>
                    <Text style={styles.tdCell}>{pb.value || '-'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Stat Cards Preview — one per section, each shown only when it has rows */}
            {statCards.map(
              (card, idx) =>
                card.rows.length > 0 && (
                  <View key={idx} style={[styles.card, shadows.sm]}>
                    <View style={styles.cardHeaderRow}>
                      <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
                      <Text style={styles.cardHeaderTitle}>{shortName} {card.header}</Text>
                    </View>
                    <DataTable card={card} />
                  </View>
                )
            )}

            {/* Recent Cards Preview — sliced to 5 with a "View more" toggle */}
            {recentCards.map((card, idx) => renderRecentCard(card, idx, RECENT_DISPLAY_LIMIT))}
          </>
        ) : activeTab === 'stats' ? (
          /* Stats Tab Content — full career stats tables */
          <>
            {personalBests.length > 0 && (
              <View style={[styles.card, shadows.sm]}>
                <View style={styles.cardHeaderRow}>
                  <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
                  <Text style={styles.cardHeaderTitle}>Events &amp; Personal Best</Text>
                </View>
                {personalBests.map((pb, idx) => (
                  <View key={idx} style={[styles.personalBestRow, idx % 2 === 1 && styles.tableRowAlt]}>
                    <Text style={styles.tdCellBold}>{pb.label}</Text>
                    <Text style={styles.tdCell}>{pb.value || '-'}</Text>
                  </View>
                ))}
              </View>
            )}

            {hasAnyStats ? (
              statCards.map(
                (card, idx) =>
                  card.rows.length > 0 && (
                    <View key={idx} style={[styles.card, shadows.sm]}>
                      <View style={styles.cardHeaderRow}>
                        <Ionicons name="stats-chart-outline" size={18} color={sportTheme.primary} />
                        <Text style={styles.cardHeaderTitle}>{shortName} {card.header}</Text>
                      </View>
                      <DataTable card={card} />
                    </View>
                  )
              )
            ) : (
              personalBests.length === 0 && (
                <View style={[styles.card, styles.emptyStatsCard]}>
                  <Ionicons name="stats-chart-outline" size={32} color={sportTheme.primary} />
                  <Text style={styles.emptyStatsText}>No career stats recorded yet.</Text>
                </View>
              )
            )}
          </>
        ) : activeTab === 'matches' ? (
          /* Matches Tab Content — full recent history, no slicing */
          <>
            {hasAnyRecent ? (
              recentCards.map((card, idx) => renderRecentCard(card, idx))
            ) : (
              <View style={[styles.card, styles.emptyStatsCard]}>
                <Ionicons name="calendar-outline" size={32} color={sportTheme.primary} />
                <Text style={styles.emptyStatsText}>No recent matches recorded yet.</Text>
              </View>
            )}
          </>
        ) : (
          /* Achievements Tab Content */
          <View style={[styles.card, styles.emptyStatsCard]}>
            <Ionicons name="trophy-outline" size={32} color={sportTheme.accent} />
            <Text style={[styles.fieldValueBold, { textAlign: 'center', marginTop: 4 }]}>
              {sportName} Achievements
            </Text>
            <Text style={[styles.emptyStatsText, { textAlign: 'center', paddingHorizontal: 16 }]}>
              Official badges and milestone awards for {sportName} will be awarded as matches are verified.
            </Text>
          </View>
        )}
      </ScrollView>
      {/* Lightbox for full-screen photo viewing */}
      <ImageLightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
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
  educationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  educationLogo: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    resizeMode: 'contain',
  },
  teamBadgeLogo: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
});

