'use client';

import React from 'react';

interface ChatHeaderProps {
  brandName: string;
  brandColor: string;
  onClose: () => void;
  onEndChat: () => void;
  isConnected?: boolean;
  /** When provided, shows a cart button that opens the commerce panel. */
  onCartClick?: () => void;
  /** Number of items in the cart (shows a badge when > 0). */
  cartCount?: number;
}

export function ChatHeader({ brandName, brandColor, onClose, onEndChat, isConnected = true, onCartClick, cartCount = 0 }: ChatHeaderProps) {
  return (
    <div className="gunma-header" style={{ background: `linear-gradient(135deg, ${brandColor}, ${adjustColor(brandColor, -30)})` }}>
      <div className="gunma-header-info">
        {/* Avatar */}
        <div className="gunma-header-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <div>
          <h3 className="gunma-header-title">{brandName}</h3>
          <span className="gunma-header-status">
            <span className={`gunma-connection-dot ${isConnected ? 'gunma-online-dot' : 'gunma-offline-dot'}`} />
            {isConnected ? 'Online' : 'Reconnecting...'}
          </span>
        </div>
      </div>
      <div className="gunma-header-actions">
        {/* Cart / Checkout Button */}
        {onCartClick && (
          <button
            className="gunma-header-btn gunma-header-cart"
            onClick={onCartClick}
            title="Cart & checkout"
            aria-label="Open cart and checkout"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="gunma-header-cart-badge">{cartCount}</span>}
          </button>
        )}
        {/* End Chat Button */}
        <button
          className="gunma-header-btn"
          onClick={onEndChat}
          title="End chat"
          aria-label="End chat session"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          </svg>
        </button>
        {/* Close Button */}
        <button
          className="gunma-header-btn"
          onClick={onClose}
          title="Minimize"
          aria-label="Minimize chat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Darken a hex color by a given amount.
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
