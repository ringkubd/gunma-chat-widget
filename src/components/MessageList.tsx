'use client';

import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  welcomeMessage: string;
  brandColor: string;
  websiteUrl: string;
}

export function MessageList({ messages, welcomeMessage, brandColor, websiteUrl }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="gunma-messages">
      {/* Welcome Message */}
      {messages.length === 0 && (
        <div className="gunma-welcome">
          <div className="gunma-welcome-icon" style={{ backgroundColor: `${brandColor}20` }}>
            <svg viewBox="0 0 24 24" fill="none" stroke={brandColor} strokeWidth="1.5" width="32" height="32">
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <p className="gunma-welcome-text">{welcomeMessage}</p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} brandColor={brandColor} websiteUrl={websiteUrl} />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
