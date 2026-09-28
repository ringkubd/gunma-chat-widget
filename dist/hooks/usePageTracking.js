/**
 * Live page-context heartbeat for Piku.
 *
 * Detects where the customer is (URL path, product page) and POSTs it to the
 * chat backend so Piku + the dashboard know what the person is viewing.
 * Throttled hard: only on route change / product change, ≥10s apart.
 */
import { useEffect, useRef } from 'react';
function stableVisitorId(visitorIdKey = 'gunma_visitor_id') {
    try {
        let id = localStorage.getItem(visitorIdKey);
        if (!id) {
            id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem(visitorIdKey, id);
        }
        return id;
    }
    catch {
        return 'anon';
    }
}
export function usePageTracking(config, getSessionId, enabled = true) {
    const last = useRef({ url: '', pid: null, pidTitle: null });
    const lastSent = useRef(0);
    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || !config.apiUrl)
            return;
        const send = (action, payload) => {
            const sessionId = getSessionId();
            if (!sessionId)
                return;
            const now = Date.now();
            if (now - lastSent.current < 10000)
                return; // ≥10s between pings
            lastSent.current = now;
            const prefix = config.routes?.prefix ?? 'api/chat';
            try {
                void fetch(`${config.apiUrl}/${prefix}/sessions/${sessionId}/page-context`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Visitor-Id': config.visitorId || stableVisitorId(config.storage?.visitorIdKey),
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                }).catch(() => { });
            }
            catch {
                /* never break the storefront */
            }
        };
        const read = () => {
            const url = window.location?.pathname + (window.location?.search ?? '');
            // Detect product link: any visible element carrying data-product-id (host markup),
            // or /product/<slug>/ patterns in the storefront URL.
            const el = document.querySelector('[data-product-id]');
            let pid = el ? Number(el.getAttribute('data-product-id')) || null : null;
            let ptitle = el?.getAttribute('data-product-title') || el?.textContent?.slice(0, 120) || null;
            if (!pid && /\/(product|products)\//.test(url)) {
                // slug is the last path segment; product id unknown with this shape
                pid = null;
            }
            const changed = last.current.url !== url || (pid !== null && last.current.pid !== pid);
            if (!changed) {
                // Gentle heartbeat every 30s on the same page.
                if (Date.now() - lastSent.current >= 30000) {
                    send(pid ? 'product_view' : 'page_view', {
                        page_url: url,
                        title: ptitle,
                        product_id: pid,
                    });
                }
                return;
            }
            last.current = { url, pid, pidTitle: ptitle };
            send(pid ? 'product_view' : 'page_view', {
                page_url: url,
                title: ptitle,
                product_id: pid,
                referrer: document.referrer || undefined,
            });
        };
        read();
        const interval = window.setInterval(read, 5000);
        window.addEventListener('popstate', read);
        const push = window.history?.pushState;
        if (push) {
            // Wrap pushState so SPA navigations trigger a read too.
            window.history.pushState = function (...args) {
                push.apply(this, args);
                setTimeout(read, 30);
            };
        }
        return () => {
            window.clearInterval(interval);
            window.removeEventListener('popstate', read);
            if (push)
                window.history.pushState = push;
        };
    }, [config, getSessionId, enabled]);
}
