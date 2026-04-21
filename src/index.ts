// @gunma/chat-widget — Main exports

// Components
export { ChatWidget } from './components/ChatWidget';
export { ChatBubble } from './components/ChatBubble';
export { ChatHeader } from './components/ChatHeader';
export { MessageList } from './components/MessageList';
export { MessageBubble } from './components/MessageBubble';
export { MessageInput } from './components/MessageInput';
export { TypingIndicator } from './components/TypingIndicator';

// Hooks
export { useChat } from './hooks/useChat';
export { useCartActions } from './hooks/useCartActions';

// API Client
export { ChatApi } from './lib/api';

// Types
export type {
  ChatWidgetConfig,
  ChatMessage,
  ChatSession,
  ChatState,
  SSEEvent,
  SSEEventType,
} from './types';
