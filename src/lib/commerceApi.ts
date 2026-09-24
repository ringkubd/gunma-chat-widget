/**
 * CommerceApi — talks to the HOST storefront endpoints (same ones the site uses)
 * so in-chat checkout behaves identically to the website checkout.
 *
 * All requests: credentials:'include', Bearer token from localStorage['tk'],
 * X-Visitor-Id, and X-XSRF-TOKEN (fetched from /sanctum/csrf-cookie).
 */

import type {
  CommerceAddress,
  CommerceCartItem,
  CommerceDeliveryInfo,
  CommerceOrderResult,
} from '../types';

export interface CommerceApiConfig {
  /** API origin, e.g. https://beta-api.gunmahalalfood.com */
  apiBase: string;
  /** Customer route prefix, default: /customer/Frontend */
  routePrefix?: string;
  /** Bearer token resolver (localStorage['tk'] by default). */
  getToken?: () => string | null;
  /** Guest cart cookie (localStorage['cookie'] by default). */
  getCookie?: () => string | null;
  /** Visitor id resolver (localStorage['vid'] by default). */
  getVisitorId?: () => string | null;
}

const CSRF_PATH = '/sanctum/csrf-cookie';

export class CommerceApi {
  private apiBase: string;
  private prefix: string;
  private getToken: () => string | null;
  private getCookie: () => string | null;
  private getVisitorId: () => string | null;
  private csrfReady = false;

  constructor(config: CommerceApiConfig) {
    this.apiBase = config.apiBase.replace(/\/$/, '');
    this.prefix = config.routePrefix ?? '/customer/Frontend';
    this.getToken = config.getToken ?? (() => (typeof window !== 'undefined' ? localStorage.getItem('tk') : null));
    this.getCookie = config.getCookie ?? (() => (typeof window !== 'undefined' ? localStorage.getItem('cookie') : null));
    this.getVisitorId = config.getVisitorId ?? (() => (typeof window !== 'undefined' ? localStorage.getItem('vid') : null));
  }

  private url(path: string): string {
    return `${this.apiBase}${this.prefix}${path}`;
  }

  private readXsrf(): string | null {
    if (typeof document === 'undefined') return null;
    const m = document.cookie.match(/(?:^|;)\s*XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  private async ensureCsrf(): Promise<void> {
    if (this.csrfReady || typeof window === 'undefined') return;
    if (this.readXsrf()) { this.csrfReady = true; return; }
    try {
      await fetch(`${this.apiBase}${CSRF_PATH}`, { credentials: 'include' });
      this.csrfReady = true;
    } catch {
      // Best-effort; requests still sent.
    }
  }

  private async headers(json = true): Promise<Record<string, string>> {
    const h: Record<string, string> = { Accept: 'application/json' };
    if (json) h['Content-Type'] = 'application/json';

    const token = this.getToken();
    if (token) h['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const vid = this.getVisitorId();
    if (vid) h['X-Visitor-Id'] = vid;

    const xsrf = this.readXsrf();
    if (xsrf) h['X-XSRF-TOKEN'] = xsrf;

    return h;
  }

  private normalize(body: any): any {
    // Backend responses wrap data as { data: ... } or { data: { data: ... } }.
    if (body == null) return body;
    if (body.data !== undefined) {
      // Prefer the innermost `data` when it looks like the payload.
      return body.data?.data !== undefined ? body.data.data : body.data;
    }
    return body;
  }

  private async request<T = any>(path: string, init: RequestInit = {}, json = true): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase();
    if (method !== 'GET') await this.ensureCsrf();

    const res = await fetch(this.url(path), {
      ...init,
      headers: { ...(await this.headers(json)), ...(init.headers as Record<string, string> | undefined) },
      credentials: 'include',
    });

    if (!res.ok) {
      let detail = '';
      try { detail = JSON.stringify(await res.json()); } catch { /* ignore */ }
      throw new Error(`${method} ${path} failed: ${res.status} ${detail}`);
    }

    if (res.status === 204) return undefined as unknown as T;
    const body = await res.json().catch(() => null);

    // The backend often returns HTTP 200 even when the operation failed, putting
    // the real status in the body (success:false / status >= 400). Treat those
    // as errors so a failed order never renders a success screen.
    if (body && typeof body === 'object') {
      const bodyStatus = typeof body.status === 'number' ? body.status : null;
      if (body.success === false || (bodyStatus !== null && bodyStatus >= 400)) {
        throw new Error(this.errorMessage(body, `${method} ${path} failed (${bodyStatus ?? 'error'})`));
      }
    }

    return this.normalize(body) as T;
  }

  /**
   * Does a response body represent a failure even though HTTP was 200?
   * The Gunma backend wraps failures as {success:false} or {status:4xx}.
   */
  static bodyIndicatesError(body: any): boolean {
    if (!body || typeof body !== 'object') return false;
    if (body.success === false) return true;
    const status = typeof body.status === 'number' ? body.status : null;
    return status !== null && status >= 400;
  }

  /** Extract a human-readable error message from a response body. */
  private errorMessage(body: any, fallback: string): string {
    const msg = body?.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
    if (msg && typeof msg === 'object') {
      const flat = Object.values(msg).flat().filter(Boolean).join(' ');
      if (flat) return flat;
    }
    if (Array.isArray(body?.errors) && body.errors.length) {
      return body.errors.filter(Boolean).join(' ');
    }
    return fallback;
  }

  /* ── Cart ───────────────────────────────────────────────────── */

  async getCart(): Promise<CommerceCartItem[]> {
    const cookie = this.getCookie();
    const path = cookie ? `/Customer-Carts/${encodeURIComponent(cookie)}` : `/Customer-Carts`;
    const data = await this.request<any>(path);
    const carts = data?.carts ?? data ?? [];
    // Persist the (possibly rotated) guest cookie for subsequent calls.
    if (data?.cookie && typeof window !== 'undefined') {
      localStorage.setItem('cookie', data.cookie);
    }
    return Array.isArray(carts) ? carts : [];
  }

  async removeCartItem(id: number | string): Promise<void> {
    await this.request(`/Carts/${id}`, { method: 'DELETE' });
  }

  /* ── Addresses ──────────────────────────────────────────────── */

  async getDefaultAddresses(): Promise<CommerceAddress[]> {
    const data = await this.request<any>('/Default-Addresses');
    return Array.isArray(data) ? data : (data?.data ?? []);
  }

  async getAllAddresses(): Promise<CommerceAddress[]> {
    const data = await this.request<any>('/Addresses');
    return Array.isArray(data) ? data : (data?.data ?? []);
  }

  async createAddress(payload: Record<string, any>): Promise<CommerceAddress> {
    return this.request<CommerceAddress>('/Addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPostCodes(value: string): Promise<any[]> {
    const data = await this.request<any>(`/post-codes/${encodeURIComponent(value)}`);
    return Array.isArray(data) ? data : (data?.data ?? []);
  }

  async getDeliveryInfo(postalCode: string): Promise<CommerceDeliveryInfo> {
    const data = await this.request<any>(`/delivery-infos/${encodeURIComponent(postalCode)}`);
    return {
      after_delay: data?.after_delay ?? null,
      schedules: data?.schedules ?? [],
    };
  }

  /* ── Delivery date ──────────────────────────────────────────── */

  async getCurrentDateTime(): Promise<{ order_cutoff_time?: string }> {
    return this.request<any>('/current-date-time');
  }

  async getDayOff(): Promise<any> {
    return this.request<any>('/day-off');
  }

  /* ── Coins ──────────────────────────────────────────────────── */

  async getCoins(): Promise<number> {
    const data = await this.request<any>('/use-coins');
    const n = typeof data === 'number' ? data : Number(data?.coins ?? data ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  async applyCoins(coins: number, totalAmount: number): Promise<void> {
    await this.request('/apply-coins', {
      method: 'POST',
      body: JSON.stringify({ coins, total_amount: totalAmount }),
    });
  }

  async deleteCoins(): Promise<void> {
    await this.request('/delete-use-coins', { method: 'DELETE' });
  }

  /* ── Auth ───────────────────────────────────────────────────── */

  async login(email: string, password: string): Promise<{ token: string; user?: any }> {
    const cookie = this.getCookie() ?? '';
    const data = await this.request<any>('/Login', {
      method: 'POST',
      body: JSON.stringify({ email, password, cookie }),
    });
    const token = data?.token ?? data?.data?.token;
    if (!token) throw new Error('Login failed: no token returned.');
    if (typeof window !== 'undefined') localStorage.setItem('tk', token);
    return { token, user: data?.user ?? data?.data?.user };
  }

  /**
   * Register a new customer. Mirrors the storefront /Register payload
   * (name, contact_no, email, password, cookie) and stores the returned token.
   */
  async register(payload: {
    name: string;
    contact_no: string;
    email: string;
    password: string;
    country?: string;
    native_language?: string;
  }): Promise<{ token: string; user?: any }> {
    const cookie = this.getCookie() ?? '';
    const data = await this.request<any>('/Register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, cookie }),
    });
    const token = data?.token ?? data?.data?.token;
    if (!token) {
      // 400 validation errors come back with a message object.
      const msg = data?.message ?? data?.data?.message;
      const text = typeof msg === 'string'
        ? msg
        : msg
          ? Object.values(msg).flat().join(' ')
          : 'Registration failed.';
      throw new Error(text);
    }
    if (typeof window !== 'undefined') localStorage.setItem('tk', token);
    return { token, user: data?.user ?? data?.data?.user };
  }

  async isLoggedIn(): Promise<boolean> {
    return !!this.getToken();
  }

  /* ── Orders + payment ───────────────────────────────────────── */

  async createOrder(payload: Record<string, any>): Promise<CommerceOrderResult> {
    const data = await this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data as CommerceOrderResult;
  }

  async getStripeSecret(amount: number, email: string, orderId: number | string): Promise<string> {
    const data = await this.request<any>('/stripe', {
      method: 'POST',
      body: JSON.stringify({ amount, email, order_id: orderId }),
    });
    const secret = data?.clientSecret ?? data?.data?.clientSecret;
    if (!secret) throw new Error('Could not create payment intent.');
    return secret;
  }

  async confirmStripeOrder(id: number | string, body: Record<string, any>): Promise<void> {
    await this.request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }
}
