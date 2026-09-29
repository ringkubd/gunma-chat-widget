/**
 * Tiny typed event bus shared by the chat widget and the Piku doodle so they
 * stay in direct sync (both live in the same bundle/window):
 *
 *   useChat      → emits cart-added / order-updated / cart-changed / chat-closed
 *   ChatWidget   → emits chat-closed / chat-opened on toggle
 *   PikuDoodle   → reacts (celebrates cart add, order update, shows related line)
 *
 * Window-level fallback keeps it working even if two module instances ever
 * end up in a host bundle.
 */
export type PikuEvent = 'cart-added' | 'order-updated' | 'order-placed' | 'cart-changed' | 'chat-closed' | 'chat-opened';
type Handler = (payload: Record<string, unknown>) => void;
export declare function on(event: PikuEvent, handler: Handler): () => void;
export declare function emit(event: PikuEvent, payload?: Record<string, unknown>): void;
export {};
