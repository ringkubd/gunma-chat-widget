/**
 * usePikuSignals — activity collectors for the smart Piku brain.
 *
 * Pure observation: it never speaks and never schedules. Each meaningful
 * customer behaviour becomes a typed PikuSignal that usePikuBrain scores and
 * decides on. Everything is best-effort and read-only — a failure here can
 * never break the storefront.
 *
 * Signals:
 *   navigation      SPA route/page change
 *   product_focus   a product card became the visual focus (IntersectionObserver)
 *   product_hover   pointer dwell over a product/category card
 *   intent          search / cart_add / wishlist / checkout_start
 *   engagement      browsing | deep_reading | idle | away (from scroll+input)
 *   page_dwell      sustained dwell on one page/product
 *   return_visit    tab regained focus after being away
 */
import { useEffect, useRef } from 'react';
import type { ChatWidgetConfig } from '../types';

export type PikuSignalType =
  | 'navigation'
  | 'product_focus'
  | 'product_hover'
  | 'intent'
  | 'engagement'
  | 'page_dwell'
  | 'return_visit';

export type EngagementState = 'browsing' | 'deep_reading' | 'idle' | 'away';

export interface PikuSignal {
  type: PikuSignalType;
  at: number;
  /** Product context, when known. */
  productId?: number | null;
  productTitle?: string | null;
  /** Intent sub-type (search/cart_add/wishlist_add/checkout_start). */
  intent?: string | null;
  keyword?: string | null;
  /** Engagement sub-state. */
  state?: EngagementState;
  /** Seconds spent on the current page / product. */
  dwellSeconds?: number;
  url?: string;
}

const IDLE_AFTER_MS = 45_000;   // no input for this long → idle
const DEEP_AFTER_MS = 12_000;   // slow scroll + long presence → deep reading
const DWELL_TICK_MS = 30_000;   // page-dwell pulse

function readProduct(node: Element | null): { id: number | null; title: string | null } {
  if (!node) return { id: null, title: null };
  const el = node.closest('[data-product-id],[data-product-title]') as HTMLElement | null;
  if (!el) return { id: null, title: null };
  const id = Number(el.getAttribute('data-product-id')) || null;
  let title = (el.getAttribute('data-product-title') || '').trim();
  if (!title) {
    const a = el.querySelector('a') as HTMLAnchorElement | null;
    const t = (a?.textContent || el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t && t.length <= 80) title = t;
  }
  return { id, title: title || null };
}

export function usePikuSignals(
  config: ChatWidgetConfig,
  onSignal: (s: PikuSignal) => void,
  enabled: boolean = true,
) {
  const cbRef = useRef(onSignal);
  cbRef.current = onSignal;
  const emitRef = useRef<(s: PikuSignal) => void>(() => {});
  emitRef.current = (s) => { try { cbRef.current(s); } catch { /* never break */ } };

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof document === 'undefined') return;

    let lastUrl = window.location.pathname + window.location.search;
    let pageSince = Date.now();
    let lastInput = Date.now();
    let deepSince = 0;
    let focusSeen = 0;
    let currentState: EngagementState = 'browsing';

    const currentUrl = () => window.location.pathname + window.location.search;

    /* ── Engagement state machine ─────────────────────────────── */
    const setState = (next: EngagementState) => {
      if (next === currentState) return;
      currentState = next;
      emitRef.current({ type: 'engagement', at: Date.now(), state: next, url: currentUrl() });
    };

    const onInput = () => {
      lastInput = Date.now();
      if (currentState === 'idle') setState('browsing');
    };

    const onScroll = () => {
      onInput();
      deepSince = 0; // any scroll activity resets "deep reading" until it slows
    };

    const evaluate = () => {
      if (document.hidden) { setState('away'); return; }
      const now = Date.now();
      if (currentState === 'away') setState('browsing');
      const sinceInput = now - lastInput;
      if (sinceInput >= IDLE_AFTER_MS) { setState('idle'); return; }
      if (sinceInput >= DEEP_AFTER_MS && now - pageSince >= DEEP_AFTER_MS) {
        // present but not fidgeting → reading intently
        setState('deep_reading');
      } else if (currentState !== 'browsing') {
        setState('browsing');
      }
      // page dwell pulse
      const dwell = Math.round((now - pageSince) / 1000);
      if (dwell > 0 && dwell % Math.round(DWELL_TICK_MS / 1000) === 0) {
        emitRef.current({ type: 'page_dwell', at: now, dwellSeconds: dwell, url: currentUrl() });
      }
    };

    /* ── Navigation ───────────────────────────────────────────── */
    const onNav = () => {
      const url = currentUrl();
      if (url === lastUrl) return;
      lastUrl = url;
      pageSince = Date.now();
      emitRef.current({ type: 'navigation', at: Date.now(), url });
    };

    const push = window.history?.pushState;
    if (push) {
      window.history.pushState = function (this: History, ...args: Parameters<History['pushState']>) {
        push.apply(this, args);
        window.setTimeout(onNav, 30);
      } as History['pushState'];
    }
    const replace = window.history?.replaceState;
    if (replace) {
      window.history.replaceState = function (this: History, ...args: Parameters<History['replaceState']>) {
        replace.apply(this, args);
        window.setTimeout(onNav, 30);
      } as History['replaceState'];
    }

    /* ── Product focus (IntersectionObserver) ─────────────────── */
    const seenFocus = new Set<string>();
    const visibleSince = new Map<Element, number>();
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (!e.isIntersecting || e.intersectionRatio < 0.5) {
              visibleSince.delete(e.target);
              continue;
            }
            if (!visibleSince.has(e.target)) visibleSince.set(e.target, Date.now());
            const since = visibleSince.get(e.target)!;
            const key = `${readProduct(e.target).id ?? ''}:${readProduct(e.target).title ?? ''}`;
            if (Date.now() - since >= 1500 && key !== ':' && !seenFocus.has(key)) {
              seenFocus.add(key);
              const p = readProduct(e.target);
              emitRef.current({
                type: 'product_focus', at: Date.now(),
                productId: p.id, productTitle: p.title,
                dwellSeconds: Math.round((Date.now() - since) / 1000),
                url: currentUrl(),
              });
            }
          }
        }, { threshold: [0, 0.5, 0.75] })
      : null;

    const observeCards = () => {
      if (!io) return;
      document.querySelectorAll('[data-product-id],[data-product-title]').forEach((el) => {
        if (!(el as HTMLElement).dataset.pkObserved) {
          (el as HTMLElement).dataset.pkObserved = '1';
          io.observe(el);
        }
      });
    };

    /* ── Hover dwell ──────────────────────────────────────────── */
    let hoverTimer: number | undefined;
    let hoverKey = '';
    const onOver = (e: PointerEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const p = readProduct(e.target);
      const key = `${p.id ?? ''}:${p.title ?? ''}`;
      if (key === ':' || key === hoverKey) return;
      hoverKey = key;
      window.clearTimeout(hoverTimer);
      hoverTimer = window.setTimeout(() => {
        if (document.hidden) return;
        emitRef.current({ type: 'product_hover', at: Date.now(), productId: p.id, productTitle: p.title, url: currentUrl() });
      }, 700);
    };
    const onOut = (e: PointerEvent) => {
      if (e.target instanceof HTMLElement && !readProduct(e.target).title) {
        window.clearTimeout(hoverTimer);
        hoverKey = '';
      }
    };

    /* ── Intent bridge (host trackActivity events) ────────────── */
    const onIntent = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const action = String(d.action_type || d.action || '').trim();
      if (!action) return;
      emitRef.current({
        type: 'intent', at: Date.now(),
        intent: action,
        keyword: d.search_keyword ?? null,
        productId: d.product_id != null ? Number(d.product_id) : null,
        url: currentUrl(),
      });
    };

    /* ── Visibility / return visit ────────────────────────────── */
    const onVis = () => {
      if (document.hidden) { setState('away'); return; }
      focusSeen = Date.now();
      lastInput = Date.now();
      setState('browsing');
      emitRef.current({ type: 'return_visit', at: Date.now(), dwellSeconds: Math.round((Date.now() - pageSince) / 1000), url: currentUrl() });
    };

    /* ── Wire up ──────────────────────────────────────────────── */
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('pointermove', onInput, { passive: true });
    window.addEventListener('keydown', onInput, { passive: true });
    window.addEventListener('touchstart', onInput, { passive: true });
    window.addEventListener('popstate', onNav);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('piku:activity', onIntent as EventListener);

    const evalTimer = window.setInterval(evaluate, 5_000);
    const scanTimer = window.setInterval(observeCards, 4_000);
    observeCards();
    emitRef.current({ type: 'engagement', at: Date.now(), state: 'browsing', url: currentUrl() });

    return () => {
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('pointermove', onInput);
      window.removeEventListener('keydown', onInput);
      window.removeEventListener('touchstart', onInput);
      window.removeEventListener('popstate', onNav);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('piku:activity', onIntent as EventListener);
      window.clearInterval(evalTimer);
      window.clearInterval(scanTimer);
      window.clearTimeout(hoverTimer);
      io?.disconnect();
      if (push) window.history.pushState = push;
      if (replace) window.history.replaceState = replace;
      void focusSeen; void currentState;
    };
  }, [enabled, config.apiUrl, config.routes?.prefix]);
}
