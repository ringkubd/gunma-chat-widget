/**
 * Piku Doodle v2 — cute chef buddy that patrols the page.
 *
 * Design goals: smooth predictable steps (no teleports or zig-zags),
 * work only when the tab is visible, GPU-friendly transforms,
 * friendly product/recipe messages, click opens chat.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface DoodleConfig {
  enabled?: boolean;
  /** ms between behaviour ticks. Default 5000. */
  tickMs?: number;
  /** 0..1 chance per tick to talk. Default 0.35. */
  talkChance?: number;
  /** Vertical band (vh) where the buddy patrols. Default [64, 84]. */
  band?: [number, number];
  texts?: {
    /** Lines with %s = product title shown on product pages. */
    product?: string[];
    /** Everyday lines: recipes, perks, greetings. */
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
  '"%s" dekhchen! Eta darun choice — recipe/ingredient lagle bolen 💬',
  '"%s" khub popular — ekhane fresh ache, add kore dibo naki?',
  'Ranna korle "%s" diye darun hoy — banto bolen!',
];

const GENERAL_LINES = [
  'Aaj ki ranna korben? Recipe lagbe bolen 🍳',
  '¥10,000 order korle delivery FREE!',
  'Fresh mangsho-mach sob dhukche — bolo ki lagbe 😊',
  'Chaile ek sathe "add all" — sabda kaj 💬',
  'Haleem ar paya darun chole ashe 😋',
  'Points ache apnar? Kamlagbe boloji!',
  'Cha ek cup? Na garam garam biryani? 🍚',
];

function pickOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 82, y: 80 });
  const [facing, setFacing] = useState<'left' | 'right'>('left');
  const [walking, setWalking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [blink, setBlink] = useState(false);
  const posRef = useRef(pos);
  posRef.current = pos;
  const msgRef = useRef<string | null>(null);
  msgRef.current = message;
  const lastProduct = useRef('');
  const prefillRef = useRef<string | undefined>(undefined);

  const visible = () => typeof document === 'undefined' || !document.hidden;

  const readProduct = useCallback((): { key: string; title: string } | null => {
    if (typeof window === 'undefined') return null;
    const el = document.querySelector('[data-product-id]') as HTMLElement | null;
    if (!el) return null;
    const title = (el.getAttribute('data-product-title') || el.textContent || '').trim().slice(0, 70);
    if (!title) return null;
    return { key: `${el.getAttribute('data-product-id')}|${title}`, title };
  }, []);

  useEffect(() => {
    if (!doodle.enabled || typeof window === 'undefined') return;
    const tick = doodle.tickMs ?? 8000;
    const talkChance = doodle.talkChance ?? 0.22;
    const bandMin = doodle.band?.[0] ?? 64;
    const bandMax = doodle.band?.[1] ?? 84;

    const step = () => {
      if (!visible()) return; // respect hidden tab — no CPU burn

      // blink sometimes
      if (Math.random() < 0.3) {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
      }

      // product present? speak once per product, then idle silently
      const p = readProduct();
      if (p && p.key !== lastProduct.current) {
        lastProduct.current = p.key;
        if (Math.random() < 0.6) {
          const pool = doodle.texts?.product?.length ? doodle.texts.product : PRODUCT_LINES;
          const line = Math.random() < 0.5 ? pickOf(pool).replace('%s', p.title) : pickOf(GENERAL_LINES);
          prefillRef.current = line.startsWith('"') ? `Ei product ta niye aro jante chai: ${p.title}` : undefined;
          setMessage(line);
          window.setTimeout(() => setMessage(null), 8000);
          return;
        }
      }

      if (!msgRef.current && Math.random() < talkChance) {
        prefillRef.current = undefined;
        setMessage(pickOf(doodle.texts?.general?.length ? doodle.texts.general : GENERAL_LINES));
        window.setTimeout(() => setMessage(null), 8000);
      }

      // Patrol step: small comfortable distance, mostly along the band
      const dirX = Math.random() < 0.5 ? -1 : 1;
      const dx = dirX * (8 + Math.random() * 10); // 8%–18% of viewport
      let x = posRef.current.x + dx;
      if (x < 6 || x > 88) x = posRef.current.x - dx * 1.2; // bounce back smoothly
      x = Math.min(88, Math.max(6, x));
      const y = Math.min(bandMax, Math.max(bandMin, posRef.current.y + (Math.random() * 10 - 5)));

      setFacing(dirX < 0 || x < posRef.current.x ? 'right' : 'left');
      setWalking(true);
      setPos({ x, y });
      window.setTimeout(() => setWalking(false), 1400);
    };

    const iv = window.setInterval(step, tick);
    return () => window.clearInterval(iv);
  }, [doodle.enabled, doodle.tickMs, doodle.talkChance, doodle.band, doodle.texts?.product, doodle.texts?.general, readProduct]);

  if (!doodle.enabled || chatOpen) return null;

  const style = {
    '--dx': `${pos.x}vw`,
    '--dy': `${pos.y}vh`,
  } as React.CSSProperties;

  return (
    <div className={`gunma-doodle-root ${facing === 'left' ? 'flip' : ''}`} style={style}>
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
        className={`gunma-doodle-float ${walking ? 'walking' : ''} ${message ? 'talking' : ''}`}
        aria-label="Piku — click to chat"
        title="Piku — click to chat"
        onClick={() => { setMessage(null); onOpenChat(); }}
      >
        <svg viewBox="0 0 120 120" className="gunma-doodle-svg" aria-hidden="true">
          <defs>
            <linearGradient id="pdBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={brandColor} />
              <stop offset="1" stopColor="#0d9488" />
            </linearGradient>
          </defs>

          {/* hat */}
          <ellipse cx="60" cy="26" rx="26" ry="9" fill="#ffffff" stroke="#e5e7eb" />
          <rect x="42" y="8" width="36" height="20" rx="10" fill="#ffffff" stroke="#e5e7eb" />
          <path d="M46 20 h28" stroke="#e5e7eb" strokeWidth="1.4" />

          {/* bowl body */}
          <path d="M22 66 a38 34 0 0 0 76 0 z" fill="url(#pdBody)" />
          {/* rice mound */}
          <ellipse cx="60" cy="62" rx="30" ry="12" fill="#ffffff" />
          <ellipse cx="46" cy="56" rx="12" ry="7" fill="#ffffff" />
          <ellipse cx="72" cy="55" rx="12" ry="7" fill="#ffffff" />

          {/* face */}
          <g>
            <circle className="gunma-doodle-eye" cx="48" cy="76" r="4.6" fill="#26211d" />
            <circle className="gunma-doodle-eye" cx="72" cy="76" r="4.6" fill="#26211d" />
            <circle cx="49.6" cy="74.4" r="1.4" fill="#fff" />
            <circle cx="73.6" cy="74.4" r="1.4" fill="#fff" />
            <circle cx="40" cy="83" r="3.4" fill="#ffb7b0" opacity=".8" />
            <circle cx="80" cy="83" r="3.4" fill="#ffb7b0" opacity=".8" />
            <path d="M54 86 q6 5 12 0" stroke="#26211d" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </g>

          {/* waving hand */}
          <g className="hand-wave">
            <ellipse cx="98" cy="58" rx="6" ry="9" fill="url(#pdBody)" stroke="#0d9488" />
          </g>
          {/* other hand */}
          <ellipse cx="22" cy="58" rx="6" ry="9" fill="url(#pdBody)" stroke="#0d9488" />

          {/* feet */}
          <ellipse className="foot-l" cx="48" cy="106" rx="9" ry="5" fill="#26211d" />
          <ellipse className="foot-r" cx="72" cy="106" rx="9" ry="5" fill="#26211d" />
        </svg>
      </button>
    </div>
  );
}
