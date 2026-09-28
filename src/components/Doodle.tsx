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
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface DoodleConfig {
  enabled?: boolean;
  /** Follow the cursor (desktop). Default FALSE — chef stays put. */
  followCursor?: boolean;
  /** Random idle chit-chat. Default false (product-focus only). */
  speakIdle?: boolean;
  /** Warm greeting once per page load. Default true. */
  greetOnce?: boolean;
  /** Nudge probability per tick when idle. Default 0.3. */
  talkChance?: number;
  /** Corner position. Default 'bottom-right'. */
  position?: 'bottom-left' | 'bottom-right';
  /** Pixel size of the chef. Default 48. */
  size?: number;
  /** Enable the occasional pan-stir action. Default true. */
  stir?: boolean;
  texts?: {
    product?: string[];
    general?: string[];
  };
}

interface Props {
  doodle: DoodleConfig;
  brandColor: string;
  /** Chat panel open → doodle hides. */
  chatOpen?: boolean;
  /** Open chat with optional prefill context. */
  onOpenChat: (prefill?: string) => void;
  /** Backend API base (for pre-generated blurbs + suggestions). */
  apiUrl?: string;
  /** Chat route prefix (default api/chat). */
  routePrefix?: string;
  /** Current chat session id (may be null for guests). */
  getSessionId?: () => string | null;
  /** Widget locale hint (en|bn|ja). */
  lang?: string;
}

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

function pickOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat, apiUrl, routePrefix = 'api/chat', getSessionId, lang }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [blink, setBlink] = useState(false);
  const [stir, setStir] = useState(false);
  const [hop, setHop] = useState(false);

  const prefillRef = useRef<string | undefined>(undefined);
  const messageRef = useRef<string | null>(null);
  messageRef.current = message;

  const size = Math.max(36, Math.min(72, doodle.size ?? 48));
  const pos = doodle.position ?? 'bottom-right';
  const enabled = !!doodle.enabled;

  const say = useCallback((line: string, prefill?: string) => {
    prefillRef.current = prefill;
    setMessage(line);
    window.setTimeout(() => setMessage(null), 8000);
  }, []);

  /* ── Blink + breathe + occasional stir/hop ───────────────────── */
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const iv = window.setInterval(() => {
      if (document.hidden) return;
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
  const readProduct = useCallback((): { key: string; title: string } | null => {
    if (typeof window === 'undefined') return null;
    const el = document.querySelector('[data-product-id]') as HTMLElement | null;
    if (el) {
      const title = (el.getAttribute('data-product-title') || '').trim().slice(0, 80);
      if (title) return { key: `p:${el.getAttribute('data-product-id')}`, title };
    }
    const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    const h1 = document.querySelector('h1') as HTMLElement | null;
    const detail = (og?.content || h1?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (detail && /add to cart|কার্ট|basket/i.test(document.body.innerText.slice(0, 4000))) {
      return { key: `p:${location.pathname}`, title: detail };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const talkChance = doodle.talkChance ?? 0.3;
    let greeted = false;

    const greet = window.setTimeout(() => {
      if (greeted || messageRef.current) return;
      greeted = true;
      say(pickOf(GENERAL_LINES));
    }, 7000);

    // Speak about products that stay in view (~2s)
    const seen = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || e.intersectionRatio < 0.5) continue;
        const el = e.target as HTMLElement;
        if (el.dataset.doodleTalked === '1') continue;
        const pid = el.getAttribute('data-product-id') || '';
        let title = (el.getAttribute('data-product-title') || '').trim();
        if (!title) {
          const a = el.querySelector('a') as HTMLAnchorElement | null;
          const t = (a?.textContent || '').replace(/\s+/g, ' ').trim();
          if (t && t.length <= 70) title = t;
        }
        if (!title) continue;
        const key = `p:${pid || title}`;
        if (seen.has(key)) continue;
        window.setTimeout(() => {
          if (document.hidden || messageRef.current) return;
          el.dataset.doodleTalked = '1';
          seen.add(key);
          const pool = doodle.texts?.product?.length ? doodle.texts.product : PRODUCT_LINES;
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
      window.clearTimeout(greet);
      window.clearInterval(attachIv);
      observer.disconnect();
    };
  }, [enabled, say, doodle.talkChance, doodle.texts?.product]);

  /* ── Pre-generated blurbs cache (instant hover) ──────────────── */
  const briefsRef = useRef<Map<string, string>>(new Map());
  const fetchBriefs = useCallback(async (ids: string[]) => {
    if (!apiUrl || ids.length === 0) return;
    const need = ids.filter((id) => id && !briefsRef.current.has(id)).slice(0, 40);
    if (need.length === 0) return;
    try {
      const res = await fetch(`${apiUrl}/${routePrefix}/products/briefs?ids=${need.join(',')}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      const data = (json?.data ?? {}) as Record<string, string>;
      Object.entries(data).forEach(([id, text]) => { if (text) briefsRef.current.set(id, text); });
    } catch { /* ignore */ }
  }, [apiUrl, routePrefix]);

  /* ── Proactive suggestions on home / shop / category screens ─── */
  useEffect(() => {
    if (!enabled || !apiUrl || typeof window === 'undefined') return;

    const isProductScreen = () => {
      const p = window.location.pathname.toLowerCase();
      if (p === '/' ) return true;
      if (p.startsWith('/shop')) return true;
      if (p.includes('categor')) return true;
      return false;
    };

    let alive = true;
    let idx = 0;
    let items: Array<{ title: string; text: string | null; price: number; in_stock: boolean; product_id: number; slug: string; kind?: string }> = [];
    let cartStale = 0;

    const load = async () => {
      if (!isProductScreen()) return;
      const sid = getSessionId?.() ?? '';
      try {
        const res = await fetch(`${apiUrl}/${routePrefix}/piku-suggestions?limit=6${sid ? `&session_id=${encodeURIComponent(sid)}` : ''}${lang ? `&lang=${encodeURIComponent(lang)}` : ''}`, {
          headers: { Accept: 'application/json' },
          credentials: 'include',
        });
        if (!res.ok) return;
        const json = await res.json();
        items = Array.isArray(json?.data) ? json.data : [];
        cartStale = Number(json?.cart_stale_hours ?? 0);
        if (items.length) void fetchBriefs(items.map((i) => String(i.product_id)));
      } catch { /* ignore */ }
    };

    void load();
    const reload = window.setInterval(load, 60000);
    const onNav = () => { idx = 0; void load(); };
    window.addEventListener('popstate', onNav);

    // Speak one suggestion at a time, spaced out, only on product screens.
    const speakIv = window.setInterval(() => {
      if (!alive || document.hidden || messageRef.current) return;
      if (!isProductScreen() || items.length === 0) return;
      const it = items[idx % items.length];
      idx++;
      const blurb = it.text || briefsRef.current.get(String(it.product_id)) || '';
      const price = `¥${Math.round(it.price).toLocaleString()}`;
      let line = it.in_stock
        ? (blurb ? `${blurb} (${price})` : `"${it.title}" — ${price}. Nite chan? 💬`)
        : `"${it.title}" ekhon stock e nei — khub shigroi abar ashe. ${blurb}`.trim();

      if (it.kind === 'cart_recovery' && cartStale >= 6) {
        // abandoned-cart recovery nudge — gentle, once before rotating on
        line = `Apnar cart e ki ki ache dekhe nini! Checkout ta hoy ni — ekhon kore niben? 💬 (${price})`;
      }
      say(line, `Ei product ta niye aro jante chai: ${it.title}`);
    }, 15000);

    return () => {
      alive = false;
      window.clearInterval(reload);
      window.clearInterval(speakIv);
      window.removeEventListener('popstate', onNav);
    };
  }, [enabled, apiUrl, routePrefix, getSessionId, lang, say, fetchBriefs]);

  /* ── Hover dwell (600ms) → instant cached line ───────────────── */
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
        const pool = doodle.texts?.product?.length ? doodle.texts.product : PRODUCT_LINES;
        if (hit.kind === 'p') {
          const pidKey = hit.key.replace(/^p:/, '');
          const cached = briefsRef.current.get(pidKey);
          const line = cached || pickOf(pool).replace('%s', hit.title);
          void fetchBriefs([pidKey]);
          say(line, `Ei product ta niye aro jante chai: ${hit.title}`);
        } else {
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
  }, [enabled, say, dpsTextDeps(doodle)]);

  if (!enabled || chatOpen) return null;

  const corner = pos === 'bottom-right' ? { right: 18, bottom: 96 } : { left: 18, bottom: 96 };

  return (
    <div className="gunma-chef-root" style={{ ...corner, ['--chef-size' as string]: `${size}px` } as React.CSSProperties}>
      {message && (
        <div className="gunma-chef-bubble" onClick={(e) => { e.stopPropagation(); const c = prefillRef.current; setMessage(null); onOpenChat(c); }}>
          {message}
        </div>
      )}
      <button
        className={`gunma-chef ${talking ? 'talking' : ''} ${stir ? 'stirring' : ''} ${hop ? 'hopping' : ''}`}
        style={{ '--chef-brand': brandColor } as React.CSSProperties}
        aria-label="Piku — click to chat"
        title="Piku — click to chat"
        onClick={() => { setMessage(null); onOpenChat(prefillRef.current); }}
      >
        <svg viewBox="0 0 120 140" className="gunma-chef-svg" aria-hidden="true">
          <defs>
            <radialGradient id="chefGlow" cx="50%" cy="52%" r="55%">
              <stop offset="0" stopColor={brandColor} stopOpacity="0.45" />
              <stop offset="0.62" stopColor={brandColor} stopOpacity="0.16" />
              <stop offset="1" stopColor={brandColor} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="chefCoat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#dfe9ee" />
            </linearGradient>
            <linearGradient id="chefHat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fffdf5" />
              <stop offset="1" stopColor="#ffe9a8" />
            </linearGradient>
            <linearGradient id="chefScarf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#34d399" />
              <stop offset="1" stopColor={brandColor} />
            </linearGradient>
            <linearGradient id="chefSkin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd9b0" />
              <stop offset="1" stopColor="#f6bd8a" />
            </linearGradient>
            <linearGradient id="chefPan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6b7175" />
              <stop offset="1" stopColor="#3a3f43" />
            </linearGradient>
          </defs>

          {/* soft brand glow so the chef pops on any background */}
          <circle className="chef-glow" cx="60" cy="74" r="60" fill="url(#chefGlow)" />

          {/* sparkles */}
          <g className="chef-sparkles" fill="#fbbf24">
            <path className="sp sp1" d="M26 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
            <path className="sp sp2" d="M94 46 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" />
            <path className="sp sp3" d="M88 18 l1.3 3.4 3.4 1.3 -3.4 1.3 -1.3 3.4 -1.3 -3.4 -3.4 -1.3 3.4 -1.3 z" />
          </g>

          {/* shadow */}
          <ellipse className="chef-shadow" cx="60" cy="134" rx="26" ry="5" fill="#000" opacity=".16" />

          <g className="chef-body">
            {/* legs */}
            <rect x="47" y="112" width="9" height="18" rx="4" fill="#334155" />
            <rect x="64" y="112" width="9" height="18" rx="4" fill="#334155" />
            <ellipse cx="51" cy="132" rx="8" ry="4" fill="#1e293b" />
            <ellipse cx="69" cy="132" rx="8" ry="4" fill="#1e293b" />

            {/* coat */}
            <path d="M38 66 q22 -10 44 0 l4 46 q-26 8 -52 0 z" fill="url(#chefCoat)" stroke="#cbd9e2" />
            {/* buttons */}
            <circle cx="60" cy="82" r="1.8" fill={brandColor} />
            <circle cx="60" cy="92" r="1.8" fill={brandColor} />
            {/* scarf / neckerchief */}
            <path d="M48 62 q12 9 24 0 l-4 12 q-8 6 -16 0 z" fill="url(#chefScarf)" />

            {/* left arm */}
            <g className="chef-arm-left">
              <rect x="33" y="70" width="9" height="26" rx="4" fill="url(#chefCoat)" stroke="#cbd9e2" />
              <circle cx="37" cy="98" r="5.4" fill="url(#chefSkin)" />
            </g>

            {/* right arm + pan (stirs) */}
            <g className="chef-arm-right">
              <rect x="78" y="70" width="9" height="26" rx="4" fill="url(#chefCoat)" stroke="#cbd9e2" />
              <circle cx="83" cy="98" r="5.4" fill="url(#chefSkin)" />
              <g className="chef-pan">
                <rect x="80" y="95" width="22" height="3" rx="1.5" fill="#aab4bb" />
                <ellipse cx="104" cy="96" rx="12" ry="5.5" fill="url(#chefPan)" />
                <ellipse cx="104" cy="95" rx="9" ry="3.4" fill="#8b949a" />
                <ellipse className="chef-steam" cx="104" cy="90" rx="3" ry="2" fill="#ffffff" opacity=".6" />
              </g>
            </g>

            {/* head */}
            <g className="chef-head">
              <circle cx="60" cy="46" r="20.5" fill="url(#chefSkin)" />
              {/* ears */}
              <circle cx="40" cy="47" r="3" fill="url(#chefSkin)" />
              <circle cx="80" cy="47" r="3" fill="url(#chefSkin)" />
              {/* eyes (bigger, glossy) */}
              <circle className={blink ? 'chef-eye blink' : 'chef-eye'} cx="53" cy="45" r="3.2" fill="#1f2937" />
              <circle className={blink ? 'chef-eye blink' : 'chef-eye'} cx="67" cy="45" r="3.2" fill="#1f2937" />
              <circle cx="54.2" cy="43.6" r="1.1" fill="#fff" />
              <circle cx="68.2" cy="43.6" r="1.1" fill="#fff" />
              {/* eyebrows */}
              <path d="M49.5 39.5 q3.5 -2 7 0" stroke="#6b4a2f" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              <path d="M63.5 39.5 q3.5 -2 7 0" stroke="#6b4a2f" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              {/* blush */}
              <circle cx="47" cy="52" r="3.4" fill="#ff9d9d" opacity=".8" />
              <circle cx="73" cy="52" r="3.4" fill="#ff9d9d" opacity=".8" />
              {/* mouth */}
              {talking ? (
                <ellipse className="chef-mouth" cx="60" cy="54.5" rx="4.6" ry="3.6" fill="#8c3b3b" />
              ) : (
                <path d="M54.5 53 q5.5 5 11 0" stroke="#5b3a24" strokeWidth="1.9" fill="none" strokeLinecap="round" />
              )}
              {/* chef hat (warm, golden band) */}
              <g className="chef-hat">
                <ellipse cx="60" cy="29" rx="24" ry="7.5" fill="url(#chefHat)" stroke="#e6c268" />
                <rect x="45" y="12" width="30" height="18" rx="9" fill="url(#chefHat)" stroke="#e6c268" />
                <rect x="45" y="26" width="30" height="5" rx="2.5" fill={brandColor} opacity=".85" />
                <path className="chef-hat-puff" d="M40 20 q-6 -8 4 -10 q2 -8 10 -5 q6 -6 12 0 q8 -3 10 5 q10 2 4 10" fill="url(#chefHat)" stroke="#e6c268" />
              </g>
            </g>
          </g>
        </svg>
      </button>
    </div>
  );
}

/** Stable dep list for the doodle texts. */
function dpsTextDeps(d: DoodleConfig): string {
  return JSON.stringify(d.texts || {});
}
