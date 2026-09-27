/**
 * Piku Doodle v3 — pointer-following companion.
 *
 * Desktop (fine pointer): the mascot chases the customer's cursor with a
 * springy lerp — movements are applied DIRECTLY to the DOM via transform in
 * one rAF loop (zero React re-renders ⇒ 60fps, lightning fast).
 * Touch devices / coarse pointers: falls back to a calm bottom-band patrol.
 * Bubbles keep product-aware lines; click opens Piku chat (with context).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface DoodleConfig {
  enabled?: boolean;
  /** Follow the customer's pointer (desktop only). Default true. */
  followCursor?: boolean;
  /** Allow random chit-chat while idle. Default FALSE (product-focus only). */
  speakIdle?: boolean;
  /** Pointer mode: nudges should still occur. Default: 0.18 bubble chance on long idle. */
  talkChance?: number;
  texts?: {
    product?: string[];
    general?: string[];
  };
}

interface Props {
  doodle: DoodleConfig;
  brandColor: string;
  /** Chat panel open state — doodle hides itself while chatting. */
  chatOpen?: boolean;
  /** Open chat; carries an optional prefill context message. */
  onOpenChat: (prefill?: string) => void;
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

export function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [blink, setBlink] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<{ x: number; y: number } | null>(null);   // px, viewport
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const walkingUntilRef = useRef(0);
  const lastProduct = useRef('');
  const prefillRef = useRef<string | undefined>(undefined);
  // instant-speech cache: key → ready-made line (composed once, reused forever)
  const speechCache = useRef<Map<string, string>>(new Map());
  const messageRef = useRef<string | null>(null);
  messageRef.current = message;
  const followRef = useRef<boolean>(doodle.followCursor ?? true);
  followRef.current = doodle.followCursor ?? true;

  const renderNow = () => {
    const el = rootRef.current;
    const p = posRef.current;
    if (el && p) {
      el.style.transform = `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0)`;
    }
  };

  /* ── Instant cached speech ────────────────────────────────────── */
  const speakCached = useCallback((key: string, compose: () => string) => {
    let line = speechCache.current.get(key);
    if (!line) {
      line = compose();
      speechCache.current.set(key, line);
    }
    prefillRef.current = key.startsWith('p:')
      ? `Ei product ta niye aro jante chai: ${line.replace(/^"|"$/g, '')}`
      : undefined;
    setMessage(line);
    window.setTimeout(() => setMessage(null), 8000);
  }, []);

  /* ── Hover-speak: dwell 900ms on a product/category ⇒ instantly talks ── */
  useEffect(() => {
    if (!doodle.enabled || typeof window === 'undefined') return;
    let dwell: number | undefined;
    let lastHoverKey = '';

    const resolve = (el: HTMLElement): { kind: 'p' | 'c'; key: string; title: string } | null => {
      // 1) product cards — data attributes the storefront renders
      const prodEl = el.closest('[data-product-id],[data-product-title]') as HTMLElement | null;
      if (prodEl) {
        const pid = prodEl.getAttribute('data-product-id') ?? '';
        let title = (prodEl.getAttribute('data-product-title') || '').trim();
        if (!title) {
          // short anchor text only (never the whole card blob)
          const a = prodEl.querySelector('a') as HTMLAnchorElement | null;
          const t = (a?.textContent || '').replace(/\s+/g, ' ').trim();
          if (t && t.length <= 70) title = t;
        }
        if (title) {
          return { kind: 'p', key: `p:${pid || title}`, title: title.slice(0, 80) };
        }
      }
      // 2) category links / menu items
      const catEl = el.closest('[data-category]') as HTMLElement | null
        ?? el.closest('a[href*="categor"]') as HTMLElement | null;
      if (catEl) {
        const title = (catEl.getAttribute('data-category') || catEl.textContent || '')
          .replace(/\s+/g, ' ').trim().slice(0, 60);
        if (title && title.length <= 60) return { kind: 'c', key: `c:${title}`, title };
      }
      return null;
    };

    const onOver = (e: PointerEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      const hit = resolve(e.target);
      if (!hit || hit.key === lastHoverKey) {
        if (!hit && dwell) { window.clearTimeout(dwell); dwell = undefined; }
        return;
      }
      lastHoverKey = hit.key;
      window.clearTimeout(dwell);
      dwell = window.setTimeout(() => {
        speakCached(hit.key, () =>
          hit.kind === 'p'
            ? (doodle.texts?.product?.length
                ? pickOf(doodle.texts.product).replace('%s', hit.title)
                : pickOf(PRODUCT_LINES).replace('%s', hit.title))
            : `"${hit.title}" category te onek darun jinish ache — dekhen! 💬`
        );
      }, 900);
    };
    const onOut = () => { window.clearTimeout(dwell); dwell = undefined; };

    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerleave', onOut);
    return () => {
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerleave', onOut);
      window.clearTimeout(dwell);
    };
  }, [doodle.enabled, doodle.texts?.product, speakCached]);

  /* ── Pointer-follow loop: one rAF, direct DOM writes ─────────── */
  useEffect(() => {
    if (!doodle.enabled || typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) followRef.current = false;

    // initial anchor: bottom-right-ish; set instantly so no jump
    const start = { x: window.innerWidth * 0.78, y: window.innerHeight * 0.72 };
    posRef.current = start;
    targetRef.current = start;
    renderNow();

    const onMove = (e: PointerEvent) => {
      if (!followRef.current) return;
      // mascot hovers a bit ABOVE-RIGHT of the pointer, never under it
      targetRef.current = {
        x: Math.min(window.innerWidth - 84, Math.max(4, e.clientX + 6)),
        y: Math.min(window.innerHeight - 40, Math.max(4, e.clientY - 86)),
      };
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const loop = () => {
      const p = posRef.current!;
      const t = targetRef.current;
      if (t) {
        const dx = t.x - p.x;
        const dy = t.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1.2) {
          // springy chase — arrives fast, feels alive
          const k = dist > 90 ? 0.16 : 0.09;
          p.x += dx * k;
          p.y += dy * k;
          walkingUntilRef.current = Date.now() + 260;
        }
      }
      const isWalking = Date.now() < walkingUntilRef.current;
      const elR = rootRef.current;
      if (elR && elR.dataset.walking !== String(isWalking)) {
        elR.dataset.walking = String(isWalking);
      }
      renderNow();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [doodle.enabled]);

  /* ── Behaviour: talks, blinks, product awareness ─────────────── */
  const readProduct = useCallback((): { key: string; title: string } | null => {
    if (typeof window === 'undefined') return null;
    // 1) product cards rendered by the storefront (data attrs we add)
    const el = document.querySelector('[data-product-id]') as HTMLElement | null;
    if (el) {
      const title = (el.getAttribute('data-product-title') || '').trim().slice(0, 80);
      if (title) return { key: `p:${el.getAttribute('data-product-id')}`, title };
    }
    // 2) product DETAIL page — use social title / heading
    const og = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    const h1 = document.querySelector('h1') as HTMLElement | null;
    const detailTitle = (og?.content || h1?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (detailTitle && /add to cart|কার্ট|basket/i.test(document.body.innerText.slice(0, 4000))) {
      return { key: `p:${location.pathname}`, title: detailTitle };
    }
    return null;
  }, []);

  useEffect(() => {
    if (!doodle.enabled || typeof window === 'undefined') return;
    const talkChance = doodle.talkChance ?? 0.3;

    const iv = window.setInterval(() => {
      if (document.hidden || messageRef.current) return;

      if (Math.random() < 0.35) {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 130);
      }

      const p = readProduct();
      if (p && p.key !== lastProduct.current) {
        lastProduct.current = p.key;
        if (Math.random() < 0.65) {
          const pool = doodle.texts?.product?.length ? doodle.texts.product : PRODUCT_LINES;
          const line = pickOf(pool).replace('%s', p.title);
          prefillRef.current = `Ei product ta niye aro jante chai: ${p.title}`;
          setMessage(line);
          window.setTimeout(() => setMessage(null), 8000);
          return;
        }
      }

      if (doodle.speakIdle && Math.random() < talkChance) {
        prefillRef.current = undefined;
        setMessage(pickOf(doodle.texts?.general?.length ? doodle.texts.general : GENERAL_LINES));
        window.setTimeout(() => setMessage(null), 8000);
      }
    }, 4500);

    return () => window.clearInterval(iv);
  }, [doodle.enabled, doodle.texts?.product, doodle.texts?.general, doodle.talkChance, readProduct]);

  if (!doodle.enabled || chatOpen) return null;

  return (
    <div ref={rootRef} className="gunma-doodle-root" style={{ left: 0, top: 0 }}>
      {message && (
        <div
          className="gunma-doodle-bubble"
          onClick={(e) => {
            e.stopPropagation();
            const ctx = prefillRef.current;
            setMessage(null);
            onOpenChat(ctx);
          }}
        >
          {message}
        </div>
      )}
      <button
        className={`gunma-doodle-float ${message ? 'talking' : ''}`}
        style={{ '--doodle-ring': brandColor } as React.CSSProperties}
        aria-label="Piku — click to chat"
        title="Piku — click to chat"
        onClick={() => { setMessage(null); onOpenChat(prefillRef.current); }}
      >
        <svg viewBox="0 0 120 120" className="gunma-doodle-svg" aria-hidden="true">
          <defs>
            <linearGradient id="pdBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={brandColor} />
              <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
            {/* warm honey chef-hat — no more white-on-white */}
            <linearGradient id="pdHat" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffefc2" />
              <stop offset="1" stopColor="#ffd964" />
            </linearGradient>
          </defs>
          {/* hat */}
          <ellipse cx="60" cy="26" rx="26" ry="9" fill="#f7c93c" stroke="#e0a516" />
          <rect x="42" y="10" width="36" height="18" rx="9" fill="url(#pdHat)" stroke="#e0a516" />
          <ellipse cx="52" cy="16" rx="7" ry="4" fill="#fff7d6" opacity=".85" />
          <path d="M46 21 h28" stroke="#c99a17" strokeWidth="1.4" />
          {/* bowl body */}
          <path d="M22 66 a38 34 0 0 0 76 0 z" fill="url(#pdBody)" />
          <ellipse cx="60" cy="62" rx="30" ry="12" fill="#ffffff" />
          <ellipse cx="46" cy="56" rx="12" ry="7" fill="#ffffff" />
          <ellipse cx="72" cy="55" rx="12" ry="7" fill="#ffffff" />
          {/* face */}
          <circle className="gunma-doodle-eye" cx="48" cy="76" r="4.6" fill="#26211d" />
          <circle className="gunma-doodle-eye" cx="72" cy="76" r="4.6" fill="#26211d" />
          <circle cx="49.6" cy="74.4" r="1.4" fill="#fff" />
          <circle cx="73.6" cy="74.4" r="1.4" fill="#fff" />
          <circle cx="40" cy="83" r="3.4" fill="#ffb7b0" opacity=".8" />
          <circle cx="80" cy="83" r="3.4" fill="#ffb7b0" opacity=".8" />
          <path d="M54 86 q6 5 12 0" stroke="#26211d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          {/* hand wave */}
          <g className="hand-wave">
            <ellipse cx="98" cy="58" rx="6" ry="9" fill="url(#pdBody)" stroke="#0d9488" />
          </g>
          <ellipse cx="22" cy="58" rx="6" ry="9" fill="url(#pdBody)" stroke="#0d9488" />
          {/* feet */}
          <ellipse cx="48" cy="106" rx="9" ry="5" fill="#26211d" />
          <ellipse cx="72" cy="106" rx="9" ry="5" fill="#26211d" />
        </svg>
      </button>
    </div>
  );
}
