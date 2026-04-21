'use client';

import React from 'react';

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  brandColor: string;
  unreadCount: number;
}

export function ChatBubble({ isOpen, onClick, brandColor, unreadCount }: ChatBubbleProps) {
  return (
    <button
      className={`gunma-bubble ${isOpen ? 'gunma-bubble--open' : ''}`}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      style={{ backgroundColor: brandColor }}
    >
      {/* Chat Icon */}
      <svg
        className={`gunma-bubble-icon ${isOpen ? 'gunma-bubble-icon--hidden' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {/* Close Icon */}
      <svg
        className={`gunma-bubble-icon ${isOpen ? '' : 'gunma-bubble-icon--hidden'}`}
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

      {/* Unread Badge */}
      {unreadCount > 0 && !isOpen && (
        <span className="gunma-badge">{unreadCount}</span>
      )}
    </button>
  );
}
