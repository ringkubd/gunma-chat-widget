const sent = new Set();
export function reportPikuEvent(cfg, event, data = {}, meta = {}, dedupeKey) {
    if (!cfg.apiUrl || typeof window === 'undefined')
        return;
    if (dedupeKey && sent.has(dedupeKey))
        return;
    if (dedupeKey)
        sent.add(dedupeKey);
    const prefix = cfg.routePrefix ?? 'api/chat';
    try {
        const sid = (() => { try {
            return cfg.getSessionId?.() ?? null;
        }
        catch {
            return null;
        } })();
        const vid = (() => { try {
            return cfg.getVisitorId?.() ?? null;
        }
        catch {
            return null;
        } })();
        void fetch(`${cfg.apiUrl}/${prefix}/piku-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            credentials: 'include',
            keepalive: true,
            body: JSON.stringify({ event, session_id: sid, data: { ...data, visitor_id: vid }, meta }),
        }).catch(() => { });
    }
    catch {
        /* never break the storefront */
    }
}
