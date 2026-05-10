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
  customer_name: string | null;
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
