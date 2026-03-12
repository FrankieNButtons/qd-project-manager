/**
 * Reinterpret a BigInt (int64) as an IEEE 754 double-precision float.
 * Mirrors Python's struct.unpack("<d", struct.pack("<q", val)).
 */
export function bigintToDouble(val: bigint): number {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setBigInt64(0, val, true); // little-endian
  return view.getFloat64(0, true); // little-endian
}
