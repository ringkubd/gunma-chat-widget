import { useCallback, useEffect, useRef, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { ChatApi } from '../lib/api';
/**
 * Generate a stable visitor ID from the browser.
 * @param storageKey - localStorage key to use (default: 'gunma_visitor_id')
 */
function getVisitorId(storageKey = 'gunma_visitor_id') {
    if (typeof window === 'undefined')
        return 'ssr';
    try {
        let id = localStorage.getItem(storageKey);
        if (!id) {
            id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            localStorage.setItem(storageKey, id);
        }
        return id;
    }
    catch (e) {
        return 'anon';
    }
}
/**
 * Core chat hook — manages state, API calls, and SSE streaming.
 */
export function useChat(config) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const loadingRef = useRef(false);
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [toolStatus, setToolStatus] = useState(null);
    const [isAiEnabled, setIsAiEnabled] = useState(true);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    // --- Resolved configurable values ---
    const sessionIdKey = config.storage?.sessionIdKey ?? 'gunma_session_id';
    const visitorIdKey = config.storage?.visitorIdKey ?? 'gunma_visitor_id';
    const tokenKeys = config.storage?.tokenKeys ?? ['tk', 'token'];
    const routePrefix = config.routes?.prefix ?? 'api/chat';
    const broadcastAuth = config.pusher?.authEndpoint ?? '/api/broadcasting/auth';
    /** Resolve the auth token: explicit > getToken() > localStorage scan */
    const resolveToken = useCallback(() => {
        if (config.apiToken)
            return config.apiToken;
        if (config.getToken)
            return config.getToken() ?? '';
        if (typeof window === 'undefined')
            return '';
        for (const key of tokenKeys) {
            const t = localStorage.getItem(key);
            if (t)
                return t;
        }
        return '';
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.apiToken, config.getToken, tokenKeys.join(',')]);
    const apiRef = useRef(new ChatApi(`${config.apiUrl}/${routePrefix}`, config.cookieId, resolveToken()));
    const echoRef = useRef(null);
    const abortRef = useRef(null);
    const initRef = useRef(false);
    const sessionRef = useRef(null);
    const isOpenRef = useRef(false);
    const typingTimeoutRef = useRef(null);
    const channelListenersRef = useRef(new Set());
    const linkSessionRef = useRef();
    // Keep refs in sync so callbacks don't need session/isOpen in their dep arrays
    useEffect(() => { sessionRef.current = session; }, [session]);
    useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
    // Sync apiToken when config changes
    useEffect(() => {
        const token = resolveToken();
        apiRef.current = new ChatApi(`${config.apiUrl}/${routePrefix}`, config.cookieId, token);
    }, [config.apiUrl, config.cookieId, config.apiToken, config.getToken, routePrefix, resolveToken]);
    // Initialize Echo
    useEffect(() => {
        if (typeof window === 'undefined' || !config.apiUrl)
            return;
        if (!config.pusher?.key) {
            // Real-time disabled — widget still works via SSE streaming
            return;
        }
        window.Pusher = Pusher;
        try {
            echoRef.current = new Echo({
                broadcaster: 'pusher',
                key: config.pusher.key,
                cluster: config.pusher.cluster,
                wsHost: config.pusher.wsHost ?? 'localhost',
                wsPort: config.pusher.wsPort ?? 6001,
                forceTLS: config.pusher.forceTLS ?? false,
                enabledTransports: ['ws', 'wss'],
                disableStats: true,
                authEndpoint: broadcastAuth,
                auth: {
                    headers: {
                        Authorization: resolveToken() ? `Bearer ${resolveToken()}` : '',
                    },
                },
            });
        }
        catch (err) {
            console.warn('[useChat] Echo init failed:', err);
        }
        return () => {
            if (sessionRef.current?.id) {
                echoRef.current?.leave(`gunma-chat.${sessionRef.current.id}`);
            }
        };
    }, [config.apiUrl, config.pusher?.key, broadcastAuth, resolveToken]);
    // Listen for WebSocket events when session exists
    useEffect(() => {
        if (!session || !echoRef.current)
            return;
        const sessionId = session.id;
        const channelKey = `gunma-chat.${sessionId}`;
        const channel = echoRef.current.channel(channelKey);
        // Prevent double-registering listeners (React Strict Mode / re-renders)
        if (channelListenersRef.current.has(channelKey))
            return;
        channelListenersRef.current.add(channelKey);
        channel.listen('.message.new', (data) => {
            setMessages((prev) => {
                const isDuplicate = prev.some(m => String(m.id) === String(data.id) ||
                    (m.role === data.role && m.content === data.content));
                if (isDuplicate)
                    return prev;
                return [...prev, {
                        id: data.id,
                        role: data.role,
                        content: data.content,
                        created_at: data.created_at
                    }];
            });
            if (data.role === 'assistant') {
                setIsLoading(false);
                setToolStatus(null);
                setIsAgentTyping(false);
            }
        });
        channel.listen('.ai.status_changed', (data) => {
            setIsAiEnabled(data.is_ai_enabled);
        });
        channel.listen('.user.typing', (data) => {
            if (data.role === 'assistant') {
                setIsAgentTyping(data.is_typing);
            }
        });
        return () => {
            echoRef.current?.leave(channelKey);
            channelListenersRef.current.delete(channelKey);
        };
    }, [session?.id]);
    /**
     * Send typing status
     */
    const sendTyping = useCallback((isTyping) => {
        if (!sessionRef.current)
            return;
        apiRef.current.sendTyping(sessionRef.current.id, 'user', isTyping);
    }, []);
    // Restore session from localStorage
    useEffect(() => {
        if (typeof window === 'undefined' || initRef.current)
            return;
        initRef.current = true;
        const savedSessionId = localStorage.getItem(sessionIdKey);
        if (savedSessionId) {
            apiRef.current.getMessages(savedSessionId)
                .then((msgs) => {
                const restored = { id: savedSessionId };
                setSession(restored);
                sessionRef.current = restored;
                setMessages(msgs);
            })
                .catch(() => {
                localStorage.removeItem(sessionIdKey);
            });
        }
    }, []);
    /**
     * Detect login state changes and link guest session to the authenticated customer.
     */
    useEffect(() => {
        if (typeof window === 'undefined' || !sessionRef.current)
            return;
        const token = resolveToken();
        const stored = localStorage.getItem('gunma_chat_customer_id');
        const customerId = stored ? parseInt(stored, 10) : null;
        // Also listen for custom login event fired by host app after login.
        const handleLogin = (e) => {
            const detail = e.detail;
            const cid = detail?.customer_id ?? detail?.customerId ?? null;
            if (cid) {
                localStorage.setItem('gunma_chat_customer_id', String(cid));
                linkSessionRef.current?.(cid).catch((err) => {
                    console.warn('[useChat] linkSession on gunma:login failed:', err);
                });
            }
        };
        window.addEventListener('gunma:login', handleLogin);
        // If we now have a token + known customer ID and the session is still a guest, link it.
        if (token && customerId && !sessionRef.current.customer_id) {
            linkSessionRef.current?.(customerId).catch((err) => {
                console.warn('[useChat] linkSession failed:', err);
            });
        }
        return () => window.removeEventListener('gunma:login', handleLogin);
    }, [session?.id, resolveToken]);
    /**
     * Initialize or resume a chat session.
     */
    const initSession = useCallback(async () => {
        if (sessionRef.current)
            return sessionRef.current;
        try {
            const visitorId = config.visitorId || getVisitorId(visitorIdKey);
            const newSession = await apiRef.current.createSession(visitorId, config.customerName, config.channel || 'web');
            setSession(newSession);
            sessionRef.current = newSession;
            localStorage.setItem(sessionIdKey, newSession.id);
            // Load existing messages if any
            if (newSession.id) {
                try {
                    const msgs = await apiRef.current.getMessages(newSession.id);
                    if (msgs.length > 0) {
                        setMessages(msgs);
                    }
                }
                catch {
                    // New session, no messages yet
                }
            }
            return newSession;
        }
        catch (err) {
            setError('Failed to connect. Please try again.');
            return null;
        }
    }, [config.visitorId, config.customerName, config.channel]);
    /**
     * Send a message and handle SSE response.
     */
    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || loadingRef.current)
            return;
        loadingRef.current = true;
        setError(null);
        setIsLoading(true);
        setToolStatus(null);
        sendTyping(false); // Stop typing when sending
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
        const userMsg = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: text,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        // SSE streaming
        abortRef.current = apiRef.current.sendMessageStream(currentSession.id, text, 
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
                    const resultData = data.result;
                    if (resultData && resultData.action === 'redirect' && resultData.url) {
                        window.location.href = resultData.url;
                    }
                    break;
                case 'message': {
                    const assistantMsg = {
                        id: data.id ? String(data.id) : `asst_${Date.now()}`,
                        role: 'assistant',
                        content: String(data.content || ''),
                        created_at: new Date().toISOString(),
                    };
                    setMessages((prev) => {
                        const exists = prev.some(m => String(m.id) === String(assistantMsg.id) ||
                            (m.role === assistantMsg.role && m.content === assistantMsg.content));
                        if (exists)
                            return prev;
                        return [...prev, assistantMsg];
                    });
                    setToolStatus(null);
                    setIsAgentTyping(false);
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
            loadingRef.current = false;
            setIsLoading(false);
            setToolStatus(null);
            setIsAgentTyping(false);
        }, 
        // onError
        (err) => {
            loadingRef.current = false;
            setError(err.message);
            setIsLoading(false);
            setToolStatus(null);
        });
    }, [initSession, sendTyping]);
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
            }
            catch {
                // Best effort
            }
        }
        sessionRef.current = null;
        isOpenRef.current = false;
        setSession(null);
        setMessages([]);
        setIsOpen(false);
        localStorage.removeItem(sessionIdKey);
    }, []);
    /**
     * Cancel any in-progress request.
     */
    const cancelRequest = useCallback(() => {
        abortRef.current?.abort();
        setIsLoading(false);
        setToolStatus(null);
        setIsAgentTyping(false);
    }, []);
    /**
     * Upload a file and send it as a message.
     */
    const uploadFile = useCallback(async (file) => {
        setIsLoading(true);
        setToolStatus('Uploading image...');
        try {
            const { url } = await apiRef.current.uploadFile(file);
            await sendMessage(`[IMAGE: ${url}]`);
        }
        catch (err) {
            setError('Upload failed. Please try again.');
            setIsLoading(false);
            setToolStatus(null);
        }
    }, [sendMessage]);
    const linkSession = useCallback(async (customerId) => {
        const visitorId = config.visitorId || getVisitorId(visitorIdKey);
        await apiRef.current.linkSession(visitorId, customerId);
        if (sessionRef.current) {
            const sessionId = sessionRef.current.id;
            setSession(prev => prev ? { ...prev, customer_id: customerId } : prev);
            // Refresh session details from backend so the backend session reflects the customer name/email.
            try {
                const refreshed = await apiRef.current.getSession(sessionId);
                if (refreshed?.session) {
                    setSession(refreshed.session);
                }
            }
            catch {
                // Best-effort refresh.
            }
        }
    }, [config.visitorId]);
    // Expose stable linkSession via ref so the login listener can call it without circular deps.
    useEffect(() => {
        linkSessionRef.current = linkSession;
    }, [linkSession]);
    const submitFeedback = useCallback(async (rating, comment) => {
        if (!sessionRef.current)
            return;
        await apiRef.current.submitFeedback(sessionRef.current.id, rating, comment);
    }, []);
    return {
        isOpen,
        isLoading,
        session,
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
        linkSession,
        submitFeedback,
    };
}
