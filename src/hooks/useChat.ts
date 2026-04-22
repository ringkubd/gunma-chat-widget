import { useCallback, useEffect, useRef, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { ChatApi } from '../lib/api';
import type { ChatMessage, ChatSession, ChatWidgetConfig } from '../types';

/**
 * Generate a stable visitor ID from the browser.
 */
function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr';

  const storageKey = 'gunma_visitor_id';
  try {
    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(storageKey, id);
    }
    return id;
  } catch (e) {
    return 'anon';
  }
}

/**
 * Core chat hook — manages state, API calls, and SSE streaming.
 */
export function useChat(config: ChatWidgetConfig) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const [isAiEnabled, setIsAiEnabled] = useState(true);

  const apiRef = useRef(new ChatApi(config.apiUrl, config.cookieId, config.apiToken));
  const echoRef = useRef<Echo<any> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const initRef = useRef(false);
  const sessionRef = useRef<ChatSession | null>(null);
  const isOpenRef = useRef(false);

  // Keep refs in sync so callbacks don't need session/isOpen in their dep arrays
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
  
  // Sync apiToken if it changes
  useEffect(() => {
    apiRef.current = new ChatApi(config.apiUrl, config.cookieId, config.apiToken);
  }, [config.apiUrl, config.cookieId, config.apiToken]);

  // Initialize Echo
  useEffect(() => {
    if (typeof window === 'undefined' || !config.apiUrl) return;

    (window as any).Pusher = Pusher;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('tk') : null;
      
      echoRef.current = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_PUSHER_KEY || '3e004c455a5824baf3a03f6d9cc6bcc5',
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
        wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || 'localhost',
        wsPort: Number(process.env.NEXT_PUBLIC_PUSHER_PORT || 6001),
        forceTLS: process.env.NEXT_PUBLIC_PUSHER_FORCE_TLS === 'true',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        authEndpoint: process.env.NEXT_PUBLIC_PUSHER_AUTH_ENDPOINT || 'http://localhost:8100/api/broadcasting/auth',
        auth: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          }
        }
      });
    } catch (err) {
      console.warn('[useChat] Echo init failed:', err);
    }

    return () => {
      if (sessionRef.current?.id) {
        echoRef.current?.leave(`gunma-chat.${sessionRef.current.id}`);
      }
      // Only disconnect if we are the sole owner, but usually it's safer 
      // in a SPA to just leave channels.
      // echoRef.current?.disconnect();
    };
  }, [config.apiUrl]);

  // Listen for WebSocket events when session exists
  useEffect(() => {
    if (!session || !echoRef.current) return;

    const sessionId = session.id;
    const channel = echoRef.current.channel(`gunma-chat.${sessionId}`);

    channel.listen('.message.new', (data: any) => {
      setMessages((prev) => {
        // Prevent duplicate messages (since SSE also adds them)
        if (prev.some(m => m.id === data.id)) return prev;

        return [...prev, {
          id: data.id,
          role: data.role,
          content: data.content,
          created_at: data.created_at
        }];
      });

      // If message is from assistant/agent, stop loading
      if (data.role === 'assistant') {
        setIsLoading(false);
        setToolStatus(null);
      }
    });

    channel.listen('.ai.status_changed', (data: any) => {
      setIsAiEnabled(data.is_ai_enabled);
    });

    return () => {
      echoRef.current?.leave(`gunma-chat.${sessionId}`);
    };
  }, [session?.id]);

  // Restore session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || initRef.current) return;
    initRef.current = true;

    const savedSessionId = localStorage.getItem('gunma_session_id');
    if (savedSessionId) {
      apiRef.current.getMessages(savedSessionId)
        .then((msgs) => {
          setSession({ id: savedSessionId } as ChatSession);
          setMessages(msgs);
        })
        .catch(() => {
          localStorage.removeItem('gunma_session_id');
        });
    }
  }, []);

  /**
   * Initialize or resume a chat session.
   */
  const initSession = useCallback(async () => {
    if (sessionRef.current) return sessionRef.current;

    try {
      const visitorId = config.visitorId || getVisitorId();
      const newSession = await apiRef.current.createSession(
        visitorId,
        config.customerName,
        config.channel || 'web',
      );

      setSession(newSession);
      sessionRef.current = newSession;
      localStorage.setItem('gunma_session_id', newSession.id);

      // Load existing messages if any
      if (newSession.id) {
        try {
          const msgs = await apiRef.current.getMessages(newSession.id);
          if (msgs.length > 0) {
            setMessages(msgs);
          }
        } catch {
          // New session, no messages yet
        }
      }

      return newSession;
    } catch (err) {
      setError('Failed to connect. Please try again.');
      return null;
    }
  }, [config.visitorId, config.customerName, config.channel]);

  /**
   * Send a message and handle SSE response.
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    setToolStatus(null);

    // Ensure session exists
    let currentSession = sessionRef.current;
    if (!currentSession) {
      currentSession = await initSession();
      if (!currentSession) {
        setIsLoading(false);
        return;
      }
    }

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // SSE streaming
    abortRef.current = apiRef.current.sendMessageStream(
      currentSession.id,
      text,
      // onEvent
      (eventType, data) => {
        switch (eventType) {
          case 'thinking':
            setToolStatus(String(data.status || 'Thinking...'));
            break;
          case 'tool_call':
            setToolStatus(`🔍 Searching ${String(data.name || '')}...`);
            break;
          case 'tool_result':
            setToolStatus(`✅ ${String(data.name || '')} complete`);
            const resultData = data.result as { action?: string; url?: string } | undefined;
            if (resultData && resultData.action === 'redirect' && resultData.url) {
              window.location.href = resultData.url;
            }
            break;
          case 'message': {
            const assistantMsg: ChatMessage = {
              id: `asst_${Date.now()}`,
              role: 'assistant',
              content: String(data.content || ''),
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
            setToolStatus(null);
            break;
          }
          case 'error':
            setError(String(data.message || 'An error occurred.'));
            setToolStatus(null);
            break;
        }
      },
      // onDone
      () => {
        setIsLoading(false);
        setToolStatus(null);
      },
      // onError
      (err) => {
        setError(err.message);
        setIsLoading(false);
        setToolStatus(null);
      },
    );
  }, [isLoading, initSession]);

  /**
   * Toggle chat open/close.
   */
  const toggle = useCallback(() => {
    // Read current state from refs to avoid calling setState inside setState
    const willOpen = !isOpenRef.current;
    if (willOpen && !sessionRef.current) {
      initSession();
    }
    setIsOpen(willOpen);
    isOpenRef.current = willOpen;
  }, [initSession]);

  /**
   * End the current session and start fresh.
   */
  const endChat = useCallback(async () => {
    if (sessionRef.current) {
      try {
        await apiRef.current.endSession(sessionRef.current.id);
      } catch {
        // Best effort
      }
    }

    sessionRef.current = null;
    isOpenRef.current = false;
    setSession(null);
    setMessages([]);
    setIsOpen(false);
    localStorage.removeItem('gunma_session_id');
  }, []);

  /**
   * Cancel any in-progress request.
   */
  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setToolStatus(null);
  }, []);

  /**
   * Upload a file and send it as a message.
   */
  const uploadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setToolStatus('Uploading image...');
    try {
      const { url } = await apiRef.current.uploadFile(file);
      await sendMessage(`[IMAGE: ${url}]`);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setIsLoading(false);
      setToolStatus(null);
    }
  }, [sendMessage]);

  return {
    isOpen,
    isLoading,
    session,
    messages,
    error,
    toolStatus,
    isAiEnabled,
    toggle,
    sendMessage,
    uploadFile,
    endChat,
    cancelRequest,
  };
}
