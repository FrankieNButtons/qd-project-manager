import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TeamProgress, TeamIndicator } from '../../types/indicator';
import { Colors, getIndicatorColor } from '../../constants/colors';
import { useIndicatorStore } from '../../stores/useIndicatorStore';

interface Props {
  team: TeamProgress;
}

function IndicatorRow({ indicator, colorIndex }: { indicator: TeamIndicator; colorIndex: number }) {
  const pct = Math.round(indicator.progress * 100);
  const isComplete = pct >= 100;
  const color = getIndicatorColor(colorIndex);

  return (
    <View style={styles.indicatorRow}>
      <View style={styles.indicatorLabel}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.indicatorName} numberOfLines={1}>
          {indicator.name}
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(100, pct)}%`, backgroundColor: isComplete ? Colors.success : color },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.indicatorValue, isComplete && styles.valueComplete]}>
        {indicator.currentMax}/{indicator.target}
      </Text>
    </View>
  );
}

function StackedOverallBar({ indicators, trackedNames }: {
  indicators: TeamIndicator[];
  trackedNames: string[];
}) {
  const maxTotal = indicators.length;

  return (
    <View style={styles.overallBarBg}>
      <View style={styles.stackedRow}>
        {indicators.map((ind) => {
          const widthPct = maxTotal > 0 ? (ind.progress / maxTotal) * 100 : 0;
          const colorIndex = trackedNames.indexOf(ind.name);
          if (widthPct <= 0) return null;
          return (
            <View
              key={ind.name}
              style={{
                height: 6,
                width: `${widthPct}%`,
                backgroundColor: getIndicatorColor(colorIndex >= 0 ? colorIndex : 0),
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export function TeamDetailCard({ team }: Props) {
  const trackedIndicators = useIndicatorStore((s) => s.trackedIndicators);
  const sortedIndicators = [...team.indicators].sort((a, b) => b.progress - a.progress);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.teamName}>{team.nickname}</Text>
        <Text style={styles.overallPct}>
          {Math.round(team.overallProgress * 100)}%
        </Text>
      </View>

      <StackedOverallBar indicators={team.indicators} trackedNames={trackedIndicators} />

      {sortedIndicators.map((ind) => {
        const colorIndex = trackedIndicators.indexOf(ind.name);
        return (
          <IndicatorRow
            key={ind.name}
            indicator={ind}
            colorIndex={colorIndex >= 0 ? colorIndex : 0}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  overallPct: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  overallBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.background,
    marginBottom: 14,
    overflow: 'hidden',
  },
  stackedRow: {
    flexDirection: 'row',
    height: 6,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  indicatorLabel: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  colorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  barContainer: {
    flex: 1,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  indicatorValue: {
    width: 60,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
  valueComplete: {
    color: Colors.success,
  },
});
