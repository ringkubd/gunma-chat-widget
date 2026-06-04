import type { ChatSession, ChatMessage } from '../types';

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT = 30_000;

/** Number of retry attempts for transient failures */
const MAX_RETRIES = 2;

/**
 * API client for the Gunma AI Agent Laravel backend.
 */
export class ChatApi {
  private baseUrl: string;
  private cookieId?: string;
  private apiToken?: string;

  constructor(apiUrl: string, cookieId?: string, apiToken?: string) {
    this.baseUrl = apiUrl.replace(/\/$/, '');
    this.cookieId = cookieId;
    this.apiToken = apiToken;
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    // Remove headers with empty values (useful for FormData)
    Object.keys(headers).forEach(key => {
        if (headers[key] === '') {
            delete headers[key];
        }
    });

    return headers;
  }

  /**
   * Fetch with timeout and retry for transient failures.
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries: number = MAX_RETRIES,
  ): Promise<Response> {
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
    } catch (error) {
      // Retry on network errors (not abort)
      if (retries > 0 && error instanceof Error && error.name !== 'AbortError') {
        await new Promise((r) => setTimeout(r, 500));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Link guest session to authenticated customer after login.
   */
  async linkSession(visitorId: string, customerId: number): Promise<void> {
    await this.fetchWithRetry(`${this.baseUrl.replace('/api/chat', '/api/admin/chat')}/link-session`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ visitor_id: visitorId, customer_id: customerId }),
    });
  }

  /**
   * Submit feedback after chat ends.
   */
  async submitFeedback(sessionId: string, rating: number, comment?: string): Promise<void> {
    await this.fetchWithRetry(`${this.baseUrl.replace('/api/chat', '/api/admin/chat')}/sessions/${sessionId}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ rating, comment }),
    });
  }

  /**
   * Create or resume a chat session.
   */
  async createSession(
    visitorId: string,
    customerName?: string,
    channel: string = 'web',
  ): Promise<ChatSession> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: this.getHeaders(),
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
  async getSession(sessionId: string): Promise<{ session: ChatSession & { messages: ChatMessage[] } }> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}`, {
        headers: this.getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Get message history for a session.
   */
  async getMessages(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}/messages?limit=${limit}`, {
        headers: this.getHeaders(),
    });
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
  sendMessageStream(
    sessionId: string,
    message: string,
    onEvent: (event: string, data: Record<string, unknown>) => void,
    onDone: () => void,
    onError: (error: Error) => void,
  ): AbortController {
    const controller = new AbortController();

    fetch(`${this.baseUrl}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
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
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event in buffer

          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;

            let eventType = 'message';
            let eventData = '';

            for (const line of eventBlock.split('\n')) {
              if (line.startsWith('event: ')) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith('data: ')) {
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
              } catch {
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
  async sendMessageSync(sessionId: string, message: string): Promise<string> {
    const response = await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}/messages/sync`, {
      method: 'POST',
      headers: this.getHeaders(),
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
  async endSession(sessionId: string): Promise<void> {
    await this.fetchWithRetry(`${this.baseUrl}/sessions/${sessionId}/end`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  /**
   * Upload a file (image).
   */
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: this.getHeaders({
        // Do not set Content-Type for FormData, browser will do it with boundary
        'Content-Type': '',
      }),
      body: formData,
    });

    // Cleanup hack for the header (browser needs it empty to set boundary)
    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Broadcast typing status.
   */
  async sendTyping(sessionId: string, role: 'user' | 'assistant', isTyping: boolean): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/sessions/${sessionId}/typing`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ role, is_typing: isTyping }),
      });
    } catch (err) {
      // Silent fail for typing indicators
    }
  }
}
