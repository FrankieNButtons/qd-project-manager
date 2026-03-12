import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TeamProgress } from '../../types/indicator';
import { Colors, getIndicatorColor } from '../../constants/colors';

interface Props {
  data: TeamProgress[];
}

function StackedProgressBar({ indicators, trackedNames }: {
  indicators: TeamProgress['indicators'];
  trackedNames: string[];
}) {
  // Each segment represents one indicator's weighted contribution
  const total = indicators.reduce((sum, ind) => sum + ind.progress, 0);
  const maxTotal = indicators.length; // max possible sum (each = 1.0)

  return (
    <View style={styles.stackedBarBg}>
      <View style={styles.stackedBarRow}>
        {indicators.map((ind) => {
          const widthPct = maxTotal > 0 ? (ind.progress / maxTotal) * 100 : 0;
          const colorIndex = trackedNames.indexOf(ind.name);
          if (widthPct <= 0) return null;
          return (
            <View
              key={ind.name}
              style={[
                styles.stackedSegment,
                {
                  width: `${widthPct}%`,
                  backgroundColor: getIndicatorColor(colorIndex >= 0 ? colorIndex : 0),
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

export function TeamRankingList({ data }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无排名数据</Text>
      </View>
    );
  }

  // Collect all indicator names for consistent color assignment
  const allIndicatorNames = data.length > 0
    ? data[0].indicators.map((i) => i.name)
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>团队排名</Text>

      {/* Legend */}
      {allIndicatorNames.length > 0 && (
        <View style={styles.legend}>
          {allIndicatorNames.map((name, idx) => (
            <View key={name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getIndicatorColor(idx) }]} />
              <Text style={styles.legendText}>{name}</Text>
            </View>
          ))}
        </View>
      )}

      {data.map((team, index) => (
        <View key={team.teamId} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[
              styles.rankBadge,
              index === 0 && styles.rankGold,
              index === 1 && styles.rankSilver,
              index === 2 && styles.rankBronze,
            ]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.teamName}>{team.nickname}</Text>
            <Text style={styles.progressPct}>
              {Math.round(team.overallProgress * 100)}%
            </Text>
          </View>
          <StackedProgressBar indicators={team.indicators} trackedNames={allIndicatorNames} />
          <View style={styles.indicatorSummary}>
            {team.indicators.map((ind) => {
              const colorIndex = allIndicatorNames.indexOf(ind.name);
              return (
                <View key={ind.name} style={styles.indicatorChip}>
                  <View style={[styles.chipDot, { backgroundColor: getIndicatorColor(colorIndex >= 0 ? colorIndex : 0) }]} />
                  <Text style={styles.chipName}>{ind.name}</Text>
                  <Text style={styles.chipValue}>
                    {ind.currentMax}/{ind.target}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankGold: {
    backgroundColor: '#FAAD14',
  },
  rankSilver: {
    backgroundColor: '#A0A0A0',
  },
  rankBronze: {
    backgroundColor: '#CD7F32',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  teamName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  progressPct: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  stackedBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
    marginBottom: 10,
    overflow: 'hidden',
  },
  stackedBarRow: {
    flexDirection: 'row',
    height: 8,
  },
  stackedSegment: {
    height: 8,
  },
  indicatorSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  indicatorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
