'use client';

import React from 'react';

interface ChatHeaderProps {
  brandName: string;
  brandColor: string;
  onClose: () => void;
  /** Fully hide the widget (leaves a small reopen tab). */
  onCloseWidget?: () => void;
  onEndChat: () => void;
  isConnected?: boolean;
  /** When provided, shows a cart button that opens the commerce panel. */
  onCartClick?: () => void;
  /** Number of items in the cart (shows a badge when > 0). */
  cartCount?: number;
  /** Piku profile picture URL. Falls back to the built-in avatar when absent. */
  avatarUrl?: string;
  /** Current reply language code (e.g. 'bn'); shows the globe selector. */
  lang?: string;
  /** Called when the customer picks a different language. */
  onLangChange?: (code: string) => void;
  /** Language options for the picker. */
  languages?: Array<{ code: string; label: string; name?: string }>;
  /** UI strings (i18n). */
  strings?: {
    online: string;
    reconnecting: string;
    endChat: string;
    minimize: string;
    cart: string;
  };
}

export function ChatHeader({
  brandName,
  brandColor,
  onClose,
  onCloseWidget,
  onEndChat,
  isConnected = true,
  onCartClick,
  cartCount = 0,
  avatarUrl,
  lang,
  onLangChange,
  languages,
  strings,
}: ChatHeaderProps) {
  const s = strings ?? {
    online: 'Online',
    reconnecting: 'Reconnecting...',
    endChat: 'End chat',
    minimize: 'Minimize',
    cart: 'Cart & checkout',
  };
  const [langOpen, setLangOpen] = React.useState(false);
  return (
    <div className="gunma-header" style={{ background: `linear-gradient(135deg, ${brandColor}, ${adjustColor(brandColor, -30)})` }}>
      <div className="gunma-header-info">
        {/* Avatar */}
        <div className="gunma-header-avatar gunma-avatar-round">
          {avatarUrl ? (
            <img className="gunma-avatar-img" src={avatarUrl} alt={brandName} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          )}
        </div>
        <div>
          <h3 className="gunma-header-title">{brandName}</h3>
          <span className="gunma-header-status">
            <span className={`gunma-connection-dot ${isConnected ? 'gunma-online-dot' : 'gunma-offline-dot'}`} />
            {isConnected ? s.online : s.reconnecting}
          </span>
        </div>
      </div>
      <div className="gunma-header-actions">
        {/* Language selector */}
        {onLangChange && languages && languages.length > 1 && (
          <div className="gunma-lang">
            <button
              className="gunma-header-btn"
              onClick={() => setLangOpen((v) => !v)}
              title="Change language"
              aria-label="Change language"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
              </svg>
            </button>
            {langOpen && (
              <>
                <div className="gunma-lang-backdrop" onClick={() => setLangOpen(false)} />
                <div className="gunma-lang-menu" role="listbox">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      role="option"
                      aria-selected={l.code === lang}
                      className={`gunma-lang-item ${l.code === lang ? 'is-active' : ''}`}
                      onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                    >
                      <span className="gunma-lang-label">{l.label}</span>
                      {l.code === lang && <span className="gunma-lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {/* Cart / Checkout Button */}
        {onCartClick && (
          <button
            className="gunma-header-btn gunma-header-cart"
            onClick={onCartClick}
            title={s.cart}
            aria-label={s.cart}
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
          title={s.endChat}
          aria-label={s.endChat}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          </svg>
        </button>
        {/* Minimize Button */}
        <button
          className="gunma-header-btn"
          onClick={onClose}
          title={s.minimize}
          aria-label={s.minimize}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        {/* Close Widget Button (hides everything → reopen tab) */}
        {onCloseWidget && (
          <button
            className="gunma-header-btn gunma-header-close"
            onClick={onCloseWidget}
            title="Close"
            aria-label="Close widget"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
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
