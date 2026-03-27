/**
 * Schema detection and indicator extraction for different sheet table layouts.
 *
 * Supported schemas:
 *   'tencent'         — default layout from Tencent Docs sheets
 *                       table[0] = header row (skipped)
 *                       table[1+]: [name, target, value1, value2, ...]
 *
 *   'progressEval'    — 建设进度评估表 layout
 *                       table[0] = merged title row
 *                       table[1] = main headers (序号 … 工作任务 … 任务目标 … quarterly pairs)
 *                       table[2] = sub-headers (进度说明 | 完成情况 per quarter)
 *                       table[3+] = task rows: col4=task name, col6=target, col8/10/12...=completion values
 */

import type { CellValue } from '../types/sheet';
import type { TeamIndicator, TeamDetail, IndicatorDetail } from '../types/indicator';

export type SheetSchema = 'tencent' | 'progressEval';

/**
 * Detect which schema a table follows.
 * Checks for 'progressEval' first; falls back to 'tencent'.
 */
export function detectSchema(table: CellValue[][]): SheetSchema {
  if (
    table.length >= 4 &&
    table[1]?.[4] === '工作任务' &&
    table[1]?.[6] === '任务目标'
  ) {
    return 'progressEval';
  }
  return 'tencent';
}

function extractTencent(table: CellValue[][]): TeamIndicator[] {
  return table.slice(1).map((row) => {
    const name = String(row[0] ?? '');
    const target = Number(row[1] ?? 0);
    const dateValues = row
      .slice(2)
      .filter((v) => v !== null && v !== undefined)
      .map(Number)
      .filter((n) => !isNaN(n));
    const currentMax = dateValues.length > 0 ? Math.max(...dateValues) : 0;
    const progress = target > 0 ? Math.min(target, currentMax) / target : 0;
    return { name, target, currentMax, progress };
  });
}

function extractProgressEval(table: CellValue[][]): TeamIndicator[] {
  // Data rows start at index 3 (skip title + 2 header rows).
  // '完成情况' columns are at col 8, 10, 12, ... (stride 2, starting from col 8).
  return table.slice(3).map((row) => {
    const name = String(row[4] ?? '');
    const target = Number(row[6] ?? 0);

    const completionValues: number[] = [];
    for (let c = 8; c < row.length; c += 2) {
      const v = row[c];
      if (v === null || v === undefined || v === '') continue;
      const n = Number(v);
      if (isFinite(n)) completionValues.push(n);
    }

    const currentMax = completionValues.length > 0 ? Math.max(...completionValues) : 0;
    const progress = target > 0 ? Math.min(target, currentMax) / target : 0;
    return { name, target, currentMax, progress };
  });
}

/**
 * Extract rich team detail (lead, members, per-indicator notes) for progressEval sheets.
 * Returns null for tencent schema or tables without the expected layout.
 *
 * 进度说明 columns: 7, 9, 11, ... (stride 2)  — text notes per quarter
 * 完成情况 columns: 8, 10, 12, ... (stride 2)  — numeric completion per quarter
 * Quarter label:    table[1][c] where c is the 进度说明 column
 */
export function extractTeamDetail(table: CellValue[][]): TeamDetail | null {
  if (detectSchema(table) !== 'progressEval') return null;

  const toStr = (v: CellValue): string | null => {
    const s = String(v ?? '').trim();
    return s.length > 0 ? s : null;
  };

  const lead = toStr(table[3]?.[2] ?? null);
  const members = toStr(table[3]?.[3] ?? null);

  const indicators: IndicatorDetail[] = table.slice(3).map((row) => {
    const name = String(row[4] ?? '');
    const target = Number(row[6] ?? 0);

    // Latest 进度说明: scan cols 7, 9, 11, ... — take the rightmost non-empty string
    let latestNote: string | null = null;
    let latestPeriod: string | null = null;
    for (let c = 7; c < row.length; c += 2) {
      const note = toStr(row[c] ?? null);
      if (note) {
        latestNote = note;
        latestPeriod = toStr(table[1]?.[c] ?? null);
      }
    }

    // 完成情况: cols 8, 10, 12, ...
    const completionValues: number[] = [];
    for (let c = 8; c < row.length; c += 2) {
      const v = row[c];
      if (v === null || v === undefined || v === '') continue;
      const n = Number(v);
      if (isFinite(n)) completionValues.push(n);
    }

    const currentMax = completionValues.length > 0 ? Math.max(...completionValues) : 0;
    const progress = target > 0 ? Math.min(target, currentMax) / target : 0;

    return { name, target, currentMax, progress, latestNote, latestPeriod };
  });

  return { lead, members, indicators };
}

/**
 * Detect the schema of a table and extract TeamIndicators accordingly.
 */
export function extractIndicatorsBySchema(table: CellValue[][]): TeamIndicator[] {
  const schema = detectSchema(table);
  if (schema === 'progressEval') return extractProgressEval(table);
  return extractTencent(table);
}
