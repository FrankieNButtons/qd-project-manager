/**
 * 团队 (Teams) — per-team detail view with sort/filter.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTeamStore } from '../../stores/useTeamStore';
import { useDataStore } from '../../stores/useDataStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useIndicatorStore } from '../../stores/useIndicatorStore';
import { useWeightedProgress } from '../../hooks/useWeightedProgress';
import { TeamDetailCard } from '../../components/teams/TeamDetailCard';
import {
  FilterDropdown,
  defaultFilterState,
  type FilterState,
} from '../../components/teams/FilterDropdown';
import type { TeamProgress } from '../../types/indicator';
import { Colors } from '../../constants/colors';

export default function TeamsScreen() {
  const teams = useTeamStore((s) => s.teams);
  const sheets = useDataStore((s) => s.sheets);
  const weights = useSettingsStore((s) => s.weights);
  const trackedIndicators = useIndicatorStore((s) => s.trackedIndicators);
  const [filterState, setFilterState] = useState<FilterState>(defaultFilterState);

  const progressData = useWeightedProgress(sheets, teams, weights, trackedIndicators);

  const filteredData = useMemo(() => {
    let data = [...progressData];

    // Apply filter
    switch (filterState.filterType) {
      case 'completed':
        data = data.filter((t) => t.overallProgress >= 1);
        break;
      case 'incomplete':
        data = data.filter((t) => t.overallProgress < 1);
        break;
      case 'condition': {
        const condVal = Number(filterState.conditionValue);
        if (filterState.conditionIndicator && !isNaN(condVal)) {
          data = data.filter((t) => {
            const ind = t.indicators.find((i) => i.name === filterState.conditionIndicator);
            if (!ind) return false;
            const val = ind.currentMax;
            switch (filterState.conditionOperator) {
              case '>':
                return val > condVal;
              case '>=':
                return val >= condVal;
              case '<':
                return val < condVal;
              case '<=':
                return val <= condVal;
            }
          });
        }
        break;
      }
    }

    // Apply sort
    data.sort((a, b) => {
      let valA: number;
      let valB: number;

      if (filterState.sortField === 'overall') {
        valA = a.overallProgress;
        valB = b.overallProgress;
      } else {
        const indA = a.indicators.find((i) => i.name === filterState.sortField);
        const indB = b.indicators.find((i) => i.name === filterState.sortField);
        valA = indA?.progress ?? 0;
        valB = indB?.progress ?? 0;
      }

      return filterState.sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return data;
  }, [progressData, filterState]);

  if (teams.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>暂无团队</Text>
        <Text style={styles.emptySubtitle}>前往「设置」添加团队文档链接</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterDropdown
        indicators={trackedIndicators}
        state={filterState}
        onChange={setFilterState}
      />
      <FlatList
        data={filteredData}
        keyExtractor={(item: TeamProgress) => item.teamId}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: TeamProgress }) => <TeamDetailCard team={item} />}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={styles.emptyListText}>无匹配结果</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    padding: 32,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
