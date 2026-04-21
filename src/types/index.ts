/* ── Types ──────────────────────────────────────────────────────── */

export interface ChatWidgetConfig {
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
