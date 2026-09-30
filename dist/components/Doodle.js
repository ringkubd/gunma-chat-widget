import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Piku Doodle v4 — animated chef mascot.
 *
 * A hand-drawn inline SVG chef (no external deps/assets): toque + chef
 * coat, stirring a pan, blinking, breathing, waving while talking, and a
 * little hop when it moves. It does NOT follow the cursor — it lives in a
 * corner and proactively talks about products (interest / cart / offers).
 *
 * Behaviour (kept lightweight — GPU transforms only, no JS animation loop
 * unless following the pointer, which is OFF by default):
 *  - greets once per page load
 *  - speaks about a product card that stays in view, or the product page
 *  - hover a product/category for ~600ms → instant (cached) line
 *  - click → open Piku chat with the product context
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PikuRobotArt } from './PikuRobotArt';
import * as pikuBus from '../lib/pikuBus';
const PRODUCT_LINES = [
    '"%s" dekhchen! Recipe ba ingredient lagle bolen 💬',
    '"%s" khub popular bhai — cart e add kori naki?',
    'Ranna korle "%s" ekdom perfect combo!',
    '"%s" fresh ache — ekhoni nite paren!',
];
const GENERAL_LINES = [
    'Aaj ki ranna korben? Recipe dao bolen 🍳',
    '¥10,000+ te delivery FREE!',
    'Fresh mangsho-mach ashe dhukche 😊',
    'Ek sathe "add all" — sab theke easy 💬',
    'Haleem ar paya darun lage ishto 😋',
    'Points ache apnar? 🎁',
    'Cha ek cup? Na garam biryani? 🍚',
];
function pickOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
export function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat, apiUrl, routePrefix = 'api/chat', getSessionId, lang }) {
    const [message, setMessage] = useState(null);
    const [blink, setBlink] = useState(false);
    const [stir, setStir] = useState(false);
    const [hop, setHop] = useState(false);
    const prefillRef = useRef(undefined);
    const messageRef = useRef(null);
    messageRef.current = message;
    // Props/buttons can churn identity on every render — effects must NOT
    // reset their timers because of that (this is why the doodle went mute).
    const doodleRef = useRef(doodle);
    doodleRef.current = doodle;
    const getSessionIdRef = useRef(getSessionId);
    getSessionIdRef.current = getSessionId;
    const size = Math.max(36, Math.min(72, doodle.size ?? 48));
    const pos = doodle.position ?? 'bottom-right';
    const enabled = !!doodle.enabled;
    const say = useCallback((line, prefill) => {
        prefillRef.current = prefill;
        setMessage(line);
        window.setTimeout(() => setMessage(null), 8000);
    }, []);
    /* ── Direct relation: chat widget e je holo, doodle react kore ── */
    const celebrateRef = useRef(null);
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        const offAdd = pikuBus.on('cart-added', (p) => {
            celebrateRef.current = p.message
                ? `✅ ${p.message} 🎉`
                : '✅ কার্টে অ্যাড হয়ে গেল ভাই! 🎉';
        });
        const offOrder = pikuBus.on('order-updated', (p) => {
            celebrateRef.current = p.message
                ? `✅ ${p.message} ✓`
                : null;
        });
        const offClosed = pikuBus.on('chat-closed', () => {
            // Chat bondho hole doodle phire eshe celebrate kore (eksathe দেখা যায়)
            if (celebrateRef.current && !messageRef.current) {
                say(celebrateRef.current);
                celebrateRef.current = null;
            }
        });
        return () => { offAdd(); offOrder(); offClosed(); };
    }, [enabled, say]);
    /* ── Blink + breathe + occasional stir/hop ───────────────────── */
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        const iv = window.setInterval(() => {
            if (document.hidden)
                return;
            if (Math.random() < 0.4) {
                setBlink(true);
                window.setTimeout(() => setBlink(false), 130);
            }
            if ((doodle.stir ?? true) && Math.random() < 0.18) {
                setStir(true);
                window.setTimeout(() => setStir(false), 1600);
            }
            if (Math.random() < 0.12) {
                setHop(true);
                window.setTimeout(() => setHop(false), 500);
            }
        }, 2600);
        return () => window.clearInterval(iv);
    }, [enabled, doodle.stir]);
    /* ── Interactive speech state (wave while bubble is visible) ─── */
    const talking = !!message;
    /* ── Greeting + in-view product talk ─────────────────────────── */
    const readProduct = useCallback(() => {
        if (typeof window === 'undefined')
            return null;
        const el = document.querySelector('[data-product-id]');
        if (el) {
            const title = (el.getAttribute('data-product-title') || '').trim().slice(0, 80);
            if (title)
                return { key: `p:${el.getAttribute('data-product-id')}`, title };
        }
        const og = document.querySelector('meta[property="og:title"]');
        const h1 = document.querySelector('h1');
        const detail = (og?.content || h1?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        if (detail && /add to cart|কার্ট|basket/i.test(document.body.innerText.slice(0, 4000))) {
            return { key: `p:${location.pathname}`, title: detail };
        }
        return null;
    }, []);
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        // Speak about products that stay in view (~2s)
        const seen = new Set();
        const observer = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (!e.isIntersecting || e.intersectionRatio < 0.5)
                    continue;
                const el = e.target;
                if (el.dataset.doodleTalked === '1')
                    continue;
                const pid = el.getAttribute('data-product-id') || '';
                let title = (el.getAttribute('data-product-title') || '').trim();
                if (!title) {
                    const a = el.querySelector('a');
                    const t = (a?.textContent || '').replace(/\s+/g, ' ').trim();
                    if (t && t.length <= 70)
                        title = t;
                }
                if (!title)
                    continue;
                const key = `p:${pid || title}`;
                if (seen.has(key))
                    continue;
                window.setTimeout(() => {
                    if (document.hidden || messageRef.current)
                        return;
                    el.dataset.doodleTalked = '1';
                    seen.add(key);
                    const pool = doodleRef.current.texts?.product?.length ? doodleRef.current.texts.product : PRODUCT_LINES;
                    say(pickOf(pool).replace('%s', title), `Ei product ta niye aro jante chai: ${title}`);
                }, 2000);
            }
        }, { threshold: [0.5] });
        const attach = () => {
            document.querySelectorAll('[data-product-id],[data-product-title]').forEach((el) => observer.observe(el));
        };
        attach();
        const attachIv = window.setInterval(attach, 4000);
        return () => {
            window.clearInterval(attachIv);
            observer.disconnect();
        };
    }, [enabled, say]);
    /* ── Pre-generated blurbs cache (instant hover) ──────────────── */
    const briefsRef = useRef(new Map());
    const fetchBriefs = useCallback(async (ids) => {
        if (!apiUrl || ids.length === 0)
            return;
        const need = ids.filter((id) => id && !briefsRef.current.has(id)).slice(0, 40);
        if (need.length === 0)
            return;
        try {
            const res = await fetch(`${apiUrl}/${routePrefix}/products/briefs?ids=${need.join(',')}`, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            });
            if (!res.ok)
                return;
            const json = await res.json();
            const data = (json?.data ?? {});
            Object.entries(data).forEach(([id, text]) => { if (text)
                briefsRef.current.set(id, text); });
        }
        catch { /* ignore */ }
    }, [apiUrl, routePrefix]);
    /* ── Message pool (typed, varied intents) — one speech scheduler ── */
    useEffect(() => {
        if (!enabled || !apiUrl || typeof window === 'undefined')
            return;
        const cfgRef = doodleRef.current;
        const maxMsgs = cfgRef.maxMessages ?? 5;
        const startDelay = cfgRef.startDelayMs ?? 2500;
        const minGap = Math.max(8000, cfgRef.minGapMs ?? 45000);
        let alive = true;
        let pool = [];
        let shownKey = '';
        let spoken = 0;
        try {
            shownKey = `pk_shown_${getSessionIdRef.current?.() ?? 'anon'}`;
        }
        catch {
            shownKey = 'pk_shown';
        }
        const load = async () => {
            const sid = getSessionIdRef.current?.() ?? '';
            try {
                const res = await fetch(`${apiUrl}/${routePrefix}/piku-messages?limit=8${sid ? `&session_id=${encodeURIComponent(sid)}` : ''}${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'include',
                });
                if (!res.ok)
                    return;
                const json = await res.json();
                pool = Array.isArray(json?.data) ? json.data : [];
                // prefer unseen first (sessionStorage memory)
                let shown = [];
                try {
                    shown = JSON.parse(sessionStorage.getItem(shownKey + '_types') || '[]');
                }
                catch {
                    shown = [];
                }
                const unseen = pool.filter((m) => !shown.includes(m.type));
                const rest = pool.filter((m) => shown.includes(m.type));
                pool = [...unseen, ...rest];
            }
            catch { /* ignore */ }
        };
        // mark type shown
        const markShown = (type) => {
            try {
                const arr = JSON.parse(sessionStorage.getItem(shownKey + '_types') || '[]');
                arr.push(type);
                sessionStorage.setItem(shownKey + '_types', JSON.stringify(arr.slice(-6)));
            }
            catch { }
        };
        const loadOnce = () => { void load(); };
        loadOnce();
        const onVis = () => { if (!document.hidden)
            return; };
        window.addEventListener('focus', onVis);
        let timer;
        const schedule = (ms) => {
            if (timer)
                window.clearTimeout(timer);
            timer = window.setTimeout(() => { void speakNext(); }, ms);
        };
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const tick = () => {
            if (!alive || document.hidden || messageRef.current)
                return;
            if (pool.length === 0) {
                schedule(minGap);
                return;
            }
            const m = pool.shift();
            markShown(m.type);
            prefillRef.current = m.chips?.[0]?.prefill ?? undefined;
            setMessage(`${m.text}${m.chips ? ' ⇩' : ''}`);
            lastChipsRef.current = m.chips ?? [];
            window.setTimeout(() => setMessage(null), 9000);
            // speakCount handled in sessionStorage? keep count in ref via sessionStorage
            schedule(minGap);
        };
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const speakNext = () => {
            let spoken = 0;
            try {
                spoken = Number(sessionStorage.getItem(shownKey + '_count') || '0');
            }
            catch {
                spoken = 0;
            }
            if (spoken >= maxMsgs) {
                return;
            } // session cap reached — quiet until new session
            try {
                sessionStorage.setItem(shownKey + '_count', String(spoken + 1));
            }
            catch { }
            tick();
        };
        window.setTimeout(() => { void speakNext(); }, startDelay);
        return () => {
            alive = false;
            if (timer)
                window.clearTimeout(timer);
            window.removeEventListener('focus', onVis);
        };
    }, [enabled, apiUrl, routePrefix, lang, say]);
    /** Title of chips currently in bubble (kept for click handling). */
    const lastChipsRef = useRef([]);
    /* ── Hover dwell (600ms) → instant cached line ───────────────── */
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        let dwell;
        let lastKey = '';
        const resolve = (el) => {
            const prodEl = el.closest('[data-product-id],[data-product-title]');
            if (prodEl) {
                const pid = prodEl.getAttribute('data-product-id') ?? '';
                let title = (prodEl.getAttribute('data-product-title') || '').trim();
                if (!title) {
                    const a = prodEl.querySelector('a');
                    const t = (a?.textContent || '').replace(/\s+/g, ' ').trim();
                    if (t && t.length <= 70)
                        title = t;
                }
                if (title)
                    return { kind: 'p', key: `p:${pid || title}`, title };
            }
            const cat = el.closest('[data-category]')
                ?? el.closest('a[href*="categor"]');
            if (cat) {
                const title = (cat.getAttribute('data-category') || cat.textContent || '')
                    .replace(/\s+/g, ' ').trim().slice(0, 60);
                if (title && title.length <= 60)
                    return { kind: 'c', key: `c:${title}`, title };
            }
            return null;
        };
        const onOver = (e) => {
            if (!(e.target instanceof HTMLElement))
                return;
            const hit = resolve(e.target);
            if (!hit) {
                if (dwell) {
                    window.clearTimeout(dwell);
                    dwell = undefined;
                }
                return;
            }
            if (hit.key === lastKey)
                return;
            lastKey = hit.key;
            window.clearTimeout(dwell);
            dwell = window.setTimeout(() => {
                if (document.hidden || messageRef.current)
                    return;
                const pool = doodleRef.current.texts?.product?.length ? doodleRef.current.texts.product : PRODUCT_LINES;
                if (hit.kind === 'p') {
                    const pidKey = hit.key.replace(/^p:/, '');
                    const cached = briefsRef.current.get(pidKey);
                    const line = cached || pickOf(pool).replace('%s', hit.title);
                    void fetchBriefs([pidKey]);
                    say(line, `Ei product ta niye aro jante chai: ${hit.title}`);
                }
                else {
                    say(`"${hit.title}" category te onek darun jinish ache — dekhen! 💬`);
                }
            }, 600);
        };
        const onOut = () => { window.clearTimeout(dwell); dwell = undefined; };
        document.addEventListener('pointerover', onOver, { passive: true });
        window.addEventListener('pointerleave', onOut);
        return () => {
            document.removeEventListener('pointerover', onOver);
            window.removeEventListener('pointerleave', onOut);
            window.clearTimeout(dwell);
        };
    }, [enabled, say]);
    if (!enabled || chatOpen)
        return null;
    return (_jsxs("div", { className: `gunma-chef-root ${doodle.variant !== 'chef' ? 'pk-robot-wrap' : ''}`, style: { ['--chef-size']: `${size}px` }, children: [message && (_jsxs("div", { className: "gunma-chef-bubble", onClick: (e) => { e.stopPropagation(); const c = prefillRef.current; setMessage(null); onOpenChat(c); }, children: [message, true && lastChipsRef.current.map((c) => (_jsx("button", { className: "gunma-chef-chip", onClick: (e) => { e.stopPropagation(); setMessage(null); onOpenChat(c.prefill); }, children: c.label }, c.label)))] })), _jsx("button", { className: `gunma-chef ${talking ? 'talking' : ''} ${stir ? 'stirring' : ''} ${hop ? 'hopping' : ''}`, style: { '--chef-brand': brandColor }, "aria-label": "Piku \u2014 click to chat", title: "Piku \u2014 click to chat", onClick: () => { setMessage(null); onOpenChat(prefillRef.current); }, children: doodle.variant === 'chef' ? (_jsxs("svg", { viewBox: "0 0 120 140", className: "gunma-chef-svg", "aria-hidden": "true", children: [_jsxs("defs", { children: [_jsxs("radialGradient", { id: "chefGlow2", cx: "50%", cy: "52%", r: "55%", children: [_jsx("stop", { offset: "0", stopColor: brandColor, stopOpacity: "0.45" }), _jsx("stop", { offset: "1", stopColor: brandColor, stopOpacity: "0" })] }), _jsxs("linearGradient", { id: "chefCoat", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#ffffff" }), _jsx("stop", { offset: "1", stopColor: "#dfe9ee" })] }), _jsxs("linearGradient", { id: "chefCoatB", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#fffdf5" }), _jsx("stop", { offset: "1", stopColor: "#e6c268" })] })] }), _jsx("circle", { className: "chef-glow", cx: "60", cy: "74", r: "58", fill: "url(#chefGlow2)" }), _jsxs("g", { className: "chef-body", children: [_jsx("rect", { x: "47", y: "112", width: "9", height: "18", rx: "4", fill: "#334155" }), _jsx("rect", { x: "64", y: "112", width: "9", height: "18", rx: "4", fill: "#334155" }), _jsx("path", { d: "M38 66 q22 -10 44 0 l4 46 q-26 8 -52 0 z", fill: "url(#chefCoat)", stroke: "#cbd9e2" }), _jsx("path", { d: "M48 62 q12 9 24 0 l-4 12 q-8 6 -16 0 z", fill: "#10b981" }), _jsxs("g", { className: "chef-arm-right", children: [_jsx("rect", { x: "78", y: "70", width: "9", height: "26", rx: "4", fill: "url(#chefCoat)", stroke: "#cbd9e2" }), _jsx("g", { className: "chef-pan", children: _jsx("ellipse", { cx: "100", cy: "96", rx: "11", ry: "5", fill: "#4b5054" }) })] }), _jsx("circle", { cx: "60", cy: "46", r: "20", fill: "#f7cda6" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "53", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "67", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("rect", { x: "45", y: "12", width: "30", height: "18", rx: "9", fill: "url(#chefCoatB)", stroke: "#e6c268" }), _jsx("ellipse", { cx: "60", cy: "29", rx: "24", ry: "7", fill: "url(#chefCoatB)", stroke: "#e6c268" })] })] })) : (_jsx(PikuRobotArt, { blink: blink, talking: talking })) })] }));
}
/** Stable dep list for the doodle texts. */
function dpsTextDeps(d) {
    return JSON.stringify(d.texts || {});
}
