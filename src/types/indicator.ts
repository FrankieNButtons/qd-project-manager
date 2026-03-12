export interface TeamIndicator {
  name: string;
  target: number;
  currentMax: number;
  progress: number;
}

export interface TeamProgress {
  teamId: string;
  nickname: string;
  indicators: TeamIndicator[];
  overallProgress: number;
}

export type IndicatorChangeEvent =
  | { type: 'data_update'; teams: string[]; indicators: string[] }
  | { type: 'unified_add'; indicator: string }
  | { type: 'partial_add'; indicator: string; haveTeams: string[]; missingTeams: string[] }
  | { type: 'partial_delete'; indicator: string; deletedTeams: string[]; remainingTeams: string[] }
  | { type: 'unified_delete'; indicator: string };
