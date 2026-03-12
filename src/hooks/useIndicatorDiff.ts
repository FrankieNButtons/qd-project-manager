import { useEffect, useRef } from 'react';
import type { SheetData } from '../types/sheet';
import type { IndicatorChangeEvent } from '../types/indicator';
import { useIndicatorStore } from '../stores/useIndicatorStore';
import { useMessageStore } from '../stores/useMessageStore';
import { useTeamStore } from '../stores/useTeamStore';

function eventToMessage(
  event: IndicatorChangeEvent,
  getName: (id: string) => string,
) {
  switch (event.type) {
    case 'data_update': {
      const teamNames = event.teams.map(getName).join('、');
      const indNames = event.indicators.join('、');
      return {
        level: 'INFO' as const,
        category: '数据更新' as const,
        title: '数据已更新',
        body: `${teamNames}团队更新了${indNames}指标`,
        alertData: event,
      };
    }
    case 'unified_add':
      return {
        level: 'INFO' as const,
        category: '指标变更' as const,
        title: '新增指标',
        body: `${event.indicator}指标已被添加`,
        alertData: event,
      };
    case 'partial_add':
      return {
        level: 'ALERT' as const,
        category: '指标变更' as const,
        title: '部分团队新增指标',
        body: `${getName(event.haveTeams[0])}等团队新增了指标「${event.indicator}」，但${getName(event.missingTeams[0])}等团队没有添加`,
        alertData: event,
      };
    case 'partial_delete':
      return {
        level: 'ALERT' as const,
        category: '指标变更' as const,
        title: '部分团队删除指标',
        body: `${getName(event.deletedTeams[0])}等团队删除了指标「${event.indicator}」，但${getName(event.remainingTeams[0])}等团队仍然保留`,
        alertData: event,
      };
    case 'unified_delete':
      return {
        level: 'ALERT' as const,
        category: '指标变更' as const,
        title: '指标已删除',
        body: `所有团队已删除指标「${event.indicator}」`,
        alertData: event,
      };
  }
}

export function useIndicatorDiff(
  sheets: Record<string, SheetData>,
  teamIds: string[],
  onEvents?: (events: IndicatorChangeEvent[]) => void,
) {
  const previousSheetsRef = useRef<Record<string, SheetData>>({});
  const isFirstRun = useRef(true);
  const detectChanges = useIndicatorStore((s) => s.detectChanges);
  const updateTrackedIndicators = useIndicatorStore((s) => s.updateTrackedIndicators);
  const addMessage = useMessageStore((s) => s.addMessage);
  const teams = useTeamStore((s) => s.teams);

  const getName = (id: string) => teams.find((t) => t.id === id)?.nickname ?? id;

  useEffect(() => {
    updateTrackedIndicators(sheets, teamIds);

    if (isFirstRun.current) {
      isFirstRun.current = false;
      previousSheetsRef.current = { ...sheets };
      return;
    }

    const oldSheets = previousSheetsRef.current;
    if (Object.keys(oldSheets).length === 0) {
      previousSheetsRef.current = { ...sheets };
      return;
    }

    const events = detectChanges(oldSheets, sheets, teamIds);

    if (events.length > 0) {
      for (const event of events) {
        addMessage(eventToMessage(event, getName));
      }
      onEvents?.(events);
    }

    previousSheetsRef.current = { ...sheets };
  }, [sheets, teamIds]);
}
