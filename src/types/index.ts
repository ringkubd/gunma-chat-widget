/* ── Types ──────────────────────────────────────────────────────── */

/**
 * Pusher / Laravel Echo connection settings.
 * Mirrors the backend's config('gunma-agent.*') Pusher keys.
 */
export interface ChatPusherConfig {
  key: string;
  cluster?: string;
  wsHost?: string;
  wsPort?: number;
  forceTLS?: boolean;
  /** Backend broadcasting auth endpoint. Default: '/api/broadcasting/auth' */
  authEndpoint?: string;
}

/**
 * API route overrides — must match the backend's GUNMA_ROUTE_PREFIX.
 * Default prefix: 'api/chat' (matches backend default).
 */
export interface ChatRouteConfig {
  /** e.g. 'api/chat' — matches GUNMA_ROUTE_PREFIX env var. Default: 'api/chat' */
  prefix?: string;
  /** Override for CSRF cookie path. Default: '/sanctum/csrf-cookie' */
  csrfCookie?: string;
}

/**
 * localStorage key configuration — lets host apps use their own key names.
 */
export interface ChatStorageConfig {
  /** Key used to persist the visitor ID. Default: 'gunma_visitor_id' */
  visitorIdKey?: string;
  /** Key used to persist the session ID. Default: 'gunma_session_id' */
  sessionIdKey?: string;
  /** Keys tried in order to find a Bearer token. Default: ['tk', 'token'] */
  tokenKeys?: string[];
  /** Key used to find the host's guest cart cookie id. Default: 'gunma_cookie' */
  cookieKey?: string;
}

export interface ChatWidgetConfig {
  /** Base URL of the Laravel backend (e.g. 'https://api.example.com') */
  apiUrl: string;
  position?: 'bottom-right' | 'bottom-left';
  theme?: 'light' | 'dark' | 'auto';
  brandName?: string;
  brandColor?: string;
  welcomeMessage?: string;
  visitorId?: string;
  customerName?: string;
  channel?: 'web' | 'admin';
  placeholder?: string;
  zIndex?: number;
  websiteUrl?: string;
  cookieId?: string;
  /** Directly pass a Bearer token (skips localStorage lookup) */
  apiToken?: string;
  /** Provide a function to get the token dynamically (e.g. from Redux/Zustand) */
  getToken?: () => string | null;
  /** Pusher/Echo real-time configuration */
  pusher?: ChatPusherConfig;
  /** API route overrides to match your backend's GUNMA_ROUTE_PREFIX */
  routes?: ChatRouteConfig;
  /** localStorage key overrides */
  storage?: ChatStorageConfig;
  /**
   * Host app's single-product cart endpoint URL.
   * Required for "Add to Cart" buttons rendered in chat messages.
   * Example: 'https://mystore.com/customer/Frontend/Carts'
   * If omitted, single-product add-to-cart is disabled (bulk still works via the package API).
   */
  cartUrl?: string;

  /**
   * In-chat commerce configuration. When provided, the widget exposes a
   * "My Cart / Checkout" panel that mirrors the host storefront flow:
   * cart review → address → delivery → coins → order → Stripe payment.
   * All calls hit the same host endpoints with the same payloads.
   */
  commerce?: ChatCommerceConfig;
}

/**
 * In-chat commerce settings. `frontendBase`/`apiBase` derive host endpoints:
 *   {apiBase}/customer/Frontend/...  (cart, addresses, orders, stripe, login)
 */
export interface ChatCommerceConfig {
  /** API base URL (e.g. 'https://beta-api.gunmahalalfood.com'). Defaults to apiUrl. */
  apiBase?: string;
  /** Storefront base URL, used for product links/handoff. Defaults to websiteUrl. */
  frontendBase?: string;
  /** Customer-facing route prefix. Default: '/customer/Frontend'. */
  routePrefix?: string;
  /** Stripe publishable key (pk_...). Required to enable card payment. */
  stripePublishableKey?: string;
  /** Free-shipping threshold in the store's currency. Default: 10000. */
  freeShippingThreshold?: number;
  /** Default shipping charge. Default: 1200. */
  shippingCharge?: number;
  /** Prefecture that never gets free shipping (Okinawa). Default: '沖縄県'. */
  freeShippingExcludedState?: string;
  /** Default order cutoff time (HH:MM:SS) used for earliest-delivery calc. Default: '14:00:00'. */
  orderCutoffTime?: string;
  /** Enable loyalty coins at checkout. Default: true. */
  enableCoins?: boolean;
  /** Enable Cash on Delivery. Default: true. */
  enableCash?: boolean;
  /** Enable card payment via Stripe. Default: true (requires stripePublishableKey). */
  enableCard?: boolean;
  /** Currency symbol for display. Default: '¥'. */
  currencySymbol?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  visitor_id: string;
  customer_id?: number | null;
  customer_name: string | null;
  customer_email?: string | null;
  channel: string;
  status: string;
  created_at: string;
}

export type SSEEventType = 'thinking' | 'tool_call' | 'tool_result' | 'message' | 'done' | 'error';

export interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
}

export interface ChatState {
  isOpen: boolean;
  isLoading: boolean;
  session: ChatSession | null;
  messages: ChatMessage[];
  error: string | null;
  toolStatus: string | null;
}

/* ── In-chat commerce types (mirror host storefront shapes) ─────── */

export interface CommerceAddress {
  id: number | string;
  name: string;
  phone: string;
  email?: string;
  apartment?: string;
  street?: string;
  chome?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  post_code_id?: number | string;
  customer_name?: string;
  title?: string;
  type?: string;
  customer_id?: number;
}

export interface CommerceCartItem {
  id: number | string;
  product_id: number | string;
  title?: string;
  product_title?: string;
  quantity: number;
  item_price: number;
  total_amount: number;
  total_tax_amount?: number;
  total_discount_amount?: number;
  image?: string | null;
  slug?: string | null;
  unit?: string | null;
}

export interface CommerceDeliveryInfo {
  after_delay: number | null;
  schedules: { id: number | string; schedule: string }[];
}

export interface CommerceOrderResult {
  id: number | string;
  status?: string;
  total_amount?: number;
}

export type CommerceStep =
  | 'cart'
  | 'auth'
  | 'address'
  | 'delivery'
  | 'payment'
  | 'processing'
  | 'success'
  | 'failed';
