import { inflate } from 'pako';

/**
 * Decode a base64 string to Uint8Array.
 * Uses atob which is available in React Native's JS runtime.
 */
export function base64Decode(b64: string): Uint8Array {
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decompress zlib-compressed data.
 */
export function zlibDecompress(data: Uint8Array): Uint8Array {
  return inflate(data);
}
