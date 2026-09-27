/**
 * Piku Doodle — animated floating companion for the storefront.
 *
 * v1: A cute walking rice-bowl buddy. Wander around the page, blink,
 * stop sometimes and SAY things (product-aware suggestions, recipe hooks,
 * shop perks), click → open Piku chat. Opt-in via config.doodle.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface DoodleConfig {
  enabled?: boolean;
  /** Seconds between doodle "think ticks". Default 4. */
  tickMs?: number;
  /** How often the doodle is allowed to speak, as fraction (0..1). Default 0.55 */
  talkChance?: number;
  texts?: {
    /** Lines shown when a product is on screen ("%s" = product title). */
    product?: string[];
    /** General chat-worthy lines (recipes, offers, greetings). */
    general?: string[];
  };
}

interface Props {
  doodle: DoodleConfig;
  brandColor: string;
  onOpenChat: () => void;
}

const PRODUCT_LINES = [
  '"%s" dekhchen! Eita nite paren — recipe lagle bolen.',
  'Ei "%s" khub popular bhai — cart e add korbo naki?',
  '"%s" diye ekdom solid ranna hoy! Ingredient lagbe bolen.',
  'Dekhun "%s" — ajke fresh stock e ache!',
];

const GENERAL_LINES = [
  'Amar kache fresh beef, chicken, mach, masala sob ache 😊',
  'Aaj ki ranna korben? Biryani, tehari, karahi — recipe dao bolen!',
  '¥10,000+ order korle delivery FREE (Okinawa chhore)!',
  'Chaile ingredients ek shathe "add all" — eksecant kaj 💬',
  'Points jome ache? Use korar way jane debo!',
  'Hunger lagchen? Haleem ar paya te hon vore jay.',
  'Ektu moja kore bolun — ki khawa jai bhabchen? 🍚',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function productText(title: string, custom?: string[]): string {
  const pool = (custom && custom.length > 0 ? custom : PRODUCT_LINES);
  return pick(pool).replace('%s', title);
}

export function PikuDoodle({ doodle, brandColor, onOpenChat }: Props) {
  const [pos, setPos] = useState({ x: 82, y: 70 });         // viewport %
  const [facing, setFacing] = useState<'left' | 'right'>('left');
  const [walking, setWalking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [blink, setBlink] = useState(false);
  const lastProduct = useRef<string>('');
  const posRef = useRef(pos);
  posRef.current = pos;

  const readProduct = useCallback((): { key: string; title: string } | null => {
    if (typeof window === 'undefined') return null;
    const el = document.querySelector('[data-product-id]') as HTMLElement | null;
    if (!el) return null;
    const title = (el.getAttribute('data-product-title') || el.textContent || '').trim().slice(0, 70);
    if (!title) return null;
    return { key: `${el.getAttribute('data-product-id')}|${title}`, title };
  }, []);

  const say = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 7000);
  }, []);

  useEffect(() => {
    if (!doodle.enabled || typeof window === 'undefined') return;
    const tickMs = doodle.tickMs ?? 3500;
    const talkChance = doodle.talkChance ?? 0.45;

    let moveTimer = 0;
    const step = () => {
      // Blink
      if (Math.random() < 0.35) {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 150);
      }

      // Product lingered? speak product-aware line once per product
      const p = readProduct();
      if (p && p.key !== lastProduct.current) {
        lastProduct.current = p.key;
        if (Math.random() < 0.75) {
          say(productText(p.title, doodle.texts?.product));
        }
        return;
      }

      if (Math.random() < talkChance && !message) {
        say(pick(GENERAL_LINES));
      }

      // Walk to a random nearby-safe spot (keep inside viewport margins)
      const x = Math.min(88, Math.max(6, posRef.current.x + (Math.random() * 44 - 22)));
      const y = Math.min(86, Math.max(52, posRef.current.y + (Math.random() * 24 - 12)));
      setFacing(posRef.current.x > x ? 'right' : 'left');
      setWalking(true);
      setPos({ x, y });
      window.setTimeout(() => setWalking(false), 1800);
    };

    const interval = window.setInterval(step, doodle.tickMs ?? 3500);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doodle.enabled, doodle.tickMs, doodle.talkChance, message, readProduct, say]);

  if (!doodle.enabled) return null;

  return (
    <div
      className={`gunma-doodle-root ${facing === 'left' ? 'gunma-doodle-flip' : ''}`}
      style={{ '--doodle-x': pos.x, '--doodle-y': pos.y } as React.CSSProperties}
    >
      {message && (
        <div className="gunma-doodle-bubble" onClick={(e) => { e.stopPropagation(); setMessage(null); }}>
          {message}
        </div>
      )}
      <button
        className={`gunma-doodle-float ${walking ? 'walking' : ''} ${message ? 'talking' : ''}`}
        style={{ boxShadow: `0 6px 18px ${brandColor}55` }}
        title="Piku — click to chat"
        aria-label="Open Piku chat"
        onClick={() => { setMessage(null); onOpenChat(); }}
      >
        {/* Cute rice-bowl buddy */}
        <svg viewBox="0 0 64 64" className="gunma-doodle-svg" aria-hidden="true">
          {/* legs */}
          <g className="gunma-doodle-legs">
            <rect className="leg left"  x="24" y="48" width="6" height="12" rx="3" fill="#5b4a3a" />
            <rect className="leg right" x="34" y="48" width="6" height="12" rx="3" fill="#5b4a3a" />
          </g>
          {/* bowl body */}
          <path d="M8 34 a24 18 0 0 0 48 0 z" fill={brandColor} />
          {/* rice on top */}
          <ellipse cx="24" cy="30" rx="8" ry="5" fill="#fff" />
          <ellipse cx="36" cy="28" rx="10" ry="6" fill="#fff" />
          <ellipse cx="30" cy="24" rx="8" ry="5" fill="#fff" />
          {/* eyes (blink via CSS) */}
          <g className="gunma-doodle-eyes">
            <circle className={blink ? 'blink' : ''} cx="26" cy="38" r="2.6" fill="#222" />
            <circle className={blink ? 'blink' : ''} cx="38" cy="38" r="2.6" fill="#fff" stroke="#2b2b2b" strokeWidth="1" />
          </g>
          {/* smile */}
          <path d="M28 44 q4 4 8 0" stroke="#2b2b2b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* tiny steam when idle */}
          {!walking && (
            <g className="steam">
              <circle cx="24" cy="16" r="2.2" fill="#ffffff88" />
              <circle cx="31" cy="12" r="1.8" fill="#ffffff66" />
              <circle cx="38" cy="16" r="2" fill="#ffffff55" />
            </g>
          )}
        </svg>
      </button>
    </div>
  );
}
