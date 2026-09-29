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

const listeners = new Map<PikuEvent, Set<Handler>>();

export function on(event: PikuEvent, handler: Handler): () => void {
  let set = listeners.get(event);
  if (!set) { set = new Set(); listeners.set(event, set); }
  set.add(handler);
  return () => { set.delete(handler); };
}

export function emit(event: PikuEvent, payload: Record<string, unknown> = {}): void {
  listeners.get(event)?.forEach((h) => { try { h(payload); } catch { /* never break chat */ } });
  try {
    window?.dispatchEvent(new CustomEvent(`piku:${event}`, { detail: payload }));
  } catch { /* ignore */ }
}
