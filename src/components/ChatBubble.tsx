'use client';

import React, { useEffect, useState } from 'react';
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
  // blink internal — drives the robot eyes/pupil
  const [blink, setBlink] = useState(false);
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

  return (
    <div className="gunma-bubble-hold">
      {/* Speech bubble sits ABOVE the button, outside the green circle */}
      {!isOpen && speech && (
        <div className="gunma-speech" onClick={(e) => { e.stopPropagation(); onChipClick(undefined); }}>
          <p className="gunma-speech-text">{speech}</p>
          {chips && chips.length > 0 && (
            <div className="gunma-speech-chips">
              {chips.map((c) => (
                <button
                  key={c.label}
                  className="gunma-chef-chip"
                  onClick={(e) => { e.stopPropagation(); onChipClick(c.prefill); }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        className={`gunma-bubble ${isOpen ? 'gunma-bubble--open' : ''}`}
        onClick={onClick}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        style={{ backgroundColor: isOpen ? brandColor : 'transparent' }}
      >
      {/* Piku robot mascot IS the bubble icon (doodle) */}
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
