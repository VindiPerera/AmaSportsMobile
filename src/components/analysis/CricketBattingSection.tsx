import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';
import { CricketAnalysisResponse } from '../../types';
import { formatShortMatchDate } from '../../utils/date';
import { chartMaxValue } from '../../utils/chart';
import { AnalysisSectionCard } from './AnalysisSectionCard';

interface CricketBattingSectionProps {
  batting: CricketAnalysisResponse['batting'];
  boundaries: CricketAnalysisResponse['boundaries'];
  recentForm: CricketAnalysisResponse['recent_form'];
}

const BAR_WIDTH = 26;

export function CricketBattingSection({ batting, boundaries, recentForm }: CricketBattingSectionProps) {
  const runsByFormat = batting.by_format.map((f) => ({
    value: f.runs,
    label: f.format_name.length > 8 ? `${f.format_name.slice(0, 7)}…` : f.format_name,
    frontColor: colors.primary,
  }));

  const strikeRatePoints = recentForm
    .filter((m) => m.strike_rate !== null)
    .map((m) => ({
      value: m.strike_rate as number,
      label: formatShortMatchDate(m.match_date).slice(0, 6),
      dataPointText: String(m.strike_rate),
    }));

  const hasBoundaries = boundaries.fours + boundaries.sixes > 0;
  const boundaryData = hasBoundaries
    ? [
        { value: boundaries.fours, color: colors.primary, text: `${boundaries.fours}` },
        { value: boundaries.sixes, color: colors.energy, text: `${boundaries.sixes}` },
      ]
    : [{ value: 1, color: colors.border, text: '' }];

  return (
    <AnalysisSectionCard title="Batting" icon="baseball-outline">
      <ChartBlock title="Runs by Format">
        {runsByFormat.length === 0 ? (
          <EmptyChartNote text="Add batting stats for a format to see this chart." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={runsByFormat}
              maxValue={chartMaxValue(runsByFormat.map((d) => d.value))}
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
        )}
      </ChartBlock>

      <ChartBlock title="Strike Rate — Last 10 Matches">
        {strikeRatePoints.length < 2 ? (
          // A curved line needs >= 2 points — with fewer, gifted-charts'
          // internal bezier math divides by (data.length - 1) = 0, which
          // produces a NaN SVG path. Native RN quietly ignores that; the web
          // renderer's real <svg> throws on it, crashing the whole screen.
          <EmptyChartNote
            text={
              strikeRatePoints.length === 0
                ? 'No recent innings with balls faced recorded yet.'
                : 'Log at least one more recent innings with balls faced to see a trend.'
            }
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={strikeRatePoints}
              maxValue={chartMaxValue(strikeRatePoints.map((d) => d.value))}
              color={colors.primary}
              thickness={2.5}
              dataPointsColor={colors.primary}
              curved
              hideRules
              xAxisThickness={1}
              yAxisThickness={0}
              xAxisColor={colors.border}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              height={140}
              spacing={44}
              initialSpacing={20}
              isAnimated
            />
          </ScrollView>
        )}
      </ChartBlock>

      <View style={styles.splitRow}>
        <ChartBlock title="4s vs 6s" style={styles.halfBlock}>
          <View style={styles.donutRow}>
            <PieChart
              data={boundaryData}
              donut
              radius={54}
              innerRadius={36}
              innerCircleColor={colors.card}
              centerLabelComponent={() =>
                hasBoundaries ? (
                  <Text style={styles.donutCenter}>{boundaries.fours + boundaries.sixes}</Text>
                ) : null
              }
            />
            <View style={styles.legend}>
              <LegendRow color={colors.primary} label="4s" value={boundaries.fours} />
              <LegendRow color={colors.energy} label="6s" value={boundaries.sixes} />
            </View>
          </View>
        </ChartBlock>

        <ChartBlock title="Milestones" style={styles.halfBlock}>
          <View style={styles.badgeColumn}>
            <MilestoneBadge icon="trophy" count={batting.career.hundreds} label="100s" tone={colors.energy} />
            <MilestoneBadge icon="ribbon" count={batting.career.fifties} label="50s" tone={colors.primary} />
          </View>
        </ChartBlock>
      </View>
    </AnalysisSectionCard>
  );
}

function ChartBlock({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.block, style]}>
      <Text style={styles.blockTitle}>{title}</Text>
      {children}
    </View>
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

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function MilestoneBadge({
  icon,
  count,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  label: string;
  tone: string;
}) {
  return (
    <View style={styles.milestoneBadge}>
      <View style={[styles.milestoneIcon, { backgroundColor: `${tone}1A` }]}>
        <Ionicons name={icon} size={16} color={tone} />
      </View>
      <Text style={styles.milestoneCount}>{count}</Text>
      <Text style={styles.milestoneLabel}>{label}</Text>
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
  splitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  halfBlock: {
    flex: 1,
    marginBottom: 0,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  donutCenter: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text,
    fontSize: 13,
  },
  legend: {
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  legendValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '800',
  },
  badgeColumn: {
    gap: spacing.sm,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.cardSubtle,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  milestoneIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCount: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text,
  },
  milestoneLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
