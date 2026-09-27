/**
 * Piku Doodle — tiny floating companion on the storefront.
 *
 * v0: aware of what the customer is viewing (via data attributes), shows a
 * small contextual hint, and opens the chat when clicked.
 * Opt-in via config.doodle.
 */
import React, { useCallback, useEffect, useState } from 'react';

export interface DoodleConfig {
  enabled?: boolean;
  texts?: {
    productPage?: string;
    bubbleDefault?: string;
  };
}

interface Props {
  doodle: DoodleConfig;
  brandColor: string;
  onOpenChat: () => void;
}

export function PikuDoodle({ doodle, brandColor, onOpenChat }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const seenRef = React.useRef<Set<string>>(new Set());
  const productText = doodle.texts?.productPage || 'Ei product ta dekhchen? Recipe ba ingredients lagbe? 💬 Chat koro!';

  const read = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (message) return; // one bubble at a time
    const el = document.querySelector('[data-product-id]') as HTMLElement | null;
    if (!el) return;
    const title = (el.getAttribute('data-product-title') || el.textContent || '').trim().slice(0, 60);
    const key = `${el.getAttribute('data-product-id')}|${title}`;
    if (seenRef.current.has(key)) return;
    seenRef.current.add(key);
    // Cap total nudges per page-lifetime to avoid scroll-storm spam
    if (seenRef.current.size > 2) return;
    setTimeout(() => setMessage(`${title ? `"${title}"` : productText}\n${productText}`), 600);
  }, [message, productText]);

  useEffect(() => {
    if (!doodle.enabled || typeof window === 'undefined') return;
    read();
    const interval = window.setInterval(read, 3_000);
    return () => window.clearInterval(interval);
  }, [doodle.enabled, read]);

  if (!doodle.enabled) return null;

  return (
    <div className="gunma-doodle-root">
      {message && (
        <div className="gunma-doodle-bubble" onClick={() => setMessage(null)}>
          <p>{message.split('\n')[0]}</p>
          <p className="text">{message.split('\n')[1]}</p>
          <button
            className="gunma-doodle-chat-btn"
            onClick={(e) => { e.stopPropagation(); setMessage(null); onOpenChat(); }}
          >
            💬 Chat with Piku
          </button>
        </div>
      )}
      <button
        className="gunma-doodle-float"
        style={{ boxShadow: `0 4px 14px ${brandColor}55` }}
        title="Piku"
        aria-label="Open Piku chat"
        onClick={() => { setMessage(null); onOpenChat(); }}
      >
        <span className="gunma-doodle-face">🍚</span>
      </button>
    </div>
  );
}
