import type { ChatSession, ChatMessage } from '../types';
/**
 * API client for the Gunma AI Agent Laravel backend.
 */
export declare class ChatApi {
    private baseUrl;
    private cookieId?;
    private getCookieIdFn?;
    private cookieStoreKey;
    private apiToken?;
    private getTokenFn?;
    private visitorId?;
    private sessionId?;
    constructor(apiUrl: string, cookieId?: string, apiToken?: string, visitorId?: string, getCookieId?: () => string | null, cookieStoreKey?: string, getToken?: () => string | null);
    /** Resolve the guest cart identity now: lazy resolver > static value. */
    private resolveCookieId;
    /**
     * Resolve the auth token on EVERY request (lazy) so an in-chat login is
     * recognised immediately — the token is captured at mount otherwise and the
     * widget keeps talking as a guest.
     */
    private resolveToken;
    private getHeaders;
    /** Remember the active chat session id (sent as X-Chat-Session-Id). */
    setSessionId(id?: string | null): void;
    /**
     * Fetch with timeout and retry for transient failures.
     */
    private fetchWithRetry;
    /**
     * Link guest session to authenticated customer after login.
     * Uses the public chat route so the widget can call it with a Bearer token.
     */
    linkSession(visitorId: string, customerId: number): Promise<void>;
    /**
     * Submit feedback after chat ends.
     */
    submitFeedback(sessionId: string, rating: number, comment?: string): Promise<void>;
    /**
     * Persist the guest cart identity the server hands back.
     * - localStorage[cookieKey]: the storefront's own cookie value (its bag
     *   query is gated on this).
     * - a `guest_id` cookie on the registrable parent domain: the storefront's
     *   cart/checkout reads ONLY this cookie (it ignores its path param). The
     *   chat route can't set it server-side (stateful → double-encrypted), so we
     *   write the exact value the server gave us, client-side.
     */
    private persistGuestCookie;
    /**
     * Create or resume a chat session.
     */
    createSession(visitorId: string, customerName?: string, channel?: string): Promise<ChatSession>;
    /**
     * Get session details with messages.
     */
    getSession(sessionId: string): Promise<{
        session: ChatSession & {
            messages: ChatMessage[];
        };
    }>;
    /**
     * Get message history for a session.
     */
    getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
    /**
     * Send a message and receive SSE stream.
     * Returns an EventSource-like reader for the SSE response.
     */
    sendMessageStream(sessionId: string, message: string, onEvent: (event: string, data: Record<string, unknown>) => void, onDone: () => void, onError: (error: Error) => void): AbortController;
    /**
     * Send a message synchronously (non-streaming).
     */
    sendMessageSync(sessionId: string, message: string): Promise<string>;
    /**
     * End a chat session.
     */
    endSession(sessionId: string): Promise<void>;
    /**
     * Upload a file (image).
     */
    uploadFile(file: File): Promise<{
        url: string;
    }>;
    /**
     * Broadcast typing status.
     */
    sendTyping(sessionId: string, role: 'user' | 'assistant', isTyping: boolean): Promise<void>;
}
