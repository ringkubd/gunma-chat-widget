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

export function ChatWidget(config: ChatWidgetConfig) {
  const {
    isOpen,
    isLoading,
    messages,
    error,
    toolStatus,
    isAiEnabled,
    isAgentTyping,
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

  // When the agent adds to cart / prepares checkout, open the in-chat panel.
  React.useEffect(() => {
    if (!commerce.enabled) return;
    const handler = () => {
      setShowCommerce(true);
      void refreshCommerceCartRef.current?.();
    };
    window.addEventListener('gunma:open_checkout', handler);
    return () => window.removeEventListener('gunma:open_checkout', handler);
  }, [commerce.enabled]);

  const position = config.position || 'bottom-right';
  const brandColor = config.brandColor || '#10b981';
  const brandName = config.brandName || 'Piku';
  const welcomeMessage = config.welcomeMessage || 'Hello, this is Piku from Gunma Halal Food Customer Support. How may I assist you today?';

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
    <div style={positionStyle} className="gunma-chat-root">
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
            isConnected={true}
            onCartClick={commerce.enabled ? () => setShowCommerce((v) => !v) : undefined}
            cartCount={commerce.enabled ? commerce.cart.length : 0}
          />

          {commerce.enabled && showCommerce ? (
            <CommercePanel
              commerce={commerce}
              brandColor={brandColor}
              onClose={() => setShowCommerce(false)}
              freeShippingThreshold={commerce.freeShippingThreshold}
            />
          ) : (
            <>
              <div onClick={handleMessageClick}>
                <MessageList
                  messages={messages}
                  welcomeMessage={welcomeMessage}
                  brandColor={brandColor}
                  websiteUrl={config.websiteUrl || 'https://api.gunmahalalfood.com'}
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
                placeholder={config.placeholder || 'Type a message...'}
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
        unreadCount={0}
      />
    </div>
  );
}
