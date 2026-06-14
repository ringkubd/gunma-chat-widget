'use client';

import React, { useState, useCallback } from 'react';
import type { ChatWidgetConfig } from '../types';
import { useChat } from '../hooks/useChat';
import { useCartActions } from '../hooks/useCartActions';
import { ChatBubble } from './ChatBubble';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';

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

  const { handleMessageClick } = useCartActions({
    apiUrl: config.apiUrl,
    routePrefix: config.routes?.prefix,
    cartUrl: config.cartUrl,
    cookieId: config.cookieId,
    apiToken: config.apiToken,
    getToken: config.getToken,
  });
  const [lastMessage, setLastMessage] = useState('');

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
          />

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
