/**
 * Live page-context heartbeat for Piku.
 *
 * Detects where the customer is (URL path, product page) and POSTs it to the
 * chat backend so Piku + the dashboard know what the person is viewing.
 * Throttled hard: only on route change / product change, ≥10s apart.
 */
import { useEffect, useRef } from 'react';
import type { ChatWidgetConfig } from '../types';

function stableVisitorId(visitorIdKey = 'gunma_visitor_id'): string {
  try {
    let id = localStorage.getItem(visitorIdKey);
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(visitorIdKey, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

export function usePageTracking(config: ChatWidgetConfig, getSessionId: () => string | null, enabled: boolean = true) {
  const last = useRef<{ url: string; pid: number | null; pidTitle: string | null }>({ url: '', pid: null, pidTitle: null });
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !config.apiUrl) return;

    const send = (
      action: 'page_view' | 'product_view',
      payload: { page_url: string; title: string | null; product_id: number | null; referrer?: string },
    ) => {
      const sessionId = getSessionId();
      if (!sessionId) return;
      const now = Date.now();
      if (now - lastSent.current < 10_000) return; // ≥10s between pings
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
        }).catch(() => {});
      } catch {
        /* never break the storefront */
      }
    };

    const read = () => {
      const url = window.location?.pathname + (window.location?.search ?? '');
      // Detect product link: any visible element carrying data-product-id (host markup),
      // or /product/<slug>/ patterns in the storefront URL.
      const el = document.querySelector('[data-product-id]') as HTMLElement | null;
      let pid: number | null = el ? Number(el.getAttribute('data-product-id')) || null : null;
      let ptitle: string | null = el?.getAttribute('data-product-title') || el?.textContent?.slice(0, 120) || null;
      if (!pid && /\/(product|products)\//.test(url)) {
        // slug is the last path segment; product id unknown with this shape
        pid = null;
      }

      const changed = last.current.url !== url || (pid !== null && last.current.pid !== pid);
      if (!changed) {
        // Gentle heartbeat on the same page — 90s (was 30s) so 1000 open
        // tabs generate ~11 inserts/s, not ~33. Paused while hidden.
        if (!document.hidden && Date.now() - lastSent.current >= 90_000) {
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
    const interval = window.setInterval(read, 15_000); // lighter scan for 1000-tab scale
    window.addEventListener('popstate', read);
    const push = window.history?.pushState;
    if (push) {
      // Wrap pushState so SPA navigations trigger a read too.
      window.history.pushState = function (this: History, ...args: Parameters<History['pushState']>) {
        push.apply(this, args);
        setTimeout(read, 30);
      } as History['pushState'];
    }

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('popstate', read);
      if (push) window.history.pushState = push;
    };
  }, [config, getSessionId, enabled]);
}
