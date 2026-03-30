import { create } from 'zustand';
import type { TeamIndicator, IndicatorChangeEvent } from '../types/indicator';
import type { SheetData } from '../types/sheet';
import { extractSheetIndicators } from '../services/sheetFormatAdapter';

interface IndicatorState {
  trackedIndicators: string[];
  excludedIndicators: string[];
  previousSnapshot: Record<string, TeamIndicator[]>;
  updateTrackedIndicators: (sheets: Record<string, SheetData>, teamIds: string[]) => void;
  saveSnapshot: (sheets: Record<string, SheetData>, teamIds: string[]) => void;
  stopTracking: (indicator: string) => void;
  detectChanges: (
    oldSheets: Record<string, SheetData>,
    newSheets: Record<string, SheetData>,
    teamIds: string[],
  ) => IndicatorChangeEvent[];
}

export function extractIndicators(sheet: SheetData): TeamIndicator[] {
  return extractSheetIndicators(sheet);
}

function getIndicatorNames(sheet: SheetData): Set<string> {
  return new Set(extractIndicators(sheet).map((i) => i.name).filter(Boolean));
}

function intersectSets(sets: Set<string>[]): Set<string> {
  if (sets.length === 0) return new Set();
  let result = new Set(sets[0]);
  for (let i = 1; i < sets.length; i++) {
    result = new Set([...result].filter((x) => sets[i].has(x)));
  }
  return result;
}

function unionSets(sets: Set<string>[]): Set<string> {
  const result = new Set<string>();
  for (const s of sets) {
    for (const v of s) result.add(v);
  }
  return result;
}

export const useIndicatorStore = create<IndicatorState>()((set, get) => ({
  trackedIndicators: [],
  excludedIndicators: [],
  previousSnapshot: {},

  updateTrackedIndicators: (sheets: Record<string, SheetData>, teamIds: string[]) => {
    const indicatorSets = teamIds
      .filter((id) => sheets[id])
      .map((id) => getIndicatorNames(sheets[id]));
    const intersection = intersectSets(indicatorSets);
    const excluded = get().excludedIndicators;
    const tracked = [...intersection].filter((i) => !excluded.includes(i));
    set({ trackedIndicators: tracked });
  },

  stopTracking: (indicator: string) => {
    set((state) => ({
      excludedIndicators: [...state.excludedIndicators, indicator],
      trackedIndicators: state.trackedIndicators.filter((i) => i !== indicator),
    }));
  },

  saveSnapshot: (sheets: Record<string, SheetData>, teamIds: string[]) => {
    const snapshot: Record<string, TeamIndicator[]> = {};
    for (const id of teamIds) {
      if (sheets[id]) {
        snapshot[id] = extractIndicators(sheets[id]);
      }
    }
    set({ previousSnapshot: snapshot });
  },

  detectChanges: (
    oldSheets: Record<string, SheetData>,
    newSheets: Record<string, SheetData>,
    teamIds: string[],
  ): IndicatorChangeEvent[] => {
    const events: IndicatorChangeEvent[] = [];
    const activeIds = teamIds.filter((id) => newSheets[id]);

    // Build per-team indicator sets
    const oldMap = new Map<string, Set<string>>();
    const newMap = new Map<string, Set<string>>();
    for (const id of teamIds) {
      if (oldSheets[id]) oldMap.set(id, getIndicatorNames(oldSheets[id]));
      if (newSheets[id]) newMap.set(id, getIndicatorNames(newSheets[id]));
    }

    const oldUnion = unionSets([...oldMap.values()]);
    const newUnion = unionSets([...newMap.values()]);
    const oldIntersection = intersectSets([...oldMap.values()]);
    const newIntersection = intersectSets([...newMap.values()]);

    // 1. New indicators (in new union but not old union)
    for (const ind of newUnion) {
      if (oldUnion.has(ind)) continue;
      const haveTeams = activeIds.filter((id) => newMap.get(id)?.has(ind));
      const missingTeams = activeIds.filter((id) => !newMap.get(id)?.has(ind));
      if (missingTeams.length === 0) {
        events.push({ type: 'unified_add', indicator: ind });
      } else {
        events.push({ type: 'partial_add', indicator: ind, haveTeams, missingTeams });
      }
    }

    // 2. Deleted indicators (was tracked, now missing from some/all)
    for (const ind of oldIntersection) {
      if (newIntersection.has(ind)) continue;
      const remainingTeams = activeIds.filter((id) => newMap.get(id)?.has(ind));
      const deletedTeams = activeIds.filter((id) => !newMap.get(id)?.has(ind));
      if (deletedTeams.length === 0) continue;
      if (remainingTeams.length === 0) {
        events.push({ type: 'unified_delete', indicator: ind });
      } else {
        events.push({ type: 'partial_delete', indicator: ind, deletedTeams, remainingTeams });
      }
    }

    // 3. Data updates for indicators still in both intersections
    const updatedIndicators: string[] = [];
    const updatedTeams = new Set<string>();
    for (const ind of newIntersection) {
      if (!oldIntersection.has(ind)) continue;
      for (const teamId of teamIds) {
        const oldSheet = oldSheets[teamId];
        const newSheet = newSheets[teamId];
        if (!oldSheet || !newSheet) continue;
        const oldInd = extractIndicators(oldSheet).find((i) => i.name === ind);
        const newInd = extractIndicators(newSheet).find((i) => i.name === ind);
        if (oldInd && newInd && oldInd.currentMax !== newInd.currentMax) {
          updatedIndicators.push(ind);
          updatedTeams.add(teamId);
        }
      }
    }
    if (updatedIndicators.length > 0) {
      events.push({
        type: 'data_update',
        teams: [...updatedTeams],
        indicators: [...new Set(updatedIndicators)],
      });
    }

    return events;
  },
}));
