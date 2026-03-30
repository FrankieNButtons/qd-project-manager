import type { IndicatorDetail, TeamDetail, TeamIndicator } from '../types/indicator';
import type { CellValue, SheetData } from '../types/sheet';

export type SheetFormatId = 'tencent' | 'progressEval';

interface SheetFormatAdapter {
  id: SheetFormatId;
  matches: (sheet: SheetData) => boolean;
  extractIndicators: (sheet: SheetData) => TeamIndicator[];
  extractTeamDetail: (sheet: SheetData) => TeamDetail | null;
}

const PROGRESS_EVAL_NOTE_START_COL = 7;
const PROGRESS_EVAL_PAIR_WIDTH = 2;
const PROGRESS_PERIOD_RE = /\d{4}年\d{1,2}月/g;

function getMaxCol(table: CellValue[][]): number {
  return table.reduce((max, row) => Math.max(max, row.length - 1), 0);
}

function toText(value: CellValue): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function toNumber(value: CellValue): number | null {
  if (typeof value === 'number') {
    return isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return isFinite(parsed) ? parsed : null;
  }
  return null;
}

function hasFilledValue(value: CellValue): boolean {
  if (typeof value === 'number') return isFinite(value);
  if (typeof value === 'string') return value.trim().length > 0;
  return false;
}

function getNumericSeriesMax(values: number[]): number {
  return values.length > 0 ? Math.max(...values) : 0;
}

function computeProgress(target: number, currentMax: number): number {
  return target > 0 ? Math.min(target, currentMax) / target : 0;
}

function detectSheetFormatFromTable(table: CellValue[][]): SheetFormatId {
  if (
    table.length >= 4 &&
    table[1]?.[4] === '工作任务' &&
    table[1]?.[6] === '任务目标'
  ) {
    return 'progressEval';
  }
  return 'tencent';
}

function extractPeriodsFromRawText(rawText: string | undefined): string[] {
  if (!rawText) return [];
  const matches = rawText.match(PROGRESS_PERIOD_RE) ?? [];
  const periods: string[] = [];
  for (const match of matches) {
    if (!periods.includes(match)) periods.push(match);
  }
  return periods;
}

function getProgressEvalPairColumns(sheet: SheetData): number[] {
  const subHeaderRow = sheet.table[2];
  if (!subHeaderRow) return [];

  const columns: number[] = [];
  for (let c = PROGRESS_EVAL_NOTE_START_COL; c < subHeaderRow.length; c += PROGRESS_EVAL_PAIR_WIDTH) {
    if (subHeaderRow[c] === '进度说明' && subHeaderRow[c + 1] === '完成情况') {
      columns.push(c);
    }
  }
  return columns;
}

function getProgressEvalPeriods(sheet: SheetData): Array<string | null> {
  const pairColumns = getProgressEvalPairColumns(sheet);
  if (pairColumns.length === 0) return [];

  const headerRow = sheet.table[1] ?? [];
  const explicitPeriods = pairColumns.map((col) => toText(headerRow[col]));
  const rawPeriods = extractPeriodsFromRawText(sheet.rawText);

  return pairColumns.map((_, index) => explicitPeriods[index] ?? rawPeriods[index] ?? null);
}

function extractTencentIndicators(sheet: SheetData): TeamIndicator[] {
  return sheet.table.slice(1).map((row) => {
    const name = String(row[0] ?? '');
    const target = Number(row[1] ?? 0);
    const dateValues = row
      .slice(2)
      .map(toNumber)
      .filter((value): value is number => value !== null);
    const currentMax = getNumericSeriesMax(dateValues);
    const progress = computeProgress(target, currentMax);
    return { name, target, currentMax, progress };
  });
}

function extractProgressEvalIndicators(sheet: SheetData): TeamIndicator[] {
  const pairColumns = getProgressEvalPairColumns(sheet);

  return sheet.table.slice(3).map((row) => {
    const name = String(row[4] ?? '');
    const target = Number(row[6] ?? 0);
    const completionValues = pairColumns
      .map((noteCol) => toNumber(row[noteCol + 1] ?? null))
      .filter((value): value is number => value !== null);
    const currentMax = getNumericSeriesMax(completionValues);
    const progress = computeProgress(target, currentMax);
    return { name, target, currentMax, progress };
  });
}

function extractProgressEvalTeamDetail(sheet: SheetData): TeamDetail | null {
  const pairColumns = getProgressEvalPairColumns(sheet);
  if (pairColumns.length === 0) return null;

  const periods = getProgressEvalPeriods(sheet);
  const lead = toText(sheet.table[3]?.[2] ?? null);
  const members = toText(sheet.table[3]?.[3] ?? null);

  const indicators: IndicatorDetail[] = sheet.table.slice(3).map((row) => {
    const name = String(row[4] ?? '');
    const target = Number(row[6] ?? 0);
    const completionValues: number[] = [];
    let latestNote = '暂无进度';
    let latestPeriod: string | null = null;
    let hasCompletedSnapshot = false;

    for (let i = 0; i < pairColumns.length; i++) {
      const noteCol = pairColumns[i];
      const completionCell = row[noteCol + 1] ?? null;
      if (!hasFilledValue(completionCell)) continue;

      hasCompletedSnapshot = true;
      latestNote = toText(row[noteCol] ?? null) ?? '暂无进度';
      latestPeriod = periods[i] ?? null;

      const completionValue = toNumber(completionCell);
      if (completionValue !== null) completionValues.push(completionValue);
    }

    const currentMax = getNumericSeriesMax(completionValues);
    const progress = computeProgress(target, currentMax);

    return {
      name,
      target,
      currentMax,
      progress,
      latestNote,
      latestPeriod: hasCompletedSnapshot ? latestPeriod : null,
    };
  });

  return { lead, members, indicators };
}

const adapters: SheetFormatAdapter[] = [
  {
    id: 'progressEval',
    matches: (sheet) => detectSheetFormatFromTable(sheet.table) === 'progressEval',
    extractIndicators: extractProgressEvalIndicators,
    extractTeamDetail: extractProgressEvalTeamDetail,
  },
  {
    id: 'tencent',
    matches: (sheet) => detectSheetFormatFromTable(sheet.table) === 'tencent',
    extractIndicators: extractTencentIndicators,
    extractTeamDetail: () => null,
  },
];

function getAdapter(sheet: SheetData): SheetFormatAdapter {
  return adapters.find((adapter) => adapter.matches(sheet)) ?? adapters[adapters.length - 1];
}

export function createSheetDataFromTable(table: CellValue[][]): SheetData {
  return {
    title: '',
    textLabels: [],
    doubles: [],
    table,
    rawText: '',
    maxRow: Math.max(0, table.length - 1),
    maxCol: getMaxCol(table),
  };
}

export function detectSheetFormat(sheet: SheetData): SheetFormatId {
  return getAdapter(sheet).id;
}

export function detectSheetFormatByTable(table: CellValue[][]): SheetFormatId {
  return detectSheetFormatFromTable(table);
}

export function extractSheetIndicators(sheet: SheetData): TeamIndicator[] {
  return getAdapter(sheet).extractIndicators(sheet);
}

export function extractSheetIndicatorsFromTable(table: CellValue[][]): TeamIndicator[] {
  return extractSheetIndicators(createSheetDataFromTable(table));
}

export function extractSheetTeamDetail(sheet: SheetData): TeamDetail | null {
  return getAdapter(sheet).extractTeamDetail(sheet);
}

export function extractSheetTeamDetailFromTable(table: CellValue[][]): TeamDetail | null {
  return extractSheetTeamDetail(createSheetDataFromTable(table));
}
