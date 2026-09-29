'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import { useCartActions } from '../hooks/useCartActions';
import { useCommerce } from '../hooks/useCommerce';
import { ChatBubble } from './ChatBubble';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { CommercePanel } from './commerce/CommercePanel';
import { getStrings } from '../lib/i18n';
import * as pikuBus from '../lib/pikuBus';
import { reportPikuEvent } from '../lib/pikuAnalytics';
import { usePikuSpeech } from '../hooks/usePikuSpeech';
import { usePikuBrain } from '../hooks/usePikuBrain';
import { usePikuSignals } from '../hooks/usePikuSignals';
import { usePageTracking } from '../hooks/usePageTracking';
export function ChatWidget(config) {
    const { isOpen, isLoading, messages, error, toolStatus, isAiEnabled, isAgentTyping, isConnected, unreadCount, isEnded, toggle, sendMessage, sendTyping, uploadFile, endChat, cancelRequest, getSessionId, appendAssistantLocal, } = useChat(config);
    // Keep an up-to-date isOpen ref so event handlers can open the panel.
    const isOpenRef = React.useRef(isOpen);
    React.useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
    // Keep a stable ref for the cart refresher used by the click handler.
    const refreshCommerceCartRef = React.useRef(null);
    const { handleMessageClick } = useCartActions({
        apiUrl: config.apiUrl,
        routePrefix: config.routes?.prefix,
        cartUrl: config.cartUrl,
        cookieKey: config.storage?.cookieKey,
        apiToken: config.apiToken,
        getToken: config.getToken,
        onAdded: () => {
            setShowCommerce(true);
            void refreshCommerceCartRef.current?.();
        },
    });
    const [lastMessage, setLastMessage] = useState('');
    const [showCommerce, setShowCommerce] = useState(false);
    // Fully hidden (reopen tab shown) vs minimized (Piku bubble stays).
    const [widgetClosed, setWidgetClosed] = useState(false);
    const rootRef = React.useRef(null);
    const commerce = useCommerce(config, {
        onCartChanged: () => {
            if (typeof window !== 'undefined') {
                localStorage.setItem('cart_updated', String(Date.now()));
            }
        },
    });
    React.useEffect(() => {
        refreshCommerceCartRef.current = commerce.refreshCart;
    }, [commerce.refreshCart]);
    // AI-driven cart mutations (remove/qty/clear/add) → host bag + cart page
    // + in-chat commerce panel all refetch without a manual reload.
    React.useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const handler = () => {
            try {
                localStorage.setItem('cart_updated', String(Date.now())); // cross-tab (site convention)
                window.dispatchEvent(new CustomEvent('gunma-cart-changed')); // same-tab host hook
            }
            catch { /* ignore */ }
            void refreshCommerceCartRef.current?.();
        };
        return pikuBus.on('cart-changed', handler);
    }, []);
    // Order placed → thank-you bubble in the chat + retire stale cart CTAs,
    // so the flow does NOT land back on an old "Add ALL to Cart" message.
    const [orderJustPlaced, setOrderJustPlaced] = useState(false);
    const appendLocalMessageRef = React.useRef(null);
    React.useEffect(() => { appendLocalMessageRef.current = appendAssistantLocal; }, [appendAssistantLocal]);
    React.useEffect(() => {
        const clearCtas = () => setOrderJustPlaced(true);
        const handler = (payload) => {
            setOrderJustPlaced(true);
            void refreshCommerceCartRef.current?.();
            const oid = payload.order_id != null ? `#${payload.order_id}` : '';
            appendLocalMessageRef.current?.(`🎉 Order ${oid} successfully placed! Kitchen-e ekhuni recipe kaj shuru korese 🙂`);
            // Attributed order → the business-impact metric.
            reportPikuEvent(analyticsCfgRef.current, 'order_placed', {
                order_id: payload.order_id ?? null,
                value: payload.value ?? payload.total ?? null,
            }, {}, `order_${payload.order_id ?? Date.now()}`);
        };
        return pikuBus.on('order-placed', handler);
    }, []);
    // When the agent adds to cart / prepares checkout / asks for login, open
    // the in-chat commerce panel at the right step (no page navigation).
    React.useEffect(() => {
        if (!commerce.enabled)
            return;
        const openChatIfClosed = () => {
            if (!isOpenRef.current)
                toggle();
        };
        const openCheckout = () => {
            openChatIfClosed();
            setShowCommerce(true);
            commerce.setStep('cart');
            void refreshCommerceCartRef.current?.();
            reportPikuEvent(analyticsCfgRef.current, 'checkout_opened');
        };
        const openLogin = () => {
            openChatIfClosed();
            setShowCommerce(true);
            commerce.setStep('auth');
            reportPikuEvent(analyticsCfgRef.current, 'login_opened');
        };
        // Register a direct bridge too — resilient to event timing/duplicate
        // widget module instances in the host bundle.
        const w = window;
        w.__gunmaOpenCheckout = openCheckout;
        w.__gunmaOpenLogin = openLogin;
        window.addEventListener('gunma:open_checkout', openCheckout);
        window.addEventListener('gunma:open_login', openLogin);
        return () => {
            window.removeEventListener('gunma:open_checkout', openCheckout);
            window.removeEventListener('gunma:open_login', openLogin);
            delete w.__gunmaOpenCheckout;
            delete w.__gunmaOpenLogin;
        };
    }, [commerce.enabled, commerce.setStep, toggle]);
    const position = config.position || 'bottom-right';
    const brandColor = config.brandColor || '#0da487';
    const brandName = config.brandName || 'Piku';
    const welcomeMessage = config.welcomeMessage || 'Hello, this is Piku from Gunma Halal Food Customer Support. How may I assist you today?';
    const theme = config.theme || 'auto';
    const themeClass = theme === 'dark' ? 'gunma-theme-dark' : theme === 'light' ? 'gunma-theme-light' : 'gunma-theme-auto';
    const strings = getStrings(config.locale);
    const positionStyle = {
        position: 'fixed',
        zIndex: config.zIndex || 9999,
        ...(position === 'bottom-right'
            ? { bottom: '24px', right: '24px' }
            : { bottom: '24px', left: '24px' }),
    };
    // Analytics reporter config (fire-and-forget business impact).
    const analyticsCfg = {
        apiUrl: config.apiUrl,
        routePrefix: config.routes?.prefix ?? 'api/chat',
        getSessionId,
        getVisitorId: () => {
            try {
                const k = config.storage?.visitorIdKey;
                return k ? localStorage.getItem(k) : null;
            }
            catch {
                return null;
            }
        },
    };
    const analyticsCfgRef = React.useRef(analyticsCfg);
    analyticsCfgRef.current = analyticsCfg;
    // Doodle direct-relation: widget toggle → doodle visibility events.
    React.useEffect(() => {
        pikuBus.emit(isOpen ? 'chat-opened' : 'chat-closed');
        if (isOpen)
            reportPikuEvent(analyticsCfgRef.current, 'chat_opened', {}, {}, 'chat_opened');
    }, [isOpen]);
    // ── Avoid right-side host overlays (cart drawer etc.) ──────────────
    // The storefront Shopping Bag is an antd Drawer sliding in from the right;
    // Piku floats above it (widget z-index > drawer). Watch the DOM and auto-move
    // Piku left by the drawer's width so its Total / Checkout button stay clear.
    // When a drawer covers most of a small screen, dim Piku instead of shifting.
    const avoidOverlays = config.doodle?.avoidRightOverlays !== false;
    React.useEffect(() => {
        if (typeof window === 'undefined' || !avoidOverlays)
            return;
        const root = rootRef.current;
        if (!root)
            return;
        const SEL = config.doodle?.overlaySelector || '.ant-drawer.ant-drawer-open.ant-drawer-right';
        let raf = 0;
        const apply = () => {
            raf = 0;
            const el = document.querySelector(SEL);
            const wrapper = el?.querySelector('.ant-drawer-content-wrapper') || el;
            if (!wrapper) {
                root.style.setProperty('--gunma-avoid-x', '0px');
                root.classList.remove('gunma-obscured');
                return;
            }
            const rect = wrapper.getBoundingClientRect();
            const vw = window.innerWidth;
            const coversScreen = vw <= 768 && rect.width >= vw * 0.9;
            if (coversScreen) {
                // Drawer fills the screen → step aside entirely.
                root.classList.add('gunma-obscured');
                root.style.setProperty('--gunma-avoid-x', '0px');
                return;
            }
            const shift = Math.min(Math.round(rect.width) + 16, Math.max(0, vw - 80));
            root.classList.remove('gunma-obscured');
            root.style.setProperty('--gunma-avoid-x', `${shift}px`);
        };
        const schedule = () => {
            if (raf)
                return;
            raf = window.requestAnimationFrame(apply);
        };
        const observer = new MutationObserver(schedule);
        observer.observe(document.body, {
            childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'],
        });
        window.addEventListener('resize', schedule);
        apply();
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', schedule);
            if (raf)
                window.cancelAnimationFrame(raf);
            root.style.setProperty('--gunma-avoid-x', '0px');
            root.classList.remove('gunma-obscured');
        };
    }, [avoidOverlays, config.doodle?.overlaySelector]);
    // Agent-settings gates (widget master switch + doodle). Polled so a dashboard
    // toggle takes effect on live pages without a reload.
    const [features, setFeatures] = React.useState({ widget: null, doodle: null });
    React.useEffect(() => {
        if (typeof window === 'undefined' || !config.apiUrl)
            return;
        // Host can hard-disable entirely — skip probing then.
        const hostWidgetOff = config.widget?.enabled === false;
        if (hostWidgetOff) {
            setFeatures({ widget: false, doodle: false });
            return;
        }
        const prefix = config.routes?.prefix ?? 'api/chat';
        let alive = true;
        const load = () => {
            fetch(`${config.apiUrl}/${prefix}/agent-features`, {
                headers: { Accept: 'application/json' },
                credentials: 'include',
            })
                .then((r) => (r.ok ? r.json() : null))
                .then((j) => {
                if (!alive || !j)
                    return;
                setFeatures({ widget: !!j?.widget?.enabled, doodle: !!j?.doodle?.enabled });
            })
                .catch(() => { });
        };
        load();
        // Feature flags rarely change — poll slowly (30s) instead of every 8s to
        // keep concurrent HTTP load flat; refresh immediately on tab return.
        const iv = window.setInterval(() => { if (!document.hidden)
            load(); }, 30000);
        const onVis = () => { if (!document.hidden)
            load(); };
        document.addEventListener('visibilitychange', onVis);
        window.addEventListener('focus', onVis);
        return () => {
            alive = false;
            window.clearInterval(iv);
            document.removeEventListener('visibilitychange', onVis);
            window.removeEventListener('focus', onVis);
        };
    }, [config.apiUrl, config.routes?.prefix, config.widget]);
    const widgetEnabled = config.widget?.enabled !== false
        && (features.widget ?? true);
    const doodleEnabled = (config.doodle?.enabled ?? true) && (features.doodle ?? true);
    // Doodle click with context → open chat and let Piku answer right away.
    const openWithPrefill = useCallback((prefill) => {
        reportPikuEvent(analyticsCfgRef.current, 'chip_click', {}, { prefill: prefill ?? null });
        toggle();
        if (prefill) {
            window.setTimeout(() => sendMessage(prefill), 600);
        }
    }, [toggle, sendMessage]);
    // Doodle engine: activity-driven smart brain (default) or legacy timer.
    const pikuMode = config.doodle?.mode || 'activity';
    const speechEnabled = widgetEnabled && doodleEnabled && !!config.apiUrl;
    const pikuBrain = usePikuBrain({
        enabled: speechEnabled && pikuMode === 'activity',
        chatOpen: isOpen,
        apiUrl: config.apiUrl,
        routePrefix: config.routes?.prefix ?? 'api/chat',
        lang: config.locale,
        getSessionId,
        getToken: config.getToken,
        getVisitorId: () => {
            try {
                const key = config.storage?.visitorIdKey;
                return key ? localStorage.getItem(key) : null;
            }
            catch {
                return null;
            }
        },
        generalLines: config.doodle?.texts?.general,
        allowIdleChatter: config.doodle?.idleChatter !== false,
        maxBudget: config.doodle?.maxBudget,
    });
    // Activity collectors → brain decisions (no timers).
    usePikuSignals(config, pikuBrain.onSignal, speechEnabled && pikuMode === 'activity');
    // Classic timer engine (only when explicitly selected).
    const pikuSpeech = usePikuSpeech({
        enabled: speechEnabled && pikuMode === 'classic',
        chatOpen: isOpen,
        maxMessages: config.doodle?.maxMessages,
        startDelayMs: config.doodle?.startDelayMs,
        minGapMs: config.doodle?.minGapMs,
        apiUrl: config.apiUrl,
        routePrefix: config.routes?.prefix ?? 'api/chat',
        lang: config.locale,
        getSessionId,
        getToken: config.getToken,
        getVisitorId: () => {
            try {
                const key = config.storage?.visitorIdKey;
                return key ? localStorage.getItem(key) : null;
            }
            catch {
                return null;
            }
        },
    });
    const activeSpeech = pikuMode === 'activity' ? pikuBrain : pikuSpeech;
    // Live page heartbeat so Piku knows what the customer is viewing.
    usePageTracking(config, getSessionId, widgetEnabled);
    const handleSend = useCallback((text) => {
        setLastMessage(text);
        sendMessage(text);
    }, [sendMessage]);
    const handleRetry = useCallback(() => {
        if (lastMessage) {
            sendMessage(lastMessage);
        }
    }, [lastMessage, sendMessage]);
    return (_jsxs("div", { ref: rootRef, style: positionStyle, className: `gunma-chat-root ${themeClass} ${position === 'bottom-right' ? 'gunma-pos-right' : 'gunma-pos-left'}`, children: [widgetEnabled && isOpen && !widgetClosed && (_jsxs("div", { className: "gunma-chat-panel", style: { '--gunma-brand': brandColor }, children: [_jsx(ChatHeader, { brandName: brandName, brandColor: brandColor, onClose: toggle, onCloseWidget: () => setWidgetClosed(true), onEndChat: endChat, isConnected: isConnected, onCartClick: commerce.enabled ? () => setShowCommerce((v) => !v) : undefined, cartCount: commerce.enabled ? commerce.cart.length : 0, strings: strings }), commerce.enabled && showCommerce ? (_jsx(CommercePanel, { commerce: commerce, brandColor: brandColor, onClose: () => {
                            setShowCommerce(false);
                            commerce.setStep('cart'); // next open shows the fresh (empty) cart
                        }, freeShippingThreshold: commerce.freeShippingThreshold, strings: strings })) : (_jsxs(_Fragment, { children: [_jsx("div", { onClick: handleMessageClick, children: _jsx(MessageList, { messages: messages, welcomeMessage: welcomeMessage, brandColor: brandColor, websiteUrl: config.websiteUrl || 'https://api.gunmahalalfood.com', currencySymbol: config.commerce?.currencySymbol ?? '¥', retireCartCtas: orderJustPlaced }) }), (isLoading || toolStatus || isAgentTyping) && (_jsxs("div", { className: "gunma-status-bar", children: [(isLoading || isAgentTyping) && _jsx(TypingIndicator, {}), toolStatus && (_jsx("span", { className: "gunma-tool-status", children: toolStatus })), isLoading && (_jsx("button", { className: "gunma-cancel-btn", onClick: cancelRequest, "aria-label": "Cancel request", title: "Cancel", children: "\u2715" }))] })), error && (_jsxs("div", { className: "gunma-error-bar", children: [_jsx("span", { children: error }), _jsx("button", { className: "gunma-retry-btn", onClick: handleRetry, children: "Retry" })] })), isEnded ? (_jsx("div", { className: "gunma-commerce-muted", style: { padding: '12px 16px', textAlign: 'center' }, children: strings.sessionEndedLocked })) : (_jsx(MessageInput, { onSend: handleSend, onUpload: uploadFile, onTyping: sendTyping, isLoading: isLoading, placeholder: config.placeholder || strings.placeholder }))] }))] })), widgetEnabled && !widgetClosed && (_jsx(ChatBubble, { isOpen: isOpen, onClick: toggle, brandColor: brandColor, unreadCount: unreadCount, speech: activeSpeech.message, chips: activeSpeech.chips, onChipClick: openWithPrefill, variant: config.doodle?.variant ?? 'robot' })), widgetEnabled && widgetClosed && (_jsxs("button", { className: "gunma-reopen-tab", onClick: () => { setWidgetClosed(false); if (!isOpen)
                    toggle(); }, "aria-label": "Reopen Piku chat", title: "Open Piku chat", style: { '--gunma-brand': brandColor }, children: [_jsx("span", { className: "gunma-reopen-face", "aria-hidden": "true", children: _jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("rect", { x: "4", y: "7", width: "16", height: "12", rx: "5" }), _jsx("circle", { cx: "9.5", cy: "13", r: "1.6", fill: "currentColor", stroke: "none" }), _jsx("circle", { cx: "14.5", cy: "13", r: "1.6", fill: "currentColor", stroke: "none" }), _jsx("path", { d: "M10 16.5c1.2.9 2.8.9 4 0" }), _jsx("path", { d: "M12 3v3M9 4.2 10.4 6M15 4.2 13.6 6" })] }) }), _jsx("span", { className: "gunma-reopen-label", children: "Piku" })] }))] }));
}
