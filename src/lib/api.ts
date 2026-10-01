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
  private getCookieIdFn?: () => string | null;
  private cookieStoreKey: string;
  private apiToken?: string;
  private getTokenFn?: () => string | null;
  private visitorId?: string;
  private sessionId?: string;
  private chatLang?: string;

  constructor(apiUrl: string, cookieId?: string, apiToken?: string, visitorId?: string, getCookieId?: () => string | null, cookieStoreKey?: string, getToken?: () => string | null) {
    this.baseUrl = apiUrl.replace(/\/$/, '');
    this.cookieId = cookieId;
    this.getCookieIdFn = getCookieId;
    this.cookieStoreKey = cookieStoreKey || 'cookie';
    this.apiToken = apiToken;
    this.getTokenFn = getToken;
    this.visitorId = visitorId;
  }

  /** Resolve the guest cart identity now: lazy resolver > static value. */
  private resolveCookieId(): string | undefined {
    try {
      const live = this.getCookieIdFn?.();
      if (live) return live;
    } catch { /* ignore host errors */ }
    return this.cookieId;
  }

  /**
   * Resolve the auth token on EVERY request (lazy) so an in-chat login is
   * recognised immediately — the token is captured at mount otherwise and the
   * widget keeps talking as a guest.
   */
  private resolveToken(): string | undefined {
    try {
      const live = this.getTokenFn?.();
      if (live) return live;
    } catch { /* ignore host errors */ }
    return this.apiToken || undefined;
  }

  private getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    const token = this.resolveToken();
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    if (this.visitorId) {
      headers['X-Visitor-Id'] = this.visitorId;
    }

    // Identify the chat session so tools (e.g. claims/tickets) can be linked
    // back to this conversation.
    if (this.sessionId) {
      headers['X-Chat-Session-Id'] = this.sessionId;
    }

    // Customer-chosen reply language (so the agent honors it over guessing).
    if (this.chatLang) {
      headers['X-Chat-Lang'] = this.chatLang;
    }

    // Remove headers with empty values (useful for FormData)
    Object.keys(headers).forEach(key => {
        if (headers[key] === '') {
            delete headers[key];
        }
    });

    return headers;
  }

  /** Remember the active chat session id (sent as X-Chat-Session-Id). */
  setSessionId(id?: string | null): void {
    this.sessionId = id || undefined;
  }

  /** Set the customer-chosen reply language (sent as X-Chat-Lang). */
  setLang(code?: string | null): void {
    this.chatLang = code || undefined;
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
                credentials: 'include',
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
   * Uses the public chat route so the widget can call it with a Bearer token.
   */
  async linkSession(visitorId: string, customerId: number): Promise<void> {
    await this.fetchWithRetry(`${this.baseUrl}/link-session`, {
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
   * Persist the guest cart identity the server hands back.
   * - localStorage[cookieKey]: the storefront's own cookie value (its bag
   *   query is gated on this).
   * - a `guest_id` cookie on the registrable parent domain: the storefront's
   *   cart/checkout reads ONLY this cookie (it ignores its path param). The
   *   chat route can't set it server-side (stateful → double-encrypted), so we
   *   write the exact value the server gave us, client-side.
   */
  private persistGuestCookie(value?: string | null): void {
    if (!value || typeof window === 'undefined') return;
    try { localStorage.setItem(this.cookieStoreKey, value); } catch { /* ignore */ }

    try {
      if (window.location.protocol !== 'https:') return;
      const host = window.location.hostname;
      if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return;
      const parts = host.split('.');
      if (parts.length < 3) return; // apex domain — host-only cookie suffices
      const domain = parts.slice(-2).join('.');
      const maxAge = 60 * 60 * 24 * 30; // 30 days
      document.cookie = `guest_id=${value}; domain=.${domain}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
    } catch { /* never break the storefront */ }
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
        cookie_id: this.resolveCookieId(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const data = await response.json();
    // Keep the host's guest cart cookie in sync so the storefront bag (which
    // queries off localStorage['cookie']) shows what chat added.
    this.persistGuestCookie(data?.guest_cookie);
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
                    credentials: 'include',
                    body: JSON.stringify({ message, cookie_id: this.resolveCookieId() }),
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
            'Content-Type': '',
          }),
          credentials: 'include',
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
                        credentials: 'include',
                        body: JSON.stringify({ role, is_typing: isTyping }),
                    });
    } catch (err) {
      // Silent fail for typing indicators
    }
  }
}
