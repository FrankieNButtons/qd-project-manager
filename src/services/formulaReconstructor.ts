/**
 * Reconstruct Excel-style formula strings from protobuf templates.
 * Port of reconstruct_formula() from fetch_qq_doc.py.
 */

import { colToLetter } from '../utils/colToLetter';
import type { ProtoMessage, ProtoValue } from './protobufDecoder';
import { messageToRawString } from './protobufDecoder';

/** Safely navigate a proto message by field path. */
function getField(msg: ProtoValue, field: string): ProtoValue | undefined {
  if (msg && typeof msg === 'object' && !ArrayBuffer.isView(msg) && !Array.isArray(msg)) {
    return (msg as ProtoMessage)[field];
  }
  return undefined;
}

/**
 * Extract numeric value from a proto field, handling BigInt.
 * Interprets unsigned BigInt as signed int64 (two's complement)
 * since protobuf cell reference offsets are signed relative values.
 */
function toNumber(val: ProtoValue | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'bigint') {
    // Convert unsigned BigInt to signed int64
    const MAX_INT64 = (1n << 63n);
    if (val >= MAX_INT64) {
      return Number(val - (1n << 64n));
    }
    return Number(val);
  }
  if (typeof val === 'number') return val;
  return 0;
}

/**
 * Extract text fragment from a formula entry.
 * Formula text like "=MIN(" can be misinterpreted as a protobuf message
 * (its ASCII bytes coincidentally form valid wire format). We detect this
 * by reconstructing the bytes and checking if they're printable ASCII.
 */
function extractFormulaText(entry: ProtoMessage): string | null {
  const field1 = getField(entry, '1');
  if (!field1) return null;

  // Direct string in field 1
  if (typeof field1 === 'string') return field1;

  // Nested: entry.1.1
  if (typeof field1 === 'object' && !ArrayBuffer.isView(field1) && !Array.isArray(field1)) {
    const inner = getField(field1, '1');
    if (typeof inner === 'string') return inner;
    if (typeof inner === 'bigint') return String(Number(inner));

    // inner might be a message that's actually a misinterpreted ASCII string
    // e.g., "=MIN(" bytes parsed as {7: 676219213} (field 7, wire type 5, fixed32)
    if (inner && typeof inner === 'object' && !ArrayBuffer.isView(inner) && !Array.isArray(inner)) {
      const reconstructed = messageToRawString(inner as ProtoMessage);
      if (reconstructed !== null) return reconstructed;
    }
  }

  return null;
}

/**
 * Convert a relative cell/range reference to A1 notation.
 * Mirrors _extract_cell_ref() in Python.
 */
function extractCellRef(
  entry: ProtoMessage,
  formulaRow: number,
  formulaCol: number,
): string | null {
  const ref = getField(entry, '3');
  if (!ref || typeof ref !== 'object' || ArrayBuffer.isView(ref) || Array.isArray(ref)) {
    return null;
  }

  function getOffset(fieldKey: string): number {
    const v = getField(ref as ProtoMessage, fieldKey);
    if (v && typeof v === 'object' && !ArrayBuffer.isView(v) && !Array.isArray(v)) {
      return toNumber(getField(v as ProtoMessage, '1'));
    }
    return 0;
  }

  const startCol = formulaCol + getOffset('3');
  const startRow = formulaRow + getOffset('1');
  const endCol = formulaCol + getOffset('7');
  const endRow = formulaRow + getOffset('5');

  const start = `${colToLetter(startCol)}${startRow + 1}`;
  if (startRow === endRow && startCol === endCol) {
    return start;
  }
  return `${start}:${colToLetter(endCol)}${endRow + 1}`;
}

/**
 * Reconstruct an Excel-style formula string from a protobuf template.
 */
export function reconstructFormula(
  template: ProtoMessage,
  formulaRow: number,
  formulaCol: number,
): string {
  const f1 = getField(template, '1');
  if (!f1 || typeof f1 !== 'object' || ArrayBuffer.isView(f1) || Array.isArray(f1)) {
    return '';
  }

  let entries = getField(f1 as ProtoMessage, '1');
  if (!entries) return '';
  if (!Array.isArray(entries)) entries = [entries];

  const parts: string[] = [];

  for (const entry of entries as ProtoValue[]) {
    if (!entry || typeof entry !== 'object' || ArrayBuffer.isView(entry) || Array.isArray(entry)) {
      continue;
    }

    const text = extractFormulaText(entry as ProtoMessage);
    if (text !== null) {
      parts.push(text);
      continue;
    }

    const ref = extractCellRef(entry as ProtoMessage, formulaRow, formulaCol);
    if (ref !== null) {
      parts.push(ref);
    }
  }

  return parts.join('');
}
