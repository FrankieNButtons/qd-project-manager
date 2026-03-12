/**
 * Convert 0-based column index to Excel-style letter(s).
 * 0=A, 25=Z, 26=AA, etc.
 */
export function colToLetter(c: number): string {
  let result = '';
  let col = c;
  while (true) {
    result = String.fromCharCode(65 + (col % 26)) + result;
    col = Math.floor(col / 26) - 1;
    if (col < 0) break;
  }
  return result;
}
