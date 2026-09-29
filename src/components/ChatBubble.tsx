'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PikuRobotArt } from './PikuRobotArt';
import { PikuChip } from '../hooks/usePikuSpeech';

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  brandColor: string;
  unreadCount: number;
  speech?: string | null;
  chips?: PikuChip[];
  onChipClick: (prefill?: string) => void;
  variant?: 'robot' | 'chef';
}

export function ChatBubble({ isOpen, onClick, brandColor, unreadCount, speech, chips, onChipClick, variant }: ChatBubbleProps) {
  const [blink, setBlink] = useState(false);
  const [speakingJump, setSpeakingJump] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const holdRef = useRef<HTMLDivElement | null>(null);
  // Drag-to-move: offset from the fixed bottom-right anchor (negative = left/up).
  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pk_pos');
      const p = raw ? JSON.parse(raw) : null;
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        posRef.current = { x: p.x, y: p.y };
        if (holdRef.current) holdRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      }
    } catch { /* ignore */ }
  }, []);

  const clampPos = (x: number, y: number) => ({
    x: Math.min(0, Math.max(-(window.innerWidth - 90), x)),
    y: Math.min(0, Math.max(-(window.innerHeight - 220), y)),
  });

  const onPointerDown = (e: React.PointerEvent) => {
    if (isOpen) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: posRef.current.x, oy: posRef.current.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 5) d.moved = true;
    if (!d.moved) return;
    const next = clampPos(d.ox + dx, d.oy + dy);
    posRef.current = next;
    if (holdRef.current) {
      holdRef.current.style.transition = 'none';
      holdRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0)`;
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    if (!d) return;
    dragRef.current = null;
    if (holdRef.current) holdRef.current.style.transition = '';
    if (d.moved) {
      suppressClickRef.current = true;
      try { localStorage.setItem('pk_pos', JSON.stringify(posRef.current)); } catch { /* ignore */ }
      window.setTimeout(() => { suppressClickRef.current = false; }, 300);
    }
  };

  useEffect(() => {
    const iv = window.setInterval(() => {
      if (document.hidden || isOpen || speech) return;
      if (Math.random() < 0.4) {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 130);
      }
    }, 2600);
    return () => window.clearInterval(iv);
  }, [isOpen, speech]);

  const talking = !!speech;

  const bellyRef = useRef<'idle' | 'eating' | 'chubby' | 'walking'>('idle');
  const [chubby, setChubby] = useState(false);
  const [eating, setEating] = useState(false);
  const [walking, setWalking] = useState(false);

  /* ── Funny mini-story: খাওয়া → nudus (চুবড়) → hatahati kore weight কমানো ── */
  useEffect(() => {
    if (isOpen) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let phases: number[] = [];
    let alive = true;
    const cleanups: Array<() => void> = [];
    const iv = window.setInterval(() => {
      if (document.hidden || speech || bellyRef.current !== 'idle') return;
      if (Math.random() > 0.1) return; // ~10% of ticks (rare, delightful)
      // Phase 1: eating (mouth pulses fast)
      bellyRef.current = 'eating';
      setEating(true);
      const t1 = window.setTimeout(() => {
        bellyRef.current = 'chubby';
        setChubby(true);
        const t2 = window.setTimeout(() => {
          bellyRef.current = 'walking';
          setWalking(true);
          setSpeakingJump(true);
          // funny speech: weight-loss caper (নিজের উপর হাসি)
          setMessage('Biryani kheye nudh হলাম! Hatahati kore weight কমাচ্ছি 😄🏃');
          window.setTimeout(() => setMessage(null), 4000);
          const t3 = window.setTimeout(() => {
            bellyRef.current = 'idle';
            setChubby(false);
            setWalking(false);
            setSpeakingJump(false);
          }, 3400);
          cleanups.push(() => window.clearTimeout(t3));
          cleanups.push(() => window.clearTimeout(t3));
        }, 2600);
        cleanups.push(() => window.clearTimeout(t2));
      }, 3200);
      cleanups.push(() => window.clearTimeout(t1));
    }, 30000);
    return () => { alive = false; window.clearInterval(iv); cleanups.forEach((c) => c()); };
  }, [isOpen, speech]);

  const belly = bellyRef.current;

  /* ── Choro/jump: chef screen-এর মধ্যে সর্বশেষ accepted spot-এ সরে ── */
  // এক জায়গায়-ই animate: মাঝেমধ্যে in-place ঝাঁপ হপ (position change নয়)
  useEffect(() => {
    if (isOpen) return;
    const hop = () => {
      if (document.hidden || window.innerWidth < 768) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      setSpeakingJump(true);
      window.setTimeout(() => setSpeakingJump(false), 620);
    };
    const t = window.setTimeout(hop, 55000);
    const iv = window.setInterval(hop, 105000);
    return () => { window.clearTimeout(t); window.clearInterval(iv); };
  }, [isOpen]);

  // Chat open হলে (x) সবসময় fixed bottom-right-এ — আগের কোনো স্থানাঙ্ক
  // leftover থাকলে সাথে সাথে snap করে দাও (transition ছাড়া)।
  useEffect(() => {
    const hold = holdRef.current;
    if (!hold) return;
    if (isOpen) {
      hold.style.transition = 'none';
      hold.style.transform = 'translate3d(0,0,0)';
    } else {
      hold.style.transition = '';
    }
  }, [isOpen]);

  return (
    <div
      ref={holdRef}
      className={`gunma-bubble-hold pk-robot-wrap ${bellyRef.current === 'eating' ? 'chef-eating' : ''} ${chubby ? 'chef-chubby' : ''} ${walking ? 'chef-walking' : ''}`}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
        pointerEvents: 'auto',
        transition: 'transform 1.9s cubic-bezier(.42,.05,.29,1.02)',
        willChange: 'transform',
      }}
    >
      {/* Speech bubble + chips: above the round button, never confined */}
      {!isOpen && speech && (
        <div className="gunma-speech" onClick={(e) => { e.stopPropagation(); onChipClick(undefined); }}>
          <p className="gunma-speech-text">{speech}</p>
          {chips && chips.length > 0 && (
            <div className="gunma-speech-chips">
              {chips.map((c) => (
                <button
                  key={c.label}
                  className="gunma-chef-chip"
                  onClick={(e) => { e.stopPropagation(); onChipClick(c.prefill,); }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        className={`gunma-bubble ${isOpen ? 'gunma-bubble--open pk-robot-wrap' : 'pk-robot-wrap'}`}
        onClick={() => { if (!suppressClickRef.current) onClick(); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{ backgroundColor: isOpen ? brandColor : 'transparent' }}
      >
        {!isOpen ? (
          variant === 'chef' ? (
            <svg viewBox="0 0 120 140" className="gunma-chef-svg" aria-hidden="true">
              <rect x="47" y="112" width="9" height="18" rx="4" fill="#334155" />
              <rect x="64" y="112" width="9" height="18" rx="4" fill="#334155" />
              <path d="M38 66 q22 -10 44 0 l4 46 q-26 8 -52 0 z" fill="#fff" stroke="#cbd9e2" />
              <circle cx="60" cy="46" r="20" fill="#f7cda6" />
              <circle className={blink ? 'chef-eye blink' : 'chef-eye'} cx="53" cy="45" r="2.6" fill="#26211d" />
              <circle className={blink ? 'chef-eye blink' : 'chef-eye'} cx="67" cy="45" r="2.6" fill="#26211d" />
              <rect x="45" y="12" width="30" height="18" rx="9" fill="#fff" stroke="#e6c268" />
            </svg>
          ) : (
            <PikuRobotArt blink={blink} talking={talking} />
          )
        ) : (
          <svg
            className="gunma-bubble-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}

        {unreadCount > 0 && !isOpen && (
          <span className="gunma-badge">{unreadCount}</span>
        )}
      </button>
    </div>
  );
}
