/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT = 30000;
/** Number of retry attempts for transient failures */
const MAX_RETRIES = 2;
/**
 * API client for the Gunma AI Agent Laravel backend.
 */
export class ChatApi {
    constructor(apiUrl, cookieId) {
        this.baseUrl = apiUrl.replace(/\/$/, '');
        this.cookieId = cookieId;
    }
    /**
     * Fetch with timeout and retry for transient failures.
     */
    async fetchWithRetry(url, options = {}, retries = MAX_RETRIES) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            // Retry on 429 (rate limit) or 5xx (server error)
            if (!response.ok && retries > 0 && (response.status === 429 || response.status >= 500)) {
                const delay = response.status === 429 ? 2000 : 500;
                await new Promise((r) => setTimeout(r, delay));
                return this.fetchWithRetry(url, options, retries - 1);
            }
            return response;
        }
        catch (error) {
            // Retry on network errors (not abort)
            if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
                await new Promise((r) => setTimeout(r, 500));
                return this.fetchWithRetry(url, options, retries - 1);
            }
            throw error;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Create or resume a chat session.
     */
    async createSession(visitorId, customerName, channel = 'web') {
        const response = await this.fetchWithRetry(`${this.baseUrl}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitor_id: visitorId,
                customer_name: customerName || null,
                channel,
                cookie_id: this.cookieId,
            }),
        });
        if (!response.ok) {
            throw new Error(`Failed to create session: ${response.status}`);
        }
        const data = await response.json();
        return data.session;
    }
    /**
     * Get session details with messages.
     */
    async getSession(sessionId) {
        const response = await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}`);
        if (!response.ok) {
            throw new Error(`Failed to get session: ${response.status}`);
        }
        return response.json();
    }
    /**
     * Get message history for a session.
     */
    async getMessages(sessionId, limit = 50) {
        const response = await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}/messages?limit=${limit}`);
        if (!response.ok) {
            throw new Error(`Failed to get messages: ${response.status}`);
        }
        const data = await response.json();
        return data.messages;
    }
    /**
     * Send a message and receive SSE stream.
     * Returns an EventSource-like reader for the SSE response.
     */
    sendMessageStream(sessionId, message, onEvent, onDone, onError) {
        const controller = new AbortController();
        fetch(`${this.baseUrl}/sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, cookie_id: this.cookieId }),
            signal: controller.signal,
        })
            .then(async (response) => {
            if (!response.ok) {
                throw new Error(`Message failed: ${response.status}`);
            }
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                // Parse SSE events from buffer
                const events = buffer.split('\n\n');
                buffer = events.pop() || ''; // Keep incomplete event in buffer
                for (const eventBlock of events) {
                    if (!eventBlock.trim())
                        continue;
                    let eventType = 'message';
                    let eventData = '';
                    for (const line of eventBlock.split('\n')) {
                        if (line.startsWith('event: ')) {
                            eventType = line.slice(7).trim();
                        }
                        else if (line.startsWith('data: ')) {
                            eventData = line.slice(6);
                        }
                    }
                    if (eventData) {
                        try {
                            const parsed = JSON.parse(eventData);
                            onEvent(eventType, parsed);
                            if (eventType === 'done') {
                                onDone();
                                return;
                            }
                        }
                        catch {
                            // Ignore malformed JSON
                        }
                    }
                }
            }
            onDone();
        })
            .catch((error) => {
            if (error.name !== 'AbortError') {
                onError(error);
            }
        });
        return controller;
    }
    /**
     * Send a message synchronously (non-streaming).
     */
    async sendMessageSync(sessionId, message) {
        const response = await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}/messages/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        if (!response.ok) {
            throw new Error(`Message failed: ${response.status}`);
        }
        const data = await response.json();
        return data.reply;
    }
    /**
     * End a chat session.
     */
    async endSession(sessionId) {
        await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}/end`, {
            method: 'POST',
        });
    }
}
