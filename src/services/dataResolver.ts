/**
 * High-level data resolver: fetches and parses a Tencent Doc spreadsheet.
 */

import {
  WEB_DEMO_DOC_ID,
  WEB_DEMO_SHEET,
  WEB_DEMO_DOC_ID_2,
  WEB_DEMO_SHEET_2,
} from '../constants/demo';
import type { SheetData } from '../types/sheet';
import { fetchRawResponse } from './tencentDocApi';
import { parseSheetData } from './sheetParser';

export async function resolveSheetData(
  docId: string,
  tabId: string,
): Promise<SheetData> {
  if (docId === WEB_DEMO_DOC_ID) return WEB_DEMO_SHEET;
  if (docId === WEB_DEMO_DOC_ID_2) return WEB_DEMO_SHEET_2;

  const raw = await fetchRawResponse(docId, tabId);
  return parseSheetData(raw);
}
