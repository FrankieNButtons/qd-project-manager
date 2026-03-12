/**
 * Parse the opendoc API response into structured SheetData.
 * Port of parse_sheet_data() from fetch_qq_doc.py.
 *
 * Pipeline: JSON → base64 decode → zlib decompress → protobuf decode
 *   → navigate to field19 → extract textLabels, doubles, formulas, cells
 *   → resolve cell values → output SheetData
 */

import type { CellValue, SheetData } from '../types/sheet';
import { base64Decode, zlibDecompress } from '../utils/decode';
import { bigintToDouble } from '../utils/int64ToDouble';
import { decodeProto, type ProtoMessage, type ProtoValue } from './protobufDecoder';
import { reconstructFormula } from './formulaReconstructor';
import type { OpendocResponse } from './tencentDocApi';

/** Safely navigate proto fields. */
function nav(msg: ProtoValue | undefined, ...path: (string | number)[]): ProtoValue | undefined {
  let current: ProtoValue | undefined = msg;
  for (const key of path) {
    if (current === undefined || current === null) return undefined;
    if (typeof key === 'number') {
      if (Array.isArray(current)) {
        current = current[key];
      } else {
        return undefined;
      }
    } else {
      if (typeof current === 'object' && !ArrayBuffer.isView(current) && !Array.isArray(current)) {
        current = (current as ProtoMessage)[key];
      } else {
        return undefined;
      }
    }
  }
  return current;
}

/** Convert a proto value to number, handling BigInt. */
function toNum(val: ProtoValue | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'bigint') return Number(val);
  if (typeof val === 'number') return val;
  return 0;
}

/** Extract UTF-8 text from a proto field value. */
function extractText(raw: ProtoValue | undefined): string {
  if (raw === undefined || raw === null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'bigint') return String(Number(raw));
  if (typeof raw === 'number') return String(raw);
  if (raw instanceof Uint8Array) {
    return new TextDecoder().decode(raw);
  }
  return String(raw);
}

/** Ensure a value is an array. */
function ensureArray(val: ProtoValue | undefined): ProtoValue[] {
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

/**
 * Parse the opendoc API response and return structured sheet data.
 */
export function parseSheetData(response: OpendocResponse): SheetData {
  const title = response.clientVars?.title ?? 'Unknown';

  // Navigate to the sheet data
  const textEntries = response.clientVars.collab_client_vars.initialAttributedText.text;
  if (!textEntries || textEntries.length === 0) {
    throw new Error('No text entries found in response');
  }

  const relatedSheetB64 = textEntries[0].related_sheet;
  if (!relatedSheetB64) {
    throw new Error('No related_sheet data found');
  }

  // Decode: base64 → zlib → protobuf
  const rawBytes = base64Decode(relatedSheetB64);
  const decompressed = zlibDecompress(rawBytes);
  const message = decodeProto(decompressed);

  // Navigate: message["1"]["5"][1]["19"]
  const field5 = nav(message, '1', '5');
  const field5Arr = ensureArray(field5);
  const field19 = nav(field5Arr[1], '19');
  if (!field19) {
    throw new Error('Could not navigate to field19 in protobuf structure');
  }

  // Extract text labels: field19["5"]["1"]
  const textLabelItems = ensureArray(nav(field19, '5', '1'));
  const textLabels: string[] = textLabelItems.map((item) => {
    const text = nav(item, '1');
    return extractText(text);
  });

  // Extract double values: field19["5"]["3"]
  const doubleItems = ensureArray(nav(field19, '5', '3'));
  const doubles: number[] = doubleItems.map((item) => {
    const val = nav(item, '1');
    if (typeof val === 'bigint') return bigintToDouble(val);
    return toNum(val);
  });

  // Extract formula templates: field19["5"]["5"]
  const formulaTemplates = ensureArray(nav(field19, '5', '5'));

  // Extract cells: field19["6"]
  const cells = ensureArray(nav(field19, '6'));
  const grid = new Map<string, CellValue>();
  let maxRow = 0;
  let maxCol = 0;

  for (const cell of cells) {
    const row = toNum(nav(cell, '1'));
    const col = toNum(nav(cell, '2'));
    const cellType = toNum(nav(cell, '3', '1'));
    const cellRawValue = nav(cell, '3', '2', '1');
    const rawVal = cellRawValue !== undefined ? toNum(cellRawValue) : null;

    maxRow = Math.max(maxRow, row);
    maxCol = Math.max(maxCol, col);

    let resolved: CellValue = null;

    if (cellType === 2) {
      // Numeric value
      if (rawVal !== null && rawVal >= 128) {
        const idx = rawVal - 129;
        resolved = idx >= 0 && idx < doubles.length ? doubles[idx] : null;
      } else {
        resolved = rawVal;
      }
    } else if (cellType === 4) {
      // Text/format reference
      if (rawVal !== null && rawVal >= 0 && rawVal < textLabels.length) {
        resolved = textLabels[rawVal];
      } else if (rawVal === null) {
        resolved = textLabels.length > 0 ? textLabels[0] : null;
      } else {
        resolved = `[label:${rawVal}]`;
      }
    } else if (cellType === 5) {
      // Formula
      const tmplIdx = rawVal ?? 0;
      if (formulaTemplates.length > 0) {
        const tmpl = formulaTemplates[tmplIdx % formulaTemplates.length];
        if (tmpl && typeof tmpl === 'object' && !ArrayBuffer.isView(tmpl) && !Array.isArray(tmpl)) {
          resolved = reconstructFormula(tmpl as ProtoMessage, row, col);
        }
      }
    }

    grid.set(`${row},${col}`, resolved);
  }

  // Build 2D table
  const table: CellValue[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const rowData: CellValue[] = [];
    for (let c = 0; c <= maxCol; c++) {
      rowData.push(grid.get(`${r},${c}`) ?? null);
    }
    table.push(rowData);
  }

  return {
    title,
    textLabels,
    doubles,
    table,
    maxRow,
    maxCol,
  };
}
