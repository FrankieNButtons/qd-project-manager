/**
 * Extract docId and tabId from a Tencent Docs URL.
 * URL format: https://docs.qq.com/sheet/{docId}?tab={tabId}
 */
export function parseTencentDocUrl(url: string): { docId: string; tabId: string } | null {
  try {
    const match = url.match(/docs\.qq\.com\/sheet\/([A-Za-z0-9]+)/);
    if (!match) return null;

    const docId = match[1];
    const urlObj = new URL(url);
    const tabId = urlObj.searchParams.get('tab') || '';

    return { docId, tabId };
  } catch {
    return null;
  }
}
