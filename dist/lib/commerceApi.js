/**
 * CommerceApi — talks to the HOST storefront endpoints (same ones the site uses)
 * so in-chat checkout behaves identically to the website checkout.
 *
 * All requests: credentials:'include', Bearer token from localStorage['tk'],
 * X-Visitor-Id, and X-XSRF-TOKEN (fetched from /sanctum/csrf-cookie).
 */
const CSRF_PATH = '/sanctum/csrf-cookie';
export class CommerceApi {
    constructor(config) {
        this.csrfReady = false;
        this.apiBase = config.apiBase.replace(/\/$/, '');
        this.prefix = config.routePrefix ?? '/customer/Frontend';
        this.getToken = config.getToken ?? (() => (typeof window !== 'undefined' ? localStorage.getItem('tk') : null));
        this.getCookie = config.getCookie ?? (() => (typeof window !== 'undefined' ? localStorage.getItem('cookie') : null));
        this.getVisitorId = config.getVisitorId ?? (() => (typeof window !== 'undefined' ? localStorage.getItem('vid') : null));
    }
    url(path) {
        return `${this.apiBase}${this.prefix}${path}`;
    }
    readXsrf() {
        if (typeof document === 'undefined')
            return null;
        const m = document.cookie.match(/(?:^|;)\s*XSRF-TOKEN=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : null;
    }
    async ensureCsrf() {
        if (this.csrfReady || typeof window === 'undefined')
            return;
        if (this.readXsrf()) {
            this.csrfReady = true;
            return;
        }
        try {
            await fetch(`${this.apiBase}${CSRF_PATH}`, { credentials: 'include' });
            this.csrfReady = true;
        }
        catch {
            // Best-effort; requests still sent.
        }
    }
    async headers(json = true) {
        const h = { Accept: 'application/json' };
        if (json)
            h['Content-Type'] = 'application/json';
        const token = this.getToken();
        if (token)
            h['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        const vid = this.getVisitorId();
        if (vid)
            h['X-Visitor-Id'] = vid;
        const xsrf = this.readXsrf();
        if (xsrf)
            h['X-XSRF-TOKEN'] = xsrf;
        return h;
    }
    normalize(body) {
        // Backend responses wrap data as { data: ... } or { data: { data: ... } }.
        if (body == null)
            return body;
        if (body.data !== undefined) {
            // Prefer the innermost `data` when it looks like the payload.
            return body.data?.data !== undefined ? body.data.data : body.data;
        }
        return body;
    }
    async request(path, init = {}, json = true) {
        const method = (init.method ?? 'GET').toUpperCase();
        if (method !== 'GET')
            await this.ensureCsrf();
        const res = await fetch(this.url(path), {
            ...init,
            headers: { ...(await this.headers(json)), ...init.headers },
            credentials: 'include',
        });
        if (!res.ok) {
            let detail = '';
            try {
                detail = JSON.stringify(await res.json());
            }
            catch { /* ignore */ }
            throw new Error(`${method} ${path} failed: ${res.status} ${detail}`);
        }
        if (res.status === 204)
            return undefined;
        const body = await res.json().catch(() => null);
        return this.normalize(body);
    }
    /* ── Cart ───────────────────────────────────────────────────── */
    async getCart() {
        const cookie = this.getCookie();
        const path = cookie ? `/Customer-Carts/${encodeURIComponent(cookie)}` : `/Customer-Carts`;
        const data = await this.request(path);
        const carts = data?.carts ?? data ?? [];
        // Persist the (possibly rotated) guest cookie for subsequent calls.
        if (data?.cookie && typeof window !== 'undefined') {
            localStorage.setItem('cookie', data.cookie);
        }
        return Array.isArray(carts) ? carts : [];
    }
    async removeCartItem(id) {
        await this.request(`/Carts/${id}`, { method: 'DELETE' });
    }
    /* ── Addresses ──────────────────────────────────────────────── */
    async getDefaultAddresses() {
        const data = await this.request('/Default-Addresses');
        return Array.isArray(data) ? data : (data?.data ?? []);
    }
    async getAllAddresses() {
        const data = await this.request('/Addresses');
        return Array.isArray(data) ? data : (data?.data ?? []);
    }
    async createAddress(payload) {
        return this.request('/Addresses', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
    async getPostCodes(value) {
        const data = await this.request(`/post-codes/${encodeURIComponent(value)}`);
        return Array.isArray(data) ? data : (data?.data ?? []);
    }
    async getDeliveryInfo(postalCode) {
        const data = await this.request(`/delivery-infos/${encodeURIComponent(postalCode)}`);
        return {
            after_delay: data?.after_delay ?? null,
            schedules: data?.schedules ?? [],
        };
    }
    /* ── Delivery date ──────────────────────────────────────────── */
    async getCurrentDateTime() {
        return this.request('/current-date-time');
    }
    async getDayOff() {
        return this.request('/day-off');
    }
    /* ── Coins ──────────────────────────────────────────────────── */
    async getCoins() {
        const data = await this.request('/use-coins');
        const n = typeof data === 'number' ? data : Number(data?.coins ?? data ?? 0);
        return Number.isFinite(n) ? n : 0;
    }
    async applyCoins(coins, totalAmount) {
        await this.request('/apply-coins', {
            method: 'POST',
            body: JSON.stringify({ coins, total_amount: totalAmount }),
        });
    }
    async deleteCoins() {
        await this.request('/delete-use-coins', { method: 'DELETE' });
    }
    /* ── Auth ───────────────────────────────────────────────────── */
    async login(email, password) {
        const cookie = this.getCookie() ?? '';
        const data = await this.request('/Login', {
            method: 'POST',
            body: JSON.stringify({ email, password, cookie }),
        });
        const token = data?.token ?? data?.data?.token;
        if (!token)
            throw new Error('Login failed: no token returned.');
        if (typeof window !== 'undefined')
            localStorage.setItem('tk', token);
        return { token, user: data?.user ?? data?.data?.user };
    }
    /**
     * Register a new customer. Mirrors the storefront /Register payload
     * (name, contact_no, email, password, cookie) and stores the returned token.
     */
    async register(payload) {
        const cookie = this.getCookie() ?? '';
        const data = await this.request('/Register', {
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
        if (typeof window !== 'undefined')
            localStorage.setItem('tk', token);
        return { token, user: data?.user ?? data?.data?.user };
    }
    async isLoggedIn() {
        return !!this.getToken();
    }
    /* ── Orders + payment ───────────────────────────────────────── */
    async createOrder(payload) {
        const data = await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        return data;
    }
    async getStripeSecret(amount, email, orderId) {
        const data = await this.request('/stripe', {
            method: 'POST',
            body: JSON.stringify({ amount, email, order_id: orderId }),
        });
        const secret = data?.clientSecret ?? data?.data?.clientSecret;
        if (!secret)
            throw new Error('Could not create payment intent.');
        return secret;
    }
    async confirmStripeOrder(id, body) {
        await this.request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
    }
}
