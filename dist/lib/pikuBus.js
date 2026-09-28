const listeners = new Map();
export function on(event, handler) {
    let set = listeners.get(event);
    if (!set) {
        set = new Set();
        listeners.set(event, set);
    }
    set.add(handler);
    return () => { set.delete(handler); };
}
export function emit(event, payload = {}) {
    listeners.get(event)?.forEach((h) => { try {
        h(payload);
    }
    catch { /* never break chat */ } });
    try {
        window?.dispatchEvent(new CustomEvent(`piku:${event}`, { detail: payload }));
    }
    catch { /* ignore */ }
}
