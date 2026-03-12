/**
 * 总览 (Overview) — Team rankings + indicator leaderboards.
 */

import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTeamStore } from '../../stores/useTeamStore';
import { useDataStore } from '../../stores/useDataStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useIndicatorStore } from '../../stores/useIndicatorStore';
import { useWeightedProgress } from '../../hooks/useWeightedProgress';
import { TeamRankingList } from '../../components/overview/TeamRankingList';
import { IndicatorLeaderboard } from '../../components/overview/IndicatorLeaderboard';
import { Colors } from '../../constants/colors';

export default function OverviewScreen() {
  const teams = useTeamStore((s) => s.teams);
  const sheets = useDataStore((s) => s.sheets);
  const loading = useDataStore((s) => s.loading);
  const errors = useDataStore((s) => s.errors);
  const fetchAllTeams = useDataStore((s) => s.fetchAllTeams);
  const weights = useSettingsStore((s) => s.weights);
  const trackedIndicators = useIndicatorStore((s) => s.trackedIndicators);

  const progressData = useWeightedProgress(sheets, teams, weights, trackedIndicators);

  const isAnyLoading = Object.values(loading).some(Boolean);
  const hasData = Object.keys(sheets).length > 0;
  const teamErrors = teams
    .map((t) => ({ team: t.nickname, error: errors[t.id] }))
    .filter((e) => e.error);

  const handleRefresh = useCallback(() => {
    if (teams.length > 0) {
      fetchAllTeams(teams);
    }
  }, [teams, fetchAllTeams]);

  if (teams.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>暂无团队</Text>
        <Text style={styles.emptySubtitle}>前往「设置」添加团队文档链接</Text>
      </View>
    );
  }

  if (isAnyLoading && !hasData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>正在加载数据...</Text>
      </View>
    );
  }

  // All teams have errors and no data loaded
  if (!hasData && teamErrors.length > 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyTitle}>数据加载失败</Text>
        {teamErrors.map((e) => (
          <Text key={e.team} style={styles.errorText}>
            {e.team}: {e.error}
          </Text>
        ))}
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isAnyLoading} onRefresh={handleRefresh} />
      }
    >
      {/* Show partial errors as a banner */}
      {teamErrors.length > 0 && (
        <View style={styles.errorBanner}>
          {teamErrors.map((e) => (
            <Text key={e.team} style={styles.errorBannerText}>
              ⚠️ {e.team}: {e.error}
            </Text>
          ))}
        </View>
      )}
      <TeamRankingList data={progressData} />
      <IndicatorLeaderboard data={progressData} trackedIndicators={trackedIndicators} />
    </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 4,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FFF7E6',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.warning,
  },
  errorBannerText: {
    fontSize: 12,
    color: Colors.warning,
    lineHeight: 18,
  },
});
