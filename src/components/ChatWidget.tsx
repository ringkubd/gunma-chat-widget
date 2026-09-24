'use client';

import React, { useState, useCallback } from 'react';
import type { ChatWidgetConfig } from '../types';
import { useChat } from '../hooks/useChat';
import { useCartActions } from '../hooks/useCartActions';
import { useCommerce } from '../hooks/useCommerce';
import { ChatBubble } from './ChatBubble';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { CommercePanel } from './commerce/CommercePanel';
import { getStrings } from '../lib/i18n';

export function ChatWidget(config: ChatWidgetConfig) {
  const {
    isOpen,
    isLoading,
    messages,
    error,
    toolStatus,
    isAiEnabled,
    isAgentTyping,
    isConnected,
    unreadCount,
    toggle,
    sendMessage,
    sendTyping,
    uploadFile,
    endChat,
    cancelRequest,
  } = useChat(config);

  // Keep a stable ref for the cart refresher used by the click handler.
  const refreshCommerceCartRef = React.useRef<(() => Promise<void>) | null>(null);

  const { handleMessageClick } = useCartActions({
    apiUrl: config.apiUrl,
    routePrefix: config.routes?.prefix,
    cartUrl: config.cartUrl,
    cookieKey: config.storage?.cookieKey,
    apiToken: config.apiToken,
    getToken: config.getToken,
    onAdded: () => {
      setShowCommerce(true);
      void refreshCommerceCartRef.current?.();
    },
  });
  const [lastMessage, setLastMessage] = useState('');
  const [showCommerce, setShowCommerce] = useState(false);

  const commerce = useCommerce(config, {
    onCartChanged: () => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cart_updated', String(Date.now()));
      }
    },
  });

  React.useEffect(() => {
    refreshCommerceCartRef.current = commerce.refreshCart;
  }, [commerce.refreshCart]);

  // When the agent adds to cart / prepares checkout / asks for login, open
  // the in-chat commerce panel at the right step (no page navigation).
  React.useEffect(() => {
    if (!commerce.enabled) return;

    const openCheckout = () => {
      setShowCommerce(true);
      commerce.setStep('cart');
      void refreshCommerceCartRef.current?.();
    };
    const openLogin = () => {
      setShowCommerce(true);
      commerce.setStep('auth');
    };

    window.addEventListener('gunma:open_checkout', openCheckout);
    window.addEventListener('gunma:open_login', openLogin);
    return () => {
      window.removeEventListener('gunma:open_checkout', openCheckout);
      window.removeEventListener('gunma:open_login', openLogin);
    };
  }, [commerce.enabled, commerce.setStep]);

  const position = config.position || 'bottom-right';
  const brandColor = config.brandColor || '#10b981';
  const brandName = config.brandName || 'Piku';
  const welcomeMessage = config.welcomeMessage || 'Hello, this is Piku from Gunma Halal Food Customer Support. How may I assist you today?';
  const theme = config.theme || 'auto';
  const themeClass = theme === 'dark' ? 'gunma-theme-dark' : theme === 'light' ? 'gunma-theme-light' : 'gunma-theme-auto';
  const strings = getStrings(config.locale);

  const positionStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: config.zIndex || 9999,
    ...(position === 'bottom-right'
      ? { bottom: '24px', right: '24px' }
      : { bottom: '24px', left: '24px' }),
  };

  const handleSend = useCallback((text: string) => {
    setLastMessage(text);
    sendMessage(text);
  }, [sendMessage]);

  const handleRetry = useCallback(() => {
    if (lastMessage) {
      sendMessage(lastMessage);
    }
  }, [lastMessage, sendMessage]);

  return (
    <div style={positionStyle} className={`gunma-chat-root ${themeClass}`}>
      {/* Floating Chat Panel */}
      {isOpen && (
        <div
          className="gunma-chat-panel"
          style={{ '--gunma-brand': brandColor } as React.CSSProperties}
        >
          <ChatHeader
            brandName={brandName}
            brandColor={brandColor}
            onClose={toggle}
            onEndChat={endChat}
            isConnected={isConnected}
            onCartClick={commerce.enabled ? () => setShowCommerce((v) => !v) : undefined}
            cartCount={commerce.enabled ? commerce.cart.length : 0}
            strings={strings}
          />

          {commerce.enabled && showCommerce ? (
            <CommercePanel
              commerce={commerce}
              brandColor={brandColor}
              onClose={() => setShowCommerce(false)}
              freeShippingThreshold={commerce.freeShippingThreshold}
              strings={strings}
            />
          ) : (
            <>
              <div onClick={handleMessageClick}>
                <MessageList
                  messages={messages}
                  welcomeMessage={welcomeMessage}
                  brandColor={brandColor}
                  websiteUrl={config.websiteUrl || 'https://api.gunmahalalfood.com'}
                  currencySymbol={config.commerce?.currencySymbol ?? '¥'}
                />
              </div>

              {/* Tool Status / Typing Indicator */}
              {(isLoading || toolStatus || isAgentTyping) && (
                <div className="gunma-status-bar">
                  {(isLoading || isAgentTyping) && <TypingIndicator />}
                  {toolStatus && (
                    <span className="gunma-tool-status">{toolStatus}</span>
                  )}
                  {isLoading && (
                    <button
                      className="gunma-cancel-btn"
                      onClick={cancelRequest}
                      aria-label="Cancel request"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Error Bar with Retry */}
              {error && (
                <div className="gunma-error-bar">
                  <span>{error}</span>
                  <button className="gunma-retry-btn" onClick={handleRetry}>
                    Retry
                  </button>
                </div>
              )}

              <MessageInput
                onSend={handleSend}
                onUpload={uploadFile}
                onTyping={sendTyping}
                isLoading={isLoading}
                placeholder={config.placeholder || strings.placeholder}
              />
            </>
          )}
        </div>
      )}

      {/* Floating Bubble Button */}
      <ChatBubble
        isOpen={isOpen}
        onClick={toggle}
        brandColor={brandColor}
        unreadCount={unreadCount}
      />
    </div>
  );
}
