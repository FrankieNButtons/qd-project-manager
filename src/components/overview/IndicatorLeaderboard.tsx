import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { TeamProgress } from '../../types/indicator';
import { Colors, getIndicatorColor } from '../../constants/colors';

interface Props {
  data: TeamProgress[];
  trackedIndicators: string[];
}

type DisplayMode = 'value' | 'progress';

export function IndicatorLeaderboard({ data, trackedIndicators }: Props) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('value');

  if (trackedIndicators.length === 0 || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>指标排行</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, displayMode === 'value' && styles.toggleActive]}
            onPress={() => setDisplayMode('value')}
          >
            <Text
              style={[styles.toggleText, displayMode === 'value' && styles.toggleTextActive]}
            >
              数量
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, displayMode === 'progress' && styles.toggleActive]}
            onPress={() => setDisplayMode('progress')}
          >
            <Text
              style={[styles.toggleText, displayMode === 'progress' && styles.toggleTextActive]}
            >
              进度
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {trackedIndicators.map((indName, indIndex) => {
        const teamsForIndicator = data
          .map((team) => {
            const ind = team.indicators.find((i) => i.name === indName);
            return ind
              ? { teamId: team.teamId, nickname: team.nickname, indicator: ind }
              : null;
          })
          .filter(Boolean)
          .sort((a, b) =>
            displayMode === 'value'
              ? b!.indicator.currentMax - a!.indicator.currentMax
              : b!.indicator.progress - a!.indicator.progress,
          );

        return (
          <View key={indName} style={[styles.indicatorCard, { borderLeftWidth: 3, borderLeftColor: getIndicatorColor(indIndex) }]}>
            <Text style={[styles.indicatorName, { color: getIndicatorColor(indIndex) }]}>{indName}</Text>
            {teamsForIndicator.map((entry, idx) => {
              if (!entry) return null;
              const displayValue =
                displayMode === 'value'
                  ? `${entry.indicator.currentMax}/${entry.indicator.target}`
                  : `${Math.round(entry.indicator.progress * 100)}%`;
              return (
                <View key={entry.teamId} style={styles.leaderRow}>
                  <Text style={styles.leaderRank}>{idx + 1}</Text>
                  <Text style={styles.leaderName}>{entry.nickname}</Text>
                  <Text style={[styles.leaderValue, { color: getIndicatorColor(indIndex) }]}>{displayValue}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  indicatorCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  indicatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  leaderRank: {
    width: 24,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  leaderName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  leaderValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
