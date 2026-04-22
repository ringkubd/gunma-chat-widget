'use client';

import React, { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onUpload?: (file: File) => void;
  isLoading: boolean;
  placeholder: string;
}

export function MessageInput({ onSend, onUpload, isLoading, placeholder }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue('');
    // Reset textarea height after sending
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    inputRef.current?.focus();
  }, [value, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'bn-BD'; // Default to Bengali, but works for others too

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setValue((prev) => (prev ? `${prev} ${text}` : text));
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognition.start();
    setIsRecording(true);
    recognitionRef.current = recognition;
  };

  return (
    <div className="gunma-input-area">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
      <button
        className="gunma-icon-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        aria-label="Attach photo"
        title="Attach photo"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      </button>

      <textarea
        ref={inputRef}
        className="gunma-input gunma-input--autoresize"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        aria-label="Chat message input"
      />

      <button
        className={`gunma-icon-btn ${isRecording ? 'gunma-mic--active' : ''}`}
        onClick={toggleRecording}
        disabled={isLoading}
        aria-label="Voice message"
        title="Voice message"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </button>

      <button
        className="gunma-send-btn"
        onClick={handleSubmit}
        disabled={!value.trim() || isLoading}
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
