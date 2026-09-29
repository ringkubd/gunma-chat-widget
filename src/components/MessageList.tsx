'use client';

import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';
import { PikuRobotArt } from './PikuRobotArt';

interface MessageListProps {
  messages: ChatMessage[];
  welcomeMessage: string;
  brandColor: string;
  websiteUrl: string;
  /** Currency symbol shown on product cards. Default: '¥'. */
  currencySymbol?: string;
}

export function MessageList({ messages, welcomeMessage, brandColor, websiteUrl, currencySymbol = '¥', retireCartCtas = false }: MessageListProps & { retireCartCtas?: boolean }) {
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
          <div className="gunma-welcome-icon gunma-welcome-icon--piku" style={{ backgroundColor: `${brandColor}14` }}>
            <PikuRobotArt blink={false} talking={false} />
          </div>
          <p className="gunma-welcome-text">{welcomeMessage}</p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} brandColor={brandColor} websiteUrl={websiteUrl} currencySymbol={currencySymbol} retireCartCtas={retireCartCtas} />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
