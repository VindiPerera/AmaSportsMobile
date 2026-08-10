import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { CricketAnalysisResponse } from '../../types';
import { formatShortMatchDate } from '../../utils/date';
import { chartMaxValue } from '../../utils/chart';
import { AnalysisSectionCard } from './AnalysisSectionCard';

interface CricketRecentFormSectionProps {
  recentForm: CricketAnalysisResponse['recent_form'];
}

const BAR_WIDTH = 22;

/**
 * "Combo chart" per spec Phase 5 §3e — react-native-gifted-charts doesn't
 * overlay a bar + line series out of the box, so this renders the two
 * stacked mini-charts fallback the spec explicitly allows: a Runs bar chart
 * and a Wickets bar chart, sharing the same oldest→newest match order.
 */
export function CricketRecentFormSection({ recentForm }: CricketRecentFormSectionProps) {
  const runsData = recentForm.map((m) => ({
    value: m.runs ?? 0,
    label: formatShortMatchDate(m.match_date).slice(0, 6),
    frontColor: colors.primary,
  }));
  const wicketsData = recentForm.map((m) => ({
    value: m.wickets ?? 0,
    label: formatShortMatchDate(m.match_date).slice(0, 6),
    frontColor: colors.energy,
  }));

  const listMatches = [...recentForm].reverse().slice(0, 10);

  return (
    <AnalysisSectionCard title="Recent Form" icon="trending-up-outline">
      {recentForm.length === 0 ? (
        <View style={styles.emptyNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
          <Text style={styles.emptyNoteText}>No recent matches logged yet.</Text>
        </View>
      ) : (
        <>
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Runs (oldest → newest)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={runsData}
                maxValue={chartMaxValue(runsData.map((d) => d.value))}
                barWidth={BAR_WIDTH}
                spacing={18}
                barBorderRadius={5}
                roundedTop
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={colors.border}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                noOfSections={4}
                height={120}
                isAnimated
              />
            </ScrollView>
          </View>

          <View style={styles.block}>
            <Text style={styles.blockTitle}>Wickets (oldest → newest)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={wicketsData}
                maxValue={chartMaxValue(wicketsData.map((d) => d.value))}
                barWidth={BAR_WIDTH}
                spacing={18}
                barBorderRadius={5}
                roundedTop
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={colors.border}
                yAxisTextStyle={styles.axisText}
                xAxisLabelTextStyle={styles.axisText}
                noOfSections={4}
                height={100}
                isAnimated
              />
            </ScrollView>
          </View>

          <Text style={styles.blockTitle}>Match Log (most recent first)</Text>
          <View style={styles.matchList}>
            {listMatches.map((m, idx) => (
              <View key={idx} style={[styles.matchCard, shadows.sm]}>
                <View style={styles.matchTextBlock}>
                  <Text style={styles.matchOpponent} numberOfLines={1}>
                    {m.opponent || 'Match'}
                  </Text>
                  <Text style={styles.matchDate}>{formatShortMatchDate(m.match_date)}</Text>
                </View>
                <View style={styles.matchFigureBlock}>
                  <Text style={styles.matchFigure}>{m.runs ?? '-'} runs</Text>
                  <Text style={styles.matchFigureSub}>{m.wickets ?? '-'} wkts</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </AnalysisSectionCard>
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
  matchList: {
    gap: spacing.xs,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
  },
  matchTextBlock: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  matchOpponent: {
    ...typography.body,
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
  matchDate: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  matchFigureBlock: {
    alignItems: 'flex-end',
  },
  matchFigure: {
    ...typography.body,
    fontWeight: '800',
    fontSize: 13,
    color: colors.primary,
  },
  matchFigureSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.energy,
    fontWeight: '700',
    marginTop: 2,
  },
});
