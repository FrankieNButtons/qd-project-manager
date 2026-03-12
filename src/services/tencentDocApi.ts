/**
 * HTTP fetch wrapper for the Tencent Docs opendoc API.
 */

import { Platform } from 'react-native';
import { API_URL, DEFAULT_HEADERS } from '../constants/api';

export interface OpendocResponse {
  clientVars: {
    title: string;
    collab_client_vars: {
      initialAttributedText: {
        text: Array<{
          related_sheet: string;
          [key: string]: unknown;
        }>;
      };
    };
  };
}

export async function fetchRawResponse(
  docId: string,
  tabId: string,
): Promise<OpendocResponse> {
  const params = new URLSearchParams({
    id: docId,
    tab: tabId,
    outformat: '1',
    normal: '1',
  });

  const base = Platform.OS === 'web' ? 'http://localhost:3001/proxy' : API_URL;
  const url = `${base}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { ...DEFAULT_HEADERS, Referer: `https://docs.qq.com/sheet/${docId}?tab=${tabId}` },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
