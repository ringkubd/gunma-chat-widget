'use client';

import React from 'react';

export function TypingIndicator() {
  return (
    <div className="gunma-typing" aria-label="Agent is typing">
      <span className="gunma-typing-dot" />
      <span className="gunma-typing-dot" />
      <span className="gunma-typing-dot" />
    </div>
  );
}
