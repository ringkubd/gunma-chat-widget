/**
 * usePikuSpeech — the doodle speech engine, now driving the chat widget's
 * own floating bubble (the bubble icon IS Piku).
 *
 * - Tabled pool of typed messages (server pre-composed per language, with
 *   LIVE price/stock) fetched from /api/chat/piku-messages
 * - First message at startDelayMs, then minGapMs apart, max maxMessages
 *   per session (sessionStorage counters; non-repeating types)
 * - Reacts to chat events via pikuBus: cart-added / order-updated /
 *   chat-closed → celebration bubble right after the chat closes
 * - Hover on product cards / categories → instant (AI-blurb cached) lines
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pikuBus from '../lib/pikuBus';

export interface PikuChip { label: string; prefill: string }

interface PoolMessage {
  type: string;
  text: string;
  product?: { product_id: number; title: string };
  chips?: Array<{ label: string; prefill: string }>;
}

interface UsePikuSpeechOpts {
  enabled: boolean;
  chatOpen: boolean;
  maxMessages?: number;
  startDelayMs?: number;
  minGapMs?: number;
  apiUrl?: string;
  routePrefix?: string;
  lang?: string;
  getSessionId?: () => string | null;
  getToken?: () => string | null;
  getVisitorId?: () => string | null;
}

const PRODUCT_LINES = [
  '"%s" dekhchen! Recipe ba ingredient lagle bolen 💬',
  '"%s" khub popular bhai — cart e add kori naki?',
  'Ranna korle "%s" ekdom perfect combo!',
  '"%s" fresh ache — ekhoni nite paren!',
];

export function usePikuSpeech(opts: UsePikuSpeechOpts) {
  const enabled = !!opts.enabled;
  const chatOpen = !!opts.chatOpen;
  const maxMsgs = opts.maxMessages ?? 5;
  const startDelay = opts.startDelayMs ?? 2500;
  const minGap = Math.max(8000, opts.minGapMs ?? 45000);
  const routePrefix = opts.routePrefix ?? 'api/chat';
  const getTokenRef = useRef(opts.getToken);
  getTokenRef.current = opts.getToken;
  const getVisitorIdRef = useRef(opts.getVisitorId);
  getVisitorIdRef.current = opts.getVisitorId;
  const buildPikuHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    try {
      const token = getTokenRef.current?.() ?? null;
      if (token) headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const vid = getVisitorIdRef.current?.() ?? null;
      if (vid) headers['X-Visitor-Id'] = vid;
    } catch { /* host errors never break Piku */ }
    return headers;
  };
  const lang = opts.lang;

  const [message, setMessage] = useState<string | null>(null);
  const [chips, setChips] = useState<PikuChip[]>([]);
  const [blink, setBlink] = useState(false);
  const [talking, setTalking] = useState(false);

  const prefillRef = useRef<string | undefined>(undefined);
  const messageRef = useRef<string | null>(null);
  messageRef.current = message;

  const getSessionIdRef = useRef(opts.getSessionId);
  getSessionIdRef.current = opts.getSessionId;
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;

  const say = useCallback((line: string, prefill?: string) => {
    prefillRef.current = prefill ?? undefined;
    setMessage(line);
    window.setTimeout(() => setMessage(null), 9000);
  }, []);

  /* ── Blink loop (applies to the robot art on the bubble) ─────── */
  useEffect(() => {
    if (!enabled || chatOpen || typeof window === 'undefined') return;
    const iv = window.setInterval(() => {
      if (document.hidden || messageRef.current) return;
      if (Math.random() < 0.4) {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 130);
      }
    }, 2600);
    return () => window.clearInterval(iv);
  }, [enabled, chatOpen]);

  /* ── talking state drives the open mouth on the robot art ───── */
  useEffect(() => {
    setTalking(!!message); // wave/chest/mic pulse handled by CSS when talking
  }, [message]);

  /* ── Direct relation: chat e je holo, bubble celebrate kore ── */
  const celebrateRef = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const offAdd = pikuBus.on('cart-added', (p) => {
      celebrateRef.current = (p as { message?: string }).message
        ? `✅ ${(p as { message?: string }).message} 🎉`
        : '✅ Cart e add holo bhai! 🎉';
    });
    const offOrder = pikuBus.on('order-updated', (p) => {
      celebrateRef.current = (p as { message?: string }).message
        ? `✅ ${(p as { message?: string }).message} ✓`
        : null;
    });
    return () => { offAdd(); offOrder(); };
  }, [enabled]);

  useEffect(() => {
    // Chat bondho → doodle (bubble) phire eshe celebrate kore
    if (chatOpen || !enabled) return;
    if (celebrateRef.current && !messageRef.current) {
      say(celebrateRef.current);
      celebrateRef.current = null;
    }
  }, [chatOpen, enabled, say]);

  /* ── Pre-generated blurbs cache (instant hover) ─────────────── */
  const briefsRef = useRef<Map<string, string>>(new Map());
  const fetchBriefs = useCallback(async (ids: string[]) => {
    if (!opts.apiUrl || ids.length === 0) return;
    const need = ids.filter((id) => id && !briefsRef.current.has(id)).slice(0, 40);
    if (need.length === 0) return;
    try {
      const res = await fetch(`${opts.apiUrl}/${routePrefix}/products/briefs?ids=${need.join(',')}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      const data = (json?.data ?? {}) as Record<string, string>;
      Object.entries(data).forEach(([id, text]) => { if (text) briefsRef.current.set(id, text); });
    } catch { /* ignore */ }
  }, [opts.apiUrl, routePrefix]);

  /* ── Message pool (typed, varied intents) — one speech scheduler ── */
  useEffect(() => {
    if (!enabled || chatOpen || !opts.apiUrl || typeof window === 'undefined') return;

    let alive = true;
    let pool: PoolMessage[] = [];
    let timer: number | undefined;
    const sessionKey = (() => { try { return getSessionIdRef.current?.() ?? 'anon'; } catch { return 'anon'; } })();
    const typesKey = `pk_types_${sessionKey}`;

    const load = async () => {
      const sid = getSessionIdRef.current?.() ?? '';
      try {
        const res = await fetch(`${optsRef.current.apiUrl!}/${routePrefix}/piku-messages?limit=8${sid ? `&session_id=${encodeURIComponent(sid)}` : ''}${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`, {
          headers: buildPikuHeaders(),
          credentials: 'include',
        });
        if (!res.ok) return;
        const json = await res.json();
        const items = Array.isArray(json?.data) ? json.data : [];
        let shownTypes: string[] = [];
        try { shownTypes = JSON.parse(sessionStorage.getItem(typesKey) || '[]'); } catch { shownTypes = []; }
        const unseen = items.filter((m: PoolMessage) => !shownTypes.includes(m.type));
        const rest = items.filter((m: PoolMessage) => shownTypes.includes(m.type));
        pool = [...unseen, ...rest];
      } catch { /* ignore */ }
    };

    const markShown = (type: string) => {
      try {
        const arr: string[] = JSON.parse(sessionStorage.getItem(typesKey) || '[]');
        arr.push(type);
        sessionStorage.setItem(typesKey, JSON.stringify(arr.slice(-6)));
      } catch {}
    };

    // speak exactly one message now, then schedule the next
    const spokenRef = { current: 0 };
    const speakOnce = () => {
      if (!alive || document.hidden || messageRef.current) { schedule(6000); return; }
      if (spokenRef.current >= maxMsgs) return; // per load cap

      if (pool.length === 0) { void load().then(() => schedule(Math.max(12000, minGap / 2))); return; }

      const m = pool.shift()!;
      sessionMark(m);
      spokenRef.current++;
      schedule(minGap);

      prefillRef.current = m.chips?.[0]?.prefill ?? undefined;
      setChips(m.chips ?? []);
      setMessage(m.text);
      window.setTimeout(() => { if (messageRef.current === m.text) setChips([]); }, 9000);
    };

    // mark type shown (helper split for clarity)
    function sessionMark(_m: PoolMessage) { markShown(_m.type); }

    const schedule = (ms: number) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => { void speakOnce(); }, ms);
    };

    void load().then(() => schedule(startDelay));

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [enabled, chatOpen, maxMsgs, startDelay, minGap, opts.apiUrl, routePrefix, lang, say, fetchBriefs]);

  /* ── Hover dwell on product / category cards (instant cached line) ── */
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    let dwell: number | undefined;
    let lastKey = '';

    const resolve = (el: HTMLElement) => {
      const prodEl = el.closest('[data-product-id],[data-product-title]') as HTMLElement | null;
      if (prodEl) {
        const pid = prodEl.getAttribute('data-product-id') ?? '';
        let title = (prodEl.getAttribute('data-product-title') || '').trim();
        if (!title) {
          const a = prodEl.querySelector('a') as HTMLAnchorElement | null;
          const t = (a?.textContent || '').replace(/\s+/g, ' ').trim();
          if (t && t.length <= 70) title = t;
        }
        if (title) return { kind: 'p' as const, key: `p:${pid || title}`, title };
      }
      const cat = el.closest('[data-category]') as HTMLElement | null
        ?? el.closest('a[href*="categor"]') as HTMLElement | null;
      if (cat) {
        const title = (cat.getAttribute('data-category') || cat.textContent || '')
          .replace(/\s+/g, ' ').trim().slice(0, 60);
        if (title && title.length <= 60) return { kind: 'c' as const, key: `c:${title}`, title };
      }
      return null;
    };

    const onOver = (e: PointerEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const hit = resolve(e.target);
      if (!hit) { if (dwell) { window.clearTimeout(dwell); dwell = undefined; } return; }
      if (hit.key === lastKey) return;
      lastKey = hit.key;
      window.clearTimeout(dwell);
      dwell = window.setTimeout(() => {
        if (document.hidden || messageRef.current) return;
        if (hit.kind === 'p') {
          const pidKey = hit.key.replace(/^p:/, '');
          void fetchBriefs([pidKey]);
          say(
            briefsRef.current.get(pidKey) || `"${hit.title}" dekhchen! Recipe ba ingredient lagle bolen 💬`,
            `Ei product ta niye aro jante chai: ${hit.title}`,
          );
        } else {
          say(`"${hit.title}" ajke darun jinish ache — dekhe nin! 💬`);
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
  }, [enabled, say, fetchBriefs]);

  /** Open the chat with the pending prefill (chip/chef click) */
  return { message, chips, blink, talking, openWithPrefill: (onOpen: (prefill?: string) => void) => { onOpen(prefillRef.current); }, prefillRef, fetchBriefs } as const;
}
