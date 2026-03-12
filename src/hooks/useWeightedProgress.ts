import { useMemo } from 'react';
import type { SheetData } from '../types/sheet';
import type { TeamProgress, TeamIndicator } from '../types/indicator';
import type { TeamConfig } from '../types/team';
import { extractIndicators } from '../stores/useIndicatorStore';

export function useWeightedProgress(
  sheets: Record<string, SheetData>,
  teams: TeamConfig[],
  weights: Record<string, number>,
  trackedIndicators: string[],
): TeamProgress[] {
  return useMemo(() => {
    if (teams.length === 0 || trackedIndicators.length === 0) return [];

    const progressList: TeamProgress[] = [];

    for (const team of teams) {
      const sheet = sheets[team.id];
      if (!sheet) continue;

      const allIndicators = extractIndicators(sheet);
      const tracked = allIndicators.filter((i) => trackedIndicators.includes(i.name));

      // Calculate weighted overall progress
      let totalWeight = 0;
      let weightedSum = 0;

      for (const ind of tracked) {
        const w = weights[ind.name] ?? 1 / trackedIndicators.length;
        totalWeight += w;
        weightedSum += ind.progress * w;
      }

      const overallProgress = totalWeight > 0 ? weightedSum / totalWeight : 0;

      progressList.push({
        teamId: team.id,
        nickname: team.nickname,
        indicators: tracked,
        overallProgress,
      });
    }

    return progressList.sort((a, b) => b.overallProgress - a.overallProgress);
  }, [sheets, teams, weights, trackedIndicators]);
}
