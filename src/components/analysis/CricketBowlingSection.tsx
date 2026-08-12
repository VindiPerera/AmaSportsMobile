import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { CricketAnalysisResponse } from '../../types';
import { formatShortMatchDate } from '../../utils/date';
import { chartMaxValue } from '../../utils/chart';
import { fmtDecimal, fmtFigure } from '../../utils/statFormat';
import { AnalysisSectionCard } from './AnalysisSectionCard';
import { ChartErrorBoundary } from './ChartErrorBoundary';
import { StatCard } from './StatCard';

interface CricketBowlingSectionProps {
  bowling: CricketAnalysisResponse['bowling'];
  recentForm: CricketAnalysisResponse['recent_form'];
}

const BAR_WIDTH = 26;

export function CricketBowlingSection({ bowling, recentForm }: CricketBowlingSectionProps) {
  const wicketsByFormat = bowling.by_format.map((f) => ({
    value: f.wickets,
    label: f.format_name.length > 8 ? `${f.format_name.slice(0, 7)}…` : f.format_name,
    frontColor: colors.energy,
  }));

  const wicketsByMatch = recentForm
    .filter((m) => m.wickets !== null)
    .map((m) => ({
      value: m.wickets as number,
      label: formatShortMatchDate(m.match_date).slice(0, 6),
      frontColor: colors.energy,
    }));

  return (
    <AnalysisSectionCard title="Bowling" icon="flag-outline">
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Wickets by Format</Text>
        {wicketsByFormat.length === 0 ? (
          <EmptyChartNote text="Add bowling stats for a format to see this chart." />
        ) : (
          <ChartErrorBoundary>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={wicketsByFormat}
                maxValue={chartMaxValue(wicketsByFormat.map((d) => d.value))}
                barWidth={BAR_WIDTH}
                spacing={22}
                barBorderRadius={6}
                roundedTop
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={colors.border}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                noOfSections={4}
                height={140}
                isAnimated
              />
            </ScrollView>
          </ChartErrorBoundary>
        )}
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Wickets — Last 10 Matches</Text>
        {/*
          Spec asks for an "Economy Rate trend" here, but
          `cricket_recent_matches` has no runs-conceded column to compute
          economy per match from — see CricketAnalysisService's docblock.
          Wickets-per-match is shown instead so this chart isn't blank; ask
          for the schema addition if the Economy trend is needed.
        */}
        {wicketsByMatch.length === 0 ? (
          <EmptyChartNote text="No recent matches with bowling figures recorded yet." />
        ) : (
          <ChartErrorBoundary>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={wicketsByMatch}
                maxValue={chartMaxValue(wicketsByMatch.map((d) => d.value))}
                barWidth={BAR_WIDTH}
                spacing={22}
                barBorderRadius={6}
                roundedTop
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={colors.border}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                noOfSections={4}
                height={140}
                isAnimated
              />
            </ScrollView>
          </ChartErrorBoundary>
        )}
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textFaint} />
          <Text style={styles.noteText}>
            Economy trend needs a &quot;runs conceded&quot; field per recent match — not tracked yet.
          </Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <StatCard label="Bowl Avg" value={fmtDecimal(bowling.career.average)} variant="row" />
        <StatCard label="Bowl SR" value={fmtDecimal(bowling.career.strike_rate)} variant="row" />
        <StatCard label="Best (Inn)" value={fmtFigure(bowling.career.best_bowling_innings)} variant="row" />
        <StatCard label="Best (Match)" value={fmtFigure(bowling.career.best_bowling_match)} variant="row" />
      </View>
    </AnalysisSectionCard>
  );
}

function EmptyChartNote({ text }: { text: string }) {
  return (
    <View style={styles.emptyNote}>
      <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
      <Text style={styles.emptyNoteText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: spacing.md,
  },
  blockTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.6,
  },
  axisText: {
    color: colors.textFaint,
    fontSize: 10,
  },
  emptyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  emptyNoteText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.xs,
  },
  noteText: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 11,
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
