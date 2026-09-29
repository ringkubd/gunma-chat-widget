/**
 * usePikuBrain — the decision engine behind the smart Piku.
 *
 * Replaces the fixed timer loop: it consumes PikuSignals from usePikuSignals,
 * scores them against the customer's live context, and decides whether to
 * speak — never on a clock. Rules:
 *
 *   - per-reason cooldowns (not one global gap)
 *   - a replenishing budget: meaningful engagement tops it up, idling drains
 *     it, hidden tab freezes it — so Piku never goes permanently silent
 *   - suppressors: chat open, cart drawer/checkout, reduced-motion, hidden tab
 *   - no-repeat memory across types + products (sessionStorage)
 *   - graceful fallback to local lines when the API is unavailable
 *
 * It returns { message, chips, talking, blink } for the bubble, mirroring the
 * old usePikuSpeech surface so the widget wiring barely changes.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pikuBus from '../lib/pikuBus';
/* Per-reason cooldowns (ms) — deliberately NOT a single global gap. */
const COOLDOWN = {
    greet: 0, // once per load, handled by seen-set
    product_focus: 18000,
    product_hover: 22000,
    search_intent: 6000,
    near_free_shipping: 60000,
    reorder_window: 90000,
    season_time: 120000,
    tip: 35000,
    celebration: 2000,
};
const FALLBACK_LINES = {
    bn: [
        'Kichu recipe lagbe? Bolo, ami ber kore dei 🙂',
        'Aj ker special gulo dekhchen? Pasand ta bolo!',
        'Free delivery pete aro ektu add korte paren 💸',
        'Kon ta banate chan ajke? Ami help korbo 🍳',
    ],
    hi: [
        'कोई रेसिपी चाहिए? बताइए, मैं निकाल देती हूँ 🙂',
        'आज का स्पेशल देख रहे हैं? पसंद बताइए!',
        'फ्री डिलीवरी के लिए थोड़ा और जोड़ें 💸',
    ],
    en: [
        'Need any recipe? Tell me and I will pull it up 🙂',
        'Browsing today\'s specials? Tell me your pick!',
        'Add a little more to unlock free delivery 💸',
        'What are we cooking today? I can help 🍳',
    ],
};
export function usePikuBrain(opts) {
    const enabled = !!opts.enabled;
    const chatOpen = !!opts.chatOpen;
    const lang = (opts.lang || 'en').slice(0, 2);
    const routePrefix = opts.routePrefix ?? 'api/chat';
    const maxBudget = opts.maxBudget ?? 12;
    const getTokenRef = useRef(opts.getToken);
    getTokenRef.current = opts.getToken;
    const getVisitorIdRef = useRef(opts.getVisitorId);
    getVisitorIdRef.current = opts.getVisitorId;
    const getSessionIdRef = useRef(opts.getSessionId);
    getSessionIdRef.current = opts.getSessionId;
    const optsRef = useRef(opts);
    optsRef.current = opts;
    const [message, setMessage] = useState(null);
    const [chips, setChips] = useState([]);
    const [blink, setBlink] = useState(false);
    const [talking, setTalking] = useState(false);
    const messageRef = useRef(null);
    messageRef.current = message;
    const prefillRef = useRef(undefined);
    /* ── Brain state (refs — no re-render churn) ──────────────── */
    const stateRef = useRef({
        state: 'browsing',
        budget: 6,
        lastSpokenAt: {},
        lastAnyAt: 0,
        seen: new Set(),
        spoken: 0,
        lastProductKey: null,
        url: (typeof window !== 'undefined' ? window.location.pathname : '/'),
        startedAt: Date.now(),
        busy: false,
    });
    const headers = useCallback(() => {
        const h = { Accept: 'application/json', 'Content-Type': 'application/json' };
        try {
            const t = getTokenRef.current?.() ?? null;
            if (t)
                h['Authorization'] = t.startsWith('Bearer ') ? t : `Bearer ${t}`;
            const v = getVisitorIdRef.current?.() ?? null;
            if (v)
                h['X-Visitor-Id'] = v;
        }
        catch { /* ignore */ }
        return h;
    }, []);
    /* ── Cue pool (server-driven; refreshed lazily) ──────────── */
    const poolRef = useRef([]);
    const poolAtRef = useRef(0);
    const loadPool = useCallback(async () => {
        const api = optsRef.current.apiUrl;
        if (!api)
            return;
        const sid = getSessionIdRef.current?.() ?? '';
        try {
            const res = await fetch(`${api}/${routePrefix}/piku-messages?limit=12&mode=activity${sid ? `&session_id=${encodeURIComponent(sid)}` : ''}${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`, { headers: headers(), credentials: 'include' });
            if (!res.ok)
                return;
            const json = await res.json();
            const items = Array.isArray(json?.data) ? json.data : [];
            const s = stateRef.current;
            const unseen = items.filter((m) => !s.seen.has(`${m.type}:${m.product?.product_id ?? ''}`));
            const rest = items.filter((m) => s.seen.has(`${m.type}:${m.product?.product_id ?? ''}`));
            poolRef.current = [...unseen, ...rest];
            poolAtRef.current = Date.now();
        }
        catch { /* ignore */ }
    }, [headers, routePrefix, lang]);
    /* ── Speak with a cue / raw line ─────────────────────────── */
    const show = useCallback((text, cue) => {
        if (!text)
            return;
        const s = stateRef.current;
        s.lastAnyAt = Date.now();
        s.spoken++;
        prefillRef.current = cue?.chips?.[0]?.prefill ?? undefined;
        setChips(cue?.chips ?? []);
        setMessage(text);
        const holdMs = Math.min(14000, Math.max(7000, text.length * 55));
        window.setTimeout(() => {
            if (messageRef.current === text) {
                setMessage(null);
                setChips([]);
            }
        }, holdMs);
    }, []);
    const speakCue = useCallback((cue) => {
        const s = stateRef.current;
        const key = `${cue.type}:${cue.product?.product_id ?? ''}`;
        s.seen.add(key);
        s.lastSpokenAt[cue.type] = Date.now();
        show(cue.text, cue);
    }, [show]);
    const speakFallback = useCallback(() => {
        const lines = (optsRef.current.generalLines && optsRef.current.generalLines.length
            ? optsRef.current.generalLines
            : FALLBACK_LINES[lang] || FALLBACK_LINES.en);
        const s = stateRef.current;
        const fresh = lines.filter((l) => !s.seen.has(`loc:${l}`));
        const line = (fresh.length ? fresh : lines)[Math.floor(Math.random() * Math.max(1, (fresh.length ? fresh : lines).length))];
        if (!line)
            return;
        s.seen.add(`loc:${line}`);
        s.lastSpokenAt.tip = Date.now();
        show(line);
    }, [lang, show]);
    /* ── Compose (LLM, best-quality path) ────────────────────── */
    const compose = useCallback(async (signal, context) => {
        const api = optsRef.current.apiUrl;
        if (!api)
            return null;
        try {
            const res = await fetch(`${api}/${routePrefix}/piku-compose`, {
                method: 'POST',
                headers: headers(),
                credentials: 'include',
                body: JSON.stringify({ signal, context, lang }),
            });
            if (!res.ok)
                return null;
            const json = await res.json();
            const text = typeof json?.text === 'string' ? json.text.trim() : '';
            return text || null;
        }
        catch {
            return null;
        }
    }, [headers, routePrefix, lang]);
    /* ── Decision: should we speak for this signal, and what? ─── */
    const pendingRef = useRef(null);
    const decideRef = useRef(() => { });
    const decide = useCallback(async (signal) => {
        const s = stateRef.current;
        if (!enabled || chatOpen || document.hidden)
            return;
        // Busy speaking → remember the latest meaningful signal and retry when the
        // bubble clears (never drop a real cue just because a line was showing).
        if (messageRef.current || s.busy) {
            if (signal.type !== 'engagement')
                pendingRef.current = signal;
            return;
        }
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && signal.type === 'engagement')
            return;
        const now = Date.now();
        // budget dynamics
        if (signal.type === 'engagement') {
            s.state = signal.state || 'browsing';
            if (signal.state === 'idle')
                s.budget = Math.max(0, s.budget - 0.15);
            else
                s.budget = Math.min(maxBudget, s.budget + 0.1);
            return;
        }
        if (signal.type === 'navigation' || signal.type === 'product_focus' || signal.type === 'product_hover' || signal.type === 'intent') {
            s.budget = Math.min(maxBudget, s.budget + 1); // engagement replenishes
        }
        // reason + cooldown
        let reason = 'tip';
        if (signal.type === 'product_focus')
            reason = 'product_focus';
        else if (signal.type === 'product_hover')
            reason = 'product_hover';
        else if (signal.type === 'intent' && signal.intent === 'search')
            reason = 'search_intent';
        else if (signal.type === 'intent')
            reason = 'tip';
        else if (signal.type === 'navigation' || signal.type === 'page_dwell' || signal.type === 'return_visit')
            reason = 'tip';
        const cd = COOLDOWN[reason] ?? COOLDOWN.tip;
        if ((now - (s.lastSpokenAt[reason] ?? 0)) < cd) {
            pendingRef.current = null;
            return;
        }
        // Small anti-overlap only — real spacing comes from the per-reason cooldown.
        if ((now - s.lastAnyAt) < 3500) {
            pendingRef.current = signal;
            return;
        }
        if (s.budget <= 0)
            return;
        // product context
        const productId = signal.productId ?? null;
        const productKey = `${productId ?? ''}:${signal.productTitle ?? ''}`;
        if (signal.type === 'product_focus' || signal.type === 'product_hover') {
            if (productKey === s.lastProductKey)
                return; // same card, no nagging
            s.lastProductKey = productKey;
            s.seen.add(`${reason}:${productId ?? ''}`); // prevent re-firing this card
        }
        s.busy = true;
        try {
            // refresh pool when stale
            if (Date.now() - poolAtRef.current > 120000 || poolRef.current.length === 0) {
                await loadPool();
            }
            // Pick the best matching cue from the server pool.
            const match = poolRef.current.find((c) => {
                if (s.seen.has(`${c.type}:${c.product?.product_id ?? ''}`))
                    return false;
                if (reason === 'search_intent')
                    return c.type === 'search_hook';
                if (productId)
                    return c.product?.product_id === productId || c.type === 'spotlight' || c.type === 'product_focus';
                return c.type === 'tip' || c.type === 'free_shipping' || c.type === 'season_time';
            });
            // Rich context + small budget for quality → try the LLM composer.
            const canCompose = (reason === 'product_focus' || reason === 'product_hover' || reason === 'search_intent')
                && s.spoken < 3;
            if (canCompose) {
                const text = await compose(signal, {
                    product_id: productId,
                    product_title: signal.productTitle,
                    keyword: signal.keyword,
                    engagement: s.state,
                    dwell_seconds: signal.dwellSeconds,
                    url: signal.url,
                });
                if (text) {
                    s.lastSpokenAt[reason] = Date.now();
                    show(text, match);
                    s.busy = false;
                    return;
                }
            }
            if (match) {
                speakCue(match);
                s.busy = false;
                return;
            }
            // Idle-only soft fallback (never nag while actively reading).
            if (s.state === 'idle' && optsRef.current.allowIdleChatter !== false)
                speakFallback();
            s.busy = false;
        }
        catch {
            s.busy = false;
        }
    }, [enabled, chatOpen, maxBudget, loadPool, compose, show, speakCue, speakFallback]);
    decideRef.current = decide;
    // When the current bubble clears, replay the latest pending signal.
    useEffect(() => {
        if (message)
            return;
        const p = pendingRef.current;
        if (!p)
            return;
        pendingRef.current = null;
        const t = window.setTimeout(() => { void decideRef.current(p); }, 900);
        return () => window.clearTimeout(t);
    }, [message]);
    /* ── Greeting once per load ──────────────────────────────── */
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        let alive = true;
        void loadPool().then(() => {
            if (!alive || chatOpen || messageRef.current)
                return;
            const s = stateRef.current;
            const greet = poolRef.current.find((c) => c.type === 'greet');
            if (greet && !s.seen.has('greet:')) {
                s.seen.add('greet:');
                s.lastSpokenAt.greet = Date.now();
                show(greet.text, greet);
            }
        });
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);
    /* ── Celebrations from pikuBus ───────────────────────────── */
    const celebrateRef = useRef(null);
    useEffect(() => {
        if (!enabled)
            return;
        const offAdd = pikuBus.on('cart-added', (p) => {
            celebrateRef.current = p.message
                ? `✅ ${p.message} 🎉`
                : '✅ Cart e add holo bhai! 🎉';
        });
        const offOrder = pikuBus.on('order-updated', (p) => {
            celebrateRef.current = p.message
                ? `✅ ${p.message} ✓` : null;
        });
        return () => { offAdd(); offOrder(); };
    }, [enabled]);
    useEffect(() => {
        if (chatOpen || !enabled)
            return;
        if (celebrateRef.current && !messageRef.current) {
            show(celebrateRef.current);
            celebrateRef.current = null;
        }
    }, [chatOpen, enabled, show]);
    /* ── Talking + blink animations ──────────────────────────── */
    useEffect(() => { setTalking(!!message); }, [message]);
    useEffect(() => {
        if (!enabled || chatOpen || typeof window === 'undefined')
            return;
        const iv = window.setInterval(() => {
            if (document.hidden || messageRef.current)
                return;
            if (Math.random() < 0.4) {
                setBlink(true);
                window.setTimeout(() => setBlink(false), 130);
            }
        }, 2600);
        return () => window.clearInterval(iv);
    }, [enabled, chatOpen]);
    return {
        message, chips, blink, talking,
        decide,
        speak: show,
        prefillRef,
        onSignal: decide,
    };
}
