import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../src/components/ui/ScreenContainer';
import { Button } from '../../../src/components/ui/Button';
import { ErrorBanner } from '../../../src/components/ui/ErrorBanner';
import { BottomNavigation } from '../../../src/components/ui/BottomNavigation';
import { colors, radius, spacing, typography } from '../../../src/theme';
import { matchService } from '../../../src/services/matchService';
import {
  subscribeToLiveScore,
  MultiSportLiveScore,
  seedInitialLiveScores,
  CricketTeamInnings,
} from '../../../src/services/firebaseService';
import { MatchSummary } from '../../../src/types';

/** Maps a ball event code ('0'..'6', 'W', 'NB', 'X') to its dot color, mirroring the admin scorer's color coding. */
function overDotStyle(code: string) {
  if (code === '4') return styles.overDot4;
  if (code === '6') return styles.overDot6;
  if (code === 'W' || code === 'X') return styles.overDotOut;
  if (code === 'NB') return styles.overDotExtra;
  return styles.overDotDefault;
}

/** Full batting scorecard + bowling figures for one innings — mirrors the admin scorer's tables. */
function CricketInningsStats({ label, battingTeam, bowlingTeam }: {
  label: string;
  battingTeam: CricketTeamInnings;
  bowlingTeam?: CricketTeamInnings;
}) {
  return (
    <View style={styles.statsInningsBlock}>
      <Text style={styles.statsInningsLabel}>{label} — {battingTeam.name}</Text>

      <Text style={styles.statsTableTitle}>Batting</Text>
      <View style={styles.statsTableCard}>
        <CricketBattingTable team={battingTeam} />
      </View>

      <Text style={styles.statsTableTitle}>Bowling{bowlingTeam ? ` — ${bowlingTeam.name}` : ''}</Text>
      <View style={styles.statsTableCard}>
        {bowlingTeam ? <CricketBowlingTable team={bowlingTeam} /> : (
          <Text style={styles.emptyStatsText}>No bowling data yet.</Text>
        )}
      </View>
    </View>
  );
}

function CricketBattingTable({ team }: { team: CricketTeamInnings }) {
  const sorted = [...(team.batters || [])].sort((a, b) => a.order - b.order);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.statsHeaderRow}>
          <Text style={[styles.statsHeaderCell, styles.statsNameCell]}>Batter</Text>
          <Text style={styles.statsHeaderCell}>R</Text>
          <Text style={styles.statsHeaderCell}>B</Text>
          <Text style={styles.statsHeaderCell}>4s</Text>
          <Text style={styles.statsHeaderCell}>6s</Text>
          <Text style={styles.statsHeaderCell}>SR</Text>
          <Text style={[styles.statsHeaderCell, styles.statsStatusCell]}>Status</Text>
        </View>
        {sorted.map((p) => {
          const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : '—';
          let status = 'Yet to bat';
          if (p.id === team.strikerId) status = 'Striker';
          else if (p.id === team.nonStrikerId) status = 'Non-striker';
          else if (p.status === 'out') status = 'Out';

          return (
            <View key={p.id} style={[styles.statsRow, p.id === team.strikerId && styles.statsRowActive]}>
              <Text style={[styles.statsCell, styles.statsNameCell, styles.statsNameText]} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.statsCell}>{p.runs}</Text>
              <Text style={styles.statsCell}>{p.balls}</Text>
              <Text style={styles.statsCell}>{p.fours}</Text>
              <Text style={styles.statsCell}>{p.sixes}</Text>
              <Text style={styles.statsCell}>{sr}</Text>
              <Text style={[styles.statsCell, styles.statsStatusCell, styles.statsStatusText]}>{status}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function CricketBowlingTable({ team }: { team: CricketTeamInnings }) {
  const bowlers = (team.bowlers || []).filter((b) => b.balls > 0 || b.overs > 0);

  if (bowlers.length === 0) {
    return <Text style={styles.emptyStatsText}>No overs bowled yet.</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.statsHeaderRow}>
          <Text style={[styles.statsHeaderCell, styles.statsNameCell]}>Bowler</Text>
          <Text style={styles.statsHeaderCell}>O</Text>
          <Text style={styles.statsHeaderCell}>R</Text>
          <Text style={styles.statsHeaderCell}>W</Text>
          <Text style={styles.statsHeaderCell}>M</Text>
          <Text style={styles.statsHeaderCell}>Econ</Text>
        </View>
        {bowlers.map((b) => {
          const totalOvers = b.overs + b.balls / 6;
          const econ = totalOvers > 0 ? (b.runs / totalOvers).toFixed(2) : '—';

          return (
            <View key={b.id} style={styles.statsRow}>
              <Text style={[styles.statsCell, styles.statsNameCell, styles.statsNameText]} numberOfLines={1}>{b.name}</Text>
              <Text style={styles.statsCell}>{b.overs}.{b.balls}</Text>
              <Text style={styles.statsCell}>{b.runs}</Text>
              <Text style={[styles.statsCell, styles.statsWicketsCell]}>{b.wickets}</Text>
              <Text style={styles.statsCell}>{b.maidens}</Text>
              <Text style={styles.statsCell}>{econ}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const [liveData, setLiveData] = useState<MultiSportLiveScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    matchService
      .fetchOne(Number(id))
      .then((m) => {
        setMatch(m);
        seedInitialLiveScores([m]);
      })
      .catch(() => setError('Could not load match details.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Subscribe to Firebase real-time updates for this match
  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToLiveScore(Number(id), (data) => {
      if (data) setLiveData(data);
    });
    return () => unsub();
  }, [id]);

  if (isLoading) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loadingIndicator} />
      </ScreenContainer>
    );
  }

  if (!match) {
    return (
      <ScreenContainer edges={['bottom']}>
        <ErrorBanner message={error ?? 'Match not found.'} />
      </ScreenContainer>
    );
  }

  const sportSlug = match.sport.slug.toLowerCase();
  // Backend (the admin panel's MySQL record) is the source of truth for
  // this metadata; liveData (Firestore/mock) only fills in when the backend
  // hasn't been given a value yet or Firebase is running its local demo
  // simulation.
  const formatText = match.format || liveData?.format || 'Single';
  const ageText = match.age_group || liveData?.age_group || 'Under 17';
  const categoryText = match.category || liveData?.category || 'District';
  const venueText = match.venue || liveData?.venue || 'Royal College Ground - Colombo';
  const countryText = match.country || liveData?.country || 'Sri Lanka';

  const homeTeam = {
    name: match.home_team.name,
    school_academy: match.home_team.school_academy || liveData?.home_team?.school_academy || 'Maristella College',
    club: match.home_team.club || liveData?.home_team?.club || 'Negombo Sports Club',
    photo_url: match.home_team.photo_url || match.home_team.logo_url || liveData?.home_team?.photo_url
      || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    players: match.home_team.players ?? [],
  };
  const awayTeam = {
    name: match.away_team.name,
    school_academy: match.away_team.school_academy || liveData?.away_team?.school_academy || 'Ananda College',
    club: match.away_team.club || liveData?.away_team?.club || 'Colombo Sports Club',
    photo_url: match.away_team.photo_url || match.away_team.logo_url || liveData?.away_team?.photo_url
      || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    players: match.away_team.players ?? [],
  };

  // Ticking score numbers: Firestore (liveData) is the real-time channel
  // while a match is live. Once finished (or before Firebase is
  // configured), fall back to the final snapshot the admin panel wrote to
  // MySQL (`live_score`, shaped identically per sport key).
  const backendScore = (match.live_score ?? null) as Record<string, any> | null;
  const cricketScore = liveData?.cricket_score ?? backendScore?.cricket_score;
  const racketScores = liveData?.racket_scores ?? backendScore?.racket_scores;
  const teamScore = liveData?.team_score ?? backendScore?.team_score;

  // Cricket's team_a/team_b are fixed slots ("bats in innings 1"/"innings
  // 2"), not literal home/away — derive whichever is currently (or
  // finally) batting/bowling. Falls back to the old flat shape
  // (batting_team/runs/wickets/overs) for matches scored before the full
  // two-innings scorer shipped.
  const cricketBattingTeam = cricketScore?.team_a && cricketScore?.team_b
    ? (cricketScore.innings === 2 ? cricketScore.team_b : cricketScore.team_a)
    : null;
  const cricketBowlingTeam = cricketScore?.team_a && cricketScore?.team_b
    ? (cricketScore.innings === 2 ? cricketScore.team_a : cricketScore.team_b)
    : null;
  const cricketStriker = cricketBattingTeam?.batters?.find((b: any) => b.id === cricketBattingTeam.strikerId);
  const cricketNonStriker = cricketBattingTeam?.batters?.find((b: any) => b.id === cricketBattingTeam.nonStrikerId);
  const cricketRuns = cricketBattingTeam?.runs ?? cricketScore?.runs ?? 0;
  const cricketWickets = cricketBattingTeam?.wickets ?? cricketScore?.wickets ?? 0;
  const cricketOversText = cricketBattingTeam ? `${cricketBattingTeam.overs}.${cricketBattingTeam.balls}` : String(cricketScore?.overs ?? 0);
  const cricketBattingTeamName = cricketBattingTeam?.name ?? cricketScore?.batting_team;
  const cricketBowlingTeamName = cricketBowlingTeam?.name ?? cricketScore?.bowling_team;
  const cricketSummary = cricketScore?.result?.margin ?? cricketScore?.summary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenContainer edges={['top']} scroll>
        {/* Top Header Controls — back navigation already lives in the native
            Stack header (see live-score/_layout.tsx); this row is just status. */}
        <View style={styles.topNavRow}>
          <View style={styles.liveIndicatorPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveIndicatorText}>LIVE SYNC</Text>
          </View>
        </View>

        {/* Metadata Bar matching PDF Specifications */}
        <View style={styles.metaBanner}>
          <View style={styles.sportBadge}>
            <Text style={styles.sportBadgeText}>{match.sport.name.toUpperCase()}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metaScroll}>
            <Text style={styles.metaText}>Format: <Text style={styles.metaVal}>{formatText}</Text></Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.metaText}>Age: <Text style={styles.metaVal}>{ageText}</Text></Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.metaText}>Cat: <Text style={styles.metaVal}>{categoryText}</Text></Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.metaText}>Country: <Text style={styles.metaVal}>{countryText}</Text></Text>
          </ScrollView>
        </View>

        {/* Hero Match & Player Photo Container matching Screenshots #1 & PDF Pages 1-16 */}
        <View style={styles.heroCard}>
          <View style={styles.heroMatchRow}>
            {/* Home Player / Team Profile */}
            <View style={styles.playerProfileCard}>
              <Image source={{ uri: homeTeam.photo_url }} style={styles.playerPhotoLarge} />
              <Text style={styles.playerNameLarge} numberOfLines={1}>{homeTeam.name}</Text>
              <Text style={styles.playerSubText}>{homeTeam.school_academy}</Text>
              <Text style={styles.playerClubText}>{homeTeam.club}</Text>
            </View>

            {/* VS & Live Score Counter */}
            <View style={styles.vsHeroCenter}>
              <Text style={styles.vsHeroText}>VS</Text>
              <View style={styles.realtimeScoreBox}>
                {sportSlug === 'cricket' ? (
                  <Text style={styles.realtimeScoreText}>
                    {cricketRuns}/{cricketWickets}
                  </Text>
                ) : racketScores ? (
                  <Text style={styles.realtimeScoreText}>
                    {racketScores.points_home ?? 0} - {racketScores.points_away ?? 0}
                  </Text>
                ) : (
                  <Text style={styles.realtimeScoreText}>
                    {teamScore?.home_total ?? 0} - {teamScore?.away_total ?? 0}
                  </Text>
                )}
                {sportSlug === 'cricket' ? (
                  <Text style={styles.subScoreText}>({cricketOversText} Overs)</Text>
                ) : racketScores ? (
                  <Text style={styles.subScoreText}>Set {racketScores.current_set ?? 1}</Text>
                ) : null}
              </View>
            </View>

            {/* Away Player / Team Profile */}
            <View style={styles.playerProfileCard}>
              <Image source={{ uri: awayTeam.photo_url }} style={styles.playerPhotoLarge} />
              <Text style={styles.playerNameLarge} numberOfLines={1}>{awayTeam.name}</Text>
              <Text style={styles.playerSubText}>{awayTeam.school_academy}</Text>
              <Text style={styles.playerClubText}>{awayTeam.club}</Text>
            </View>
          </View>
        </View>

        {/* Sport Specific Scoreboard Matrix matching PDF Layouts (Pages 1-16) */}
        <Text style={styles.sectionTitle}>{sportSlug === 'cricket' ? 'Live Innings' : 'Real-time Score Matrix'}</Text>

        {/* 1. Badminton / Tennis / Table Tennis Racket Score Matrix */}
        {racketScores ? (
          <View style={styles.matrixTableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thCell, { flex: 2 }]}>Player / Team</Text>
              <Text style={styles.thCell}>Set 1</Text>
              <Text style={styles.thCell}>Set 2</Text>
              <Text style={styles.thCell}>Set 3</Text>
              <Text style={[styles.thCell, styles.thHighlight]}>Points</Text>
            </View>
            <View style={styles.tableBodyRow}>
              <Text style={[styles.tdCellName, { flex: 2 }]}>{homeTeam.name}</Text>
              <Text style={styles.tdCell}>{racketScores.set1_home ?? 0}</Text>
              <Text style={styles.tdCell}>{racketScores.set2_home ?? 0}</Text>
              <Text style={styles.tdCell}>{racketScores.set3_home ?? 0}</Text>
              <Text style={[styles.tdCell, styles.tdHighlight]}>{racketScores.points_home ?? 0}</Text>
            </View>
            <View style={styles.tableBodyRow}>
              <Text style={[styles.tdCellName, { flex: 2 }]}>{awayTeam.name}</Text>
              <Text style={styles.tdCell}>{racketScores.set1_away ?? 0}</Text>
              <Text style={styles.tdCell}>{racketScores.set2_away ?? 0}</Text>
              <Text style={styles.tdCell}>{racketScores.set3_away ?? 0}</Text>
              <Text style={[styles.tdCell, styles.tdHighlight]}>{racketScores.points_away ?? 0}</Text>
            </View>
          </View>
        ) : null}

        {/* 2. Judo Score Matrix matching PDF Page 15 */}
        {sportSlug === 'judo' && liveData?.judo_score ? (
          <View style={styles.matrixTableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thCell, { flex: 2 }]}>Competitor</Text>
              <Text style={styles.thCell}>Ippon</Text>
              <Text style={styles.thCell}>Waza-ari</Text>
              <Text style={styles.thCell}>Yuko</Text>
              <Text style={styles.thCell}>Shido</Text>
              <Text style={[styles.thCell, styles.thHighlight]}>G.Score</Text>
            </View>
            <View style={styles.tableBodyRow}>
              <Text style={[styles.tdCellName, { flex: 2 }]}>{homeTeam.name}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.home_ippon ?? 1}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.home_waza_ari ?? 0}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.home_yuko ?? 0}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.home_shido ?? 1}</Text>
              <Text style={[styles.tdCell, styles.tdHighlight]}>{liveData.judo_score.home_g_score ?? 10}</Text>
            </View>
            <View style={styles.tableBodyRow}>
              <Text style={[styles.tdCellName, { flex: 2 }]}>{awayTeam.name}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.away_ippon ?? 0}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.away_waza_ari ?? 1}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.away_yuko ?? 0}</Text>
              <Text style={styles.tdCell}>{liveData.judo_score.away_shido ?? 2}</Text>
              <Text style={[styles.tdCell, styles.tdHighlight]}>{liveData.judo_score.away_g_score ?? 5}</Text>
            </View>
          </View>
        ) : null}

        {/* 3. Cricket Live Details */}
        {sportSlug === 'cricket' && cricketScore ? (
          <View style={styles.cricketCard}>
            {cricketScore.result ? (
              <View style={styles.summaryBox}>
                <Ionicons name="trophy-outline" size={16} color={colors.primary} />
                <Text style={styles.summaryText}>{cricketScore.result.margin}</Text>
              </View>
            ) : null}
            {!cricketScore.result && cricketScore.innings === 2 && cricketScore.team_a && cricketBattingTeamName ? (
              (() => {
                const runsNeeded = cricketScore.team_a.runs + 1 - cricketRuns;
                if (runsNeeded <= 0) return null;
                return (
                  <View style={styles.needBanner}>
                    <View style={styles.needBannerDot} />
                    <Text style={styles.needBannerText}>
                      {cricketBattingTeamName} need {runsNeeded} run{runsNeeded === 1 ? '' : 's'} to win
                    </Text>
                  </View>
                );
              })()
            ) : null}
            <View style={styles.cricketRow}>
              <Text style={styles.cricketLabel}>Batting Team</Text>
              <Text style={styles.cricketVal}>{cricketBattingTeamName}</Text>
            </View>
            {cricketBowlingTeamName ? (
              <View style={styles.cricketRow}>
                <Text style={styles.cricketLabel}>Bowling Team</Text>
                <Text style={styles.cricketVal}>{cricketBowlingTeamName}</Text>
              </View>
            ) : null}
            <View style={styles.cricketRow}>
              <Text style={styles.cricketLabel}>Current Score</Text>
              <Text style={styles.cricketValHighlight}>
                {cricketRuns}/{cricketWickets} ({cricketOversText} overs)
              </Text>
            </View>
            {cricketScore.innings === 2 && cricketScore.team_a ? (
              <View style={styles.cricketRow}>
                <Text style={styles.cricketLabel}>Target</Text>
                <Text style={styles.cricketVal}>{cricketScore.team_a.runs + 1}</Text>
              </View>
            ) : null}
            {cricketSummary && !cricketScore.result ? (
              <View style={styles.summaryBox}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.summaryText}>{cricketSummary}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 3b. Player Score Card */}
        {sportSlug === 'cricket' && cricketStriker ? (
          <View style={styles.playerScoreCardWrap}>
            <Text style={styles.sectionTitle}>Player Score Card</Text>
            <View style={styles.playerScoreRow}>
              <View style={[styles.playerScoreCard, styles.playerScoreCardActive]}>
                <Text style={styles.playerScoreLabel}>STRIKER</Text>
                <Text style={styles.playerScoreName} numberOfLines={1}>{cricketStriker.name}</Text>
                <Text style={styles.playerScoreStats}>
                  {cricketStriker.runs ?? 0} runs ({cricketStriker.balls ?? 0} balls)
                </Text>
              </View>
              {cricketNonStriker ? (
                <View style={styles.playerScoreCard}>
                  <Text style={[styles.playerScoreLabel, styles.playerScoreLabelMuted]}>NON-STRIKER</Text>
                  <Text style={styles.playerScoreName} numberOfLines={1}>{cricketNonStriker.name}</Text>
                  <Text style={styles.playerScoreStats}>
                    {cricketNonStriker.runs ?? 0} runs ({cricketNonStriker.balls ?? 0} balls)
                  </Text>
                </View>
              ) : null}
            </View>

            {cricketBattingTeam?.currentOver && cricketBattingTeam.currentOver.length > 0 ? (
              <View style={styles.overDotsRow}>
                {cricketBattingTeam.currentOver.map((code: string, idx: number) => (
                  <View key={idx} style={[styles.overDot, overDotStyle(code)]}>
                    <Text style={styles.overDotText}>{code}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* 3c. Batting / Bowling stats */}
        {sportSlug === 'cricket' && cricketScore?.team_a ? (
          <View style={styles.statsSectionWrap}>
            {cricketScore.team_a.started ? (
              <CricketInningsStats
                label="1st Innings"
                battingTeam={cricketScore.team_a}
                bowlingTeam={cricketScore.team_b}
              />
            ) : null}
            {cricketScore.team_b?.started ? (
              <CricketInningsStats
                label="2nd Innings"
                battingTeam={cricketScore.team_b}
                bowlingTeam={cricketScore.team_a}
              />
            ) : null}
          </View>
        ) : null}

        {/* 4. Roster */}
        {(homeTeam.players.length > 0 || awayTeam.players.length > 0) ? (
          <>
            <Text style={styles.sectionTitle}>Players</Text>
            <View style={styles.rosterCard}>
              <View style={styles.rosterCol}>
                {homeTeam.players.map((player) => (
                  <View key={player.id} style={styles.rosterRow}>
                    {player.photo_url ? (
                      <Image source={{ uri: player.photo_url }} style={styles.rosterAvatar} />
                    ) : (
                      <View style={[styles.rosterAvatar, styles.rosterAvatarPlaceholder]}>
                        <Ionicons name="person" size={14} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.rosterName} numberOfLines={1}>{player.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.rosterDivider} />
              <View style={styles.rosterCol}>
                {awayTeam.players.map((player) => (
                  <View key={player.id} style={styles.rosterRow}>
                    {player.photo_url ? (
                      <Image source={{ uri: player.photo_url }} style={styles.rosterAvatar} />
                    ) : (
                      <View style={[styles.rosterAvatar, styles.rosterAvatarPlaceholder]}>
                        <Ionicons name="person" size={14} color={colors.textMuted} />
                      </View>
                    )}
                    <Text style={styles.rosterName} numberOfLines={1}>{player.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        {/* Venue & Location Card */}
        <View style={styles.venueCard}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.venueTitle}>Match Venue</Text>
            <Text style={styles.venueSub}>{venueText}</Text>
          </View>
        </View>

        {/* Live Stream Action Button */}
        {match.youtube_stream_url ? (
          <Button
            label="Watch Live Stream Video"
            variant="energy"
            onPress={() => router.push(`/(protected)/live-score/stream/${match.id}`)}
            style={styles.streamButton}
          />
        ) : null}
      </ScreenContainer>
      <BottomNavigation activeTab="live-score" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingIndicator: {
    marginTop: spacing.xl,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: spacing.sm,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.live,
    letterSpacing: 0.5,
  },
  metaBanner: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sportBadge: {
    backgroundColor: colors.navy,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  sportBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  metaScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metaVal: {
    fontWeight: '700',
    color: colors.text,
  },
  metaDivider: {
    color: colors.border,
    fontSize: 12,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerProfileCard: {
    flex: 1,
    alignItems: 'center',
  },
  playerPhotoLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    borderWidth: 3,
    borderColor: colors.white,
    marginBottom: 6,
  },
  playerNameLarge: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
  },
  playerSubText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  playerClubText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  vsHeroCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 6,
  },
  vsHeroText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.navy,
  },
  realtimeScoreBox: {
    backgroundColor: colors.navy,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  realtimeScoreText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.energy,
    letterSpacing: -0.3,
  },
  subScoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  matrixTableCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.navy,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  thCell: {
    flex: 1,
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  thHighlight: {
    color: '#38BDF8',
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tdCellName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  tdCell: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  tdHighlight: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  statsSectionWrap: {
    marginBottom: spacing.md,
  },
  statsInningsBlock: {
    marginBottom: spacing.md,
  },
  statsInningsLabel: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  statsTableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
    marginTop: spacing.xs,
  },
  statsTableCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 4,
  },
  statsHeaderCell: {
    width: 44,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'center',
  },
  statsNameCell: {
    width: 110,
    textAlign: 'left',
  },
  statsStatusCell: {
    width: 90,
    textAlign: 'left',
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statsRowActive: {
    backgroundColor: colors.energyLight,
  },
  statsCell: {
    width: 44,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  statsNameText: {
    fontWeight: '700',
    textAlign: 'left',
  },
  statsWicketsCell: {
    fontWeight: '800',
    color: colors.live,
  },
  statsStatusText: {
    textAlign: 'left',
    color: colors.textMuted,
    fontSize: 11,
  },
  emptyStatsText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  cricketCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  needBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.energyLight,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: spacing.xs,
  },
  needBannerDot: {
    width: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.energy,
  },
  needBannerText: {
    ...typography.caption,
    fontWeight: '600',
    color: '#3F4A17',
    flex: 1,
  },
  cricketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cricketLabel: {
    ...typography.caption,
    fontSize: 12,
  },
  cricketVal: {
    ...typography.body,
    fontWeight: '700',
  },
  cricketValHighlight: {
    ...typography.body,
    fontWeight: '900',
    color: colors.live,
  },
  playerScoreCardWrap: {
    marginBottom: spacing.lg,
  },
  playerScoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  playerScoreCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  playerScoreCardActive: {
    borderWidth: 1.5,
    borderColor: colors.energy,
    backgroundColor: colors.energyLight,
  },
  playerScoreLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#7A8A0E',
    marginBottom: 4,
  },
  playerScoreLabelMuted: {
    color: colors.textMuted,
  },
  playerScoreName: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  playerScoreStats: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  overDotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  overDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  overDot4: {
    backgroundColor: '#3B82F6',
  },
  overDot6: {
    backgroundColor: '#22C55E',
  },
  overDotExtra: {
    backgroundColor: '#F59E0B',
  },
  overDotOut: {
    backgroundColor: '#EF4444',
  },
  overDotDefault: {
    backgroundColor: colors.textMuted,
  },
  rosterCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  rosterCol: {
    flex: 1,
    gap: spacing.sm,
  },
  rosterDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rosterAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  rosterAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterName: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  venueTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  venueSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  streamButton: {
    marginBottom: spacing.xl,
  },
});
