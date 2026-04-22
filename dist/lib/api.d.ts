import type { ChatSession, ChatMessage } from '../types';
/**
 * API client for the Gunma AI Agent Laravel backend.
 */
export declare class ChatApi {
    private baseUrl;
    private cookieId?;
    private apiToken?;
    constructor(apiUrl: string, cookieId?: string, apiToken?: string);
    private getHeaders;
    /**
     * Fetch with timeout and retry for transient failures.
     */
    private fetchWithRetry;
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
}
