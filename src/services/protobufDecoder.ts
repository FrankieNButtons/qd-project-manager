/**
 * Custom protobuf wire-format decoder.
 *
 * Replaces Python's blackboxprotobuf with a TypeScript implementation.
 * Handles wire types: varint (0), 64-bit fixed (1), length-delimited (2).
 * Varints are decoded as BigInt to preserve int64 precision.
 * Repeated fields are collected into arrays.
 */

export type ProtoValue =
  | bigint
  | number
  | Uint8Array
  | string
  | ProtoMessage
  | ProtoValue[];

export interface ProtoMessage {
  [fieldNumber: string]: ProtoValue;
}

/** Read a varint from buf starting at offset. Returns [value, newOffset]. */
function readVarint(buf: Uint8Array, offset: number): [bigint, number] {
  let result = 0n;
  let shift = 0n;
  let pos = offset;

  while (pos < buf.length) {
    const byte = buf[pos];
    result |= BigInt(byte & 0x7f) << shift;
    pos++;
    if ((byte & 0x80) === 0) break;
    shift += 7n;
  }

  return [result, pos];
}

/** Read 8 bytes as a 64-bit little-endian value. */
function readFixed64(buf: Uint8Array, offset: number): [bigint, number] {
  let val = 0n;
  for (let i = 0; i < 8; i++) {
    val |= BigInt(buf[offset + i]) << BigInt(i * 8);
  }
  return [val, offset + 8];
}

/** Try to decode bytes as a nested protobuf message. Returns null if it fails. */
function tryDecodeMessage(buf: Uint8Array): ProtoMessage | null {
  try {
    if (buf.length === 0) return null;
    const msg = decodeProto(buf);
    // Sanity check: must have at least one numeric field key
    const keys = Object.keys(msg);
    if (keys.length === 0) return null;
    // All keys must be valid protobuf field numbers (1 to 2^29 - 1 = 536870911).
    // Values above this indicate a false positive — e.g. multi-byte UTF-8 text
    // bytes being mis-decoded as a varint tag with an impossibly large field number.
    if (!keys.every((k) => /^\d+$/.test(k) && Number(k) >= 1 && Number(k) <= 536870911)) return null;
    return msg;
  } catch {
    return null;
  }
}

/**
 * Reconstruct the raw bytes of a length-delimited field that was decoded as a message.
 * Used when a protobuf parse produces a message but the data was actually a string
 * (e.g. "=MIN(" bytes coincidentally form valid wire format).
 */
export function messageToRawString(msg: ProtoMessage): string | null {
  try {
    const parts: number[] = [];

    function encodeVarint(val: bigint): void {
      let v = val;
      while (v > 0x7fn) {
        parts.push(Number(v & 0x7fn) | 0x80);
        v >>= 7n;
      }
      parts.push(Number(v));
    }

    const keys = Object.keys(msg).sort((a, b) => Number(a) - Number(b));
    for (const key of keys) {
      const fieldNum = Number(key);
      const value = msg[key];

      if (typeof value === 'bigint') {
        // wire type 0 (varint)
        const tag = BigInt(fieldNum << 3 | 0);
        encodeVarint(tag);
        encodeVarint(value);
      } else if (typeof value === 'number') {
        // wire type 5 (32-bit fixed)
        const tag = BigInt(fieldNum << 3 | 5);
        encodeVarint(tag);
        parts.push(value & 0xFF);
        parts.push((value >> 8) & 0xFF);
        parts.push((value >> 16) & 0xFF);
        parts.push((value >> 24) & 0xFF);
      } else if (typeof value === 'string') {
        // wire type 2 (length-delimited)
        const tag = BigInt(fieldNum << 3 | 2);
        encodeVarint(tag);
        const bytes = new TextEncoder().encode(value);
        encodeVarint(BigInt(bytes.length));
        for (const b of bytes) parts.push(b);
      } else {
        return null; // can't reconstruct nested messages/arrays
      }
    }

    // Check if all bytes are printable ASCII
    const allPrintable = parts.every(
      (b) => (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13,
    );
    if (!allPrintable) return null;

    return String.fromCharCode(...parts);
  } catch {
    return null;
  }
}

/**
 * Decode a protobuf binary message into a nested JS object.
 *
 * Field numbers become string keys. Repeated fields become arrays.
 * Varint values are BigInt. Length-delimited fields are tried as nested
 * messages first, falling back to raw bytes (returned as string via UTF-8).
 */
export function decodeProto(buf: Uint8Array): ProtoMessage {
  const msg: ProtoMessage = {};
  let offset = 0;

  while (offset < buf.length) {
    // Read field tag (varint)
    let tag: bigint;
    [tag, offset] = readVarint(buf, offset);

    const fieldNumber = Number(tag >> 3n);
    const wireType = Number(tag & 0x7n);

    if (fieldNumber === 0) break; // invalid

    let value: ProtoValue;

    switch (wireType) {
      case 0: {
        // Varint
        let v: bigint;
        [v, offset] = readVarint(buf, offset);
        value = v;
        break;
      }
      case 1: {
        // 64-bit fixed
        let v: bigint;
        [v, offset] = readFixed64(buf, offset);
        value = v;
        break;
      }
      case 2: {
        // Length-delimited
        let length: bigint;
        [length, offset] = readVarint(buf, offset);
        const len = Number(length);
        const data = buf.slice(offset, offset + len);
        offset += len;

        // Try to parse as nested message
        const nested = tryDecodeMessage(data);
        if (nested !== null) {
          value = nested;
        } else {
          // Try UTF-8 string
          try {
            const decoder = new TextDecoder('utf-8', { fatal: true });
            value = decoder.decode(data);
          } catch {
            value = data;
          }
        }
        break;
      }
      case 5: {
        // 32-bit fixed
        let val = 0;
        for (let i = 0; i < 4; i++) {
          val |= buf[offset + i] << (i * 8);
        }
        offset += 4;
        value = val;
        break;
      }
      default:
        // Unknown wire type — stop parsing
        return msg;
    }

    const key = String(fieldNumber);
    const existing = msg[key];

    if (existing === undefined) {
      msg[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      msg[key] = [existing, value];
    }
  }

  return msg;
}
