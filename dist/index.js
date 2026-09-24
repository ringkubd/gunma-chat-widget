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
export { useCommerce } from './hooks/useCommerce';
// Commerce UI (in-chat checkout)
export { CommercePanel } from './components/commerce/CommercePanel';
// API Client
export { ChatApi } from './lib/api';
export { sanitizeHtml, escapeHtml, escapeAttr } from './lib/sanitize';
export { getStrings } from './lib/i18n';
