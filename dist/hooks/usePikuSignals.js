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
const IDLE_AFTER_MS = 45000; // no input for this long → idle
const DEEP_AFTER_MS = 12000; // slow scroll + long presence → deep reading
const DWELL_TICK_MS = 30000; // page-dwell pulse
function readProduct(node) {
    if (!node)
        return { id: null, title: null };
    const el = node.closest('[data-product-id],[data-product-title]');
    if (!el)
        return { id: null, title: null };
    const id = Number(el.getAttribute('data-product-id')) || null;
    let title = (el.getAttribute('data-product-title') || '').trim();
    if (!title) {
        const a = el.querySelector('a');
        const t = (a?.textContent || el.textContent || '').replace(/\s+/g, ' ').trim();
        if (t && t.length <= 80)
            title = t;
    }
    return { id, title: title || null };
}
export function usePikuSignals(config, onSignal, enabled = true) {
    const cbRef = useRef(onSignal);
    cbRef.current = onSignal;
    const emitRef = useRef(() => { });
    emitRef.current = (s) => { try {
        cbRef.current(s);
    }
    catch { /* never break */ } };
    useEffect(() => {
        if (!enabled || typeof window === 'undefined' || typeof document === 'undefined')
            return;
        let lastUrl = window.location.pathname + window.location.search;
        let pageSince = Date.now();
        let lastInput = Date.now();
        let deepSince = 0;
        let focusSeen = 0;
        let currentState = 'browsing';
        const currentUrl = () => window.location.pathname + window.location.search;
        /* ── Engagement state machine ─────────────────────────────── */
        const setState = (next) => {
            if (next === currentState)
                return;
            currentState = next;
            emitRef.current({ type: 'engagement', at: Date.now(), state: next, url: currentUrl() });
        };
        const onInput = () => {
            lastInput = Date.now();
            if (currentState === 'idle')
                setState('browsing');
        };
        const onScroll = () => {
            onInput();
            deepSince = 0; // any scroll activity resets "deep reading" until it slows
        };
        let lastDwellTick = 0;
        const evaluate = () => {
            if (document.hidden) {
                setState('away');
                return;
            }
            const now = Date.now();
            if (currentState === 'away')
                setState('browsing');
            const sinceInput = now - lastInput;
            if (sinceInput >= IDLE_AFTER_MS) {
                setState('idle');
                checkFocus();
                return;
            }
            if (sinceInput >= DEEP_AFTER_MS && now - pageSince >= DEEP_AFTER_MS) {
                // present but not fidgeting → reading intently
                setState('deep_reading');
            }
            else if (currentState !== 'browsing') {
                setState('browsing');
            }
            checkFocus();
            // page dwell pulse (every DWELL_TICK_MS, based on elapsed, not modulo)
            const dwell = Math.round((now - pageSince) / 1000);
            if (dwell > 0 && (now - lastDwellTick) >= DWELL_TICK_MS) {
                lastDwellTick = now;
                emitRef.current({ type: 'page_dwell', at: now, dwellSeconds: dwell, url: currentUrl() });
            }
        };
        /* ── Navigation ───────────────────────────────────────────── */
        const onNav = () => {
            const url = currentUrl();
            if (url === lastUrl)
                return;
            lastUrl = url;
            pageSince = Date.now();
            emitRef.current({ type: 'navigation', at: Date.now(), url });
        };
        const push = window.history?.pushState;
        if (push) {
            window.history.pushState = function (...args) {
                push.apply(this, args);
                window.setTimeout(onNav, 30);
            };
        }
        const replace = window.history?.replaceState;
        if (replace) {
            window.history.replaceState = function (...args) {
                replace.apply(this, args);
                window.setTimeout(onNav, 30);
            };
        }
        /* ── Product focus (IntersectionObserver + dwell tick) ────── */
        // IO only fires when the ratio CROSSES a threshold, so we track which
        // cards are intersecting and let a 1s tick emit once each has dwelled.
        const seenFocus = new Set();
        const visibleSince = new Map();
        const intersecting = new Set();
        const checkFocus = () => {
            if (document.hidden)
                return;
            const now = Date.now();
            intersecting.forEach((el) => {
                const since = visibleSince.get(el) ?? now;
                if (now - since < 1500)
                    return;
                const p = readProduct(el);
                const key = `${p.id ?? ''}:${p.title ?? ''}`;
                if (key === ':' || seenFocus.has(key))
                    return;
                seenFocus.add(key);
                emitRef.current({
                    type: 'product_focus', at: now,
                    productId: p.id, productTitle: p.title,
                    dwellSeconds: Math.round((now - since) / 1000),
                    url: currentUrl(),
                });
            });
        };
        const io = 'IntersectionObserver' in window
            ? new IntersectionObserver((entries) => {
                for (const e of entries) {
                    if (e.isIntersecting && e.intersectionRatio >= 0.5) {
                        if (!visibleSince.has(e.target))
                            visibleSince.set(e.target, Date.now());
                        intersecting.add(e.target);
                    }
                    else {
                        intersecting.delete(e.target);
                        visibleSince.delete(e.target);
                    }
                }
            }, { threshold: [0, 0.5, 0.75] })
            : null;
        const observeCards = () => {
            if (!io)
                return;
            document.querySelectorAll('[data-product-id],[data-product-title]').forEach((el) => {
                if (!el.dataset.pkObserved) {
                    el.dataset.pkObserved = '1';
                    io.observe(el);
                }
            });
        };
        /* ── Hover dwell ──────────────────────────────────────────── */
        let hoverTimer;
        let hoverKey = '';
        const onOver = (e) => {
            if (!(e.target instanceof HTMLElement))
                return;
            const p = readProduct(e.target);
            const key = `${p.id ?? ''}:${p.title ?? ''}`;
            if (key === ':' || key === hoverKey)
                return;
            hoverKey = key;
            window.clearTimeout(hoverTimer);
            hoverTimer = window.setTimeout(() => {
                if (document.hidden)
                    return;
                emitRef.current({ type: 'product_hover', at: Date.now(), productId: p.id, productTitle: p.title, url: currentUrl() });
            }, 700);
        };
        const onOut = (e) => {
            if (e.target instanceof HTMLElement && !readProduct(e.target).title) {
                window.clearTimeout(hoverTimer);
                hoverKey = '';
            }
        };
        /* ── Intent bridge (host trackActivity events) ────────────── */
        const onIntent = (e) => {
            const d = e.detail || {};
            const action = String(d.action_type || d.action || '').trim();
            if (!action)
                return;
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
            if (document.hidden) {
                setState('away');
                return;
            }
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
        window.addEventListener('piku:activity', onIntent);
        const evalTimer = window.setInterval(evaluate, 5000);
        const scanTimer = window.setInterval(observeCards, 4000);
        observeCards();
        emitRef.current({ type: 'engagement', at: Date.now(), state: 'browsing', url: currentUrl() });
        return () => {
            document.removeEventListener('pointerover', onOver);
            document.removeEventListener('pointerout', onOut);
            window.removeEventListener('scroll', onScroll, { capture: true });
            window.removeEventListener('pointermove', onInput);
            window.removeEventListener('keydown', onInput);
            window.removeEventListener('touchstart', onInput);
            window.removeEventListener('popstate', onNav);
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('piku:activity', onIntent);
            window.clearInterval(evalTimer);
            window.clearInterval(scanTimer);
            window.clearTimeout(hoverTimer);
            io?.disconnect();
            if (push)
                window.history.pushState = push;
            if (replace)
                window.history.replaceState = replace;
            void focusSeen;
            void currentState;
        };
    }, [enabled, config.apiUrl, config.routes?.prefix]);
}
