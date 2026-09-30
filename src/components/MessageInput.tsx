'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { resolveSpeechLocale } from '../lib/speechLocale';

interface MessageInputProps {
  onSend: (text: string) => void;
  onUpload?: (file: File) => void;
  onTyping?: (isTyping: boolean) => void;
  isLoading: boolean;
  placeholder: string;
  /** Optional explicit recognition locale; otherwise auto-detected. */
  speechLang?: string;
  /** Texts to script-detect the recognition language from (e.g. last message). */
  languageSamples?: Array<string | null | undefined>;
}

export function MessageInput({ onSend, onUpload, onTyping, isLoading, placeholder, speechLang, languageSamples }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceHint, setVoiceHint] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const wasFocusedRef = useRef(false);

  // Re-focus when a reply finishes so the customer can keep typing without
  // clicking again. (disabled inputs lose focus entirely — we use readOnly.)
  useEffect(() => {
    if (!isLoading && wasFocusedRef.current) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

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

    // Typing logic
    if (!isTypingRef.current && onTyping) {
        isTypingRef.current = true;
        onTyping(true);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
        if (isTypingRef.current && onTyping) {
            isTypingRef.current = false;
            onTyping(false);
        }
    }, 3000);
  }, [onTyping]);

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
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    setVoiceError(null);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    // Smart locale: host override → script of what they typed / last message →
    // browser language. Never hardcoded.
    recognition.lang = resolveSpeechLocale({
      override: speechLang,
      samples: [value, ...(languageSamples ?? [])],
    });

    // Live (interim) text goes into the box; the final result settles it.
    recognition.onresult = (event: any) => {
      let finalText = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interim += t;
      }
      if (finalText) {
        setValue((prev) => (prev ? `${prev} ${finalText.trim()}` : finalText.trim()));
      } else if (interim) {
        setVoiceHint(interim.trim());
      }
    };

    recognition.onend = () => { setIsRecording(false); setVoiceHint(''); };
    recognition.onerror = (e: any) => {
      setIsRecording(false);
      setVoiceHint('');
      const err = e?.error || '';
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        setVoiceError('Microphone permission was blocked. Please allow mic access.');
      } else if (err === 'no-speech') {
        setVoiceError('No speech detected — please try again.');
      } else if (err !== 'aborted') {
        setVoiceError('Voice input failed. Please try again.');
      }
    };

    try {
      recognition.start();
      setIsRecording(true);
      recognitionRef.current = recognition;
    } catch {
      setVoiceError('Could not start voice input.');
    }
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
        onFocus={() => { wasFocusedRef.current = true; }}
        onBlur={() => { wasFocusedRef.current = false; }}
        placeholder={placeholder}
        rows={1}
        readOnly={isLoading}
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

      {(isRecording || voiceHint || voiceError) && (
        <div className={`gunma-voice-bar ${voiceError ? 'gunma-voice-bar--error' : ''}`}>
          {voiceError ? (
            <span>{voiceError}</span>
          ) : (
            <>
              <span className="gunma-voice-dot" />
              <span className="gunma-voice-text">{voiceHint || 'Listening…'}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
