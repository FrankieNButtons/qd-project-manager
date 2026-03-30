/**
 * Legacy compatibility wrapper.
 * Prefer importing from sheetFormatAdapter for metadata-aware format adaptation.
 */

import type { TeamDetail, TeamIndicator } from '../types/indicator';
import type { CellValue } from '../types/sheet';
import {
  detectSheetFormatByTable,
  extractSheetIndicatorsFromTable,
  extractSheetTeamDetailFromTable,
  type SheetFormatId,
} from './sheetFormatAdapter';

export type SheetSchema = SheetFormatId;

export function detectSchema(table: CellValue[][]): SheetSchema {
  return detectSheetFormatByTable(table);
}

export function extractIndicatorsBySchema(table: CellValue[][]): TeamIndicator[] {
  return extractSheetIndicatorsFromTable(table);
}

export function extractTeamDetail(table: CellValue[][]): TeamDetail | null {
  return extractSheetTeamDetailFromTable(table);
}
