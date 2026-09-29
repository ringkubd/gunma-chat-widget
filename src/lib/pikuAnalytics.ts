/**
 * Tiny fire-and-forget analytics reporter for Piku.
 *
 * Sends business-impact events to POST /piku-events so the dashboard can show
 * how many people Piku helped, how many orders it drove, and revenue. Never
 * throws, never blocks, and drops silently on any failure.
 */
export interface PikuAnalyticsConfig {
  apiUrl?: string;
  routePrefix?: string;
  getSessionId?: () => string | null;
  getVisitorId?: () => string | null;
}

const sent = new Set<string>();

export function reportPikuEvent(
  cfg: PikuAnalyticsConfig,
  event: string,
  data: Record<string, unknown> = {},
  meta: Record<string, unknown> = {},
  dedupeKey?: string,
): void {
  if (!cfg.apiUrl || typeof window === 'undefined') return;
  if (dedupeKey && sent.has(dedupeKey)) return;
  if (dedupeKey) sent.add(dedupeKey);

  const prefix = cfg.routePrefix ?? 'api/chat';
  try {
    const sid = (() => { try { return cfg.getSessionId?.() ?? null; } catch { return null; } })();
    const vid = (() => { try { return cfg.getVisitorId?.() ?? null; } catch { return null; } })();
    void fetch(`${cfg.apiUrl}/${prefix}/piku-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ event, session_id: sid, data: { ...data, visitor_id: vid }, meta }),
    }).catch(() => {});
  } catch {
    /* never break the storefront */
  }
}
