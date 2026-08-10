import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { CricketAnalysisResponse } from '../../types';
import { fmtDecimal, fmtNumber, fmtPercent } from '../../utils/statFormat';
import { StatCard } from './StatCard';

interface CricketOverviewGridProps {
  overview: CricketAnalysisResponse['overview'];
}

/** 6-tile summary grid at the top of the Cricket Analysis screen (spec Phase 5 §3b). */
export function CricketOverviewGrid({ overview }: CricketOverviewGridProps) {
  return (
    <View style={styles.grid}>
      <View style={styles.cell}>
        <StatCard label="Matches" value={fmtNumber(overview.matches)} icon="calendar-outline" tone="primary" />
      </View>
      <View style={styles.cell}>
        <StatCard label="Runs" value={fmtNumber(overview.runs)} icon="baseball-outline" tone="primary" />
      </View>
      <View style={styles.cell}>
        <StatCard label="Wickets" value={fmtNumber(overview.wickets)} icon="flag-outline" tone="energy" />
      </View>
      <View style={styles.cell}>
        <StatCard label="Batting Avg" value={fmtDecimal(overview.batting_average)} tone="primary" />
      </View>
      <View style={styles.cell}>
        <StatCard label="Bowling Avg" value={fmtDecimal(overview.bowling_average)} tone="energy" />
      </View>
      <View style={styles.cell}>
        <StatCard label="Win %" value={fmtPercent(overview.win_percentage)} icon="trophy-outline" tone="default" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  cell: {
    flexGrow: 1,
    flexShrink: 0,
    width: '31%',
    minWidth: 95,
  },
});
