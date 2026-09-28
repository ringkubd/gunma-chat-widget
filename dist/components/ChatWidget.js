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
import { PikuDoodle } from './Doodle';
import { usePageTracking } from '../hooks/usePageTracking';
export function ChatWidget(config) {
    const { isOpen, isLoading, messages, error, toolStatus, isAiEnabled, isAgentTyping, isConnected, unreadCount, isEnded, toggle, sendMessage, sendTyping, uploadFile, endChat, cancelRequest, getSessionId, } = useChat(config);
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
        };
        const openLogin = () => {
            openChatIfClosed();
            setShowCommerce(true);
            commerce.setStep('auth');
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
    const brandColor = config.brandColor || '#10b981';
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
        const iv = window.setInterval(load, 8000);
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
    // Live page heartbeat so Piku knows what the customer is viewing.
    usePageTracking(config, getSessionId, widgetEnabled);
    // Doodle click with context → open chat and let Piku answer right away.
    const openWithPrefill = useCallback((prefill) => {
        toggle();
        if (prefill) {
            window.setTimeout(() => sendMessage(prefill), 600);
        }
    }, [toggle, sendMessage]);
    const handleSend = useCallback((text) => {
        setLastMessage(text);
        sendMessage(text);
    }, [sendMessage]);
    const handleRetry = useCallback(() => {
        if (lastMessage) {
            sendMessage(lastMessage);
        }
    }, [lastMessage, sendMessage]);
    return (_jsxs("div", { style: positionStyle, className: `gunma-chat-root ${themeClass}`, children: [widgetEnabled && isOpen && (_jsxs("div", { className: "gunma-chat-panel", style: { '--gunma-brand': brandColor }, children: [_jsx(ChatHeader, { brandName: brandName, brandColor: brandColor, onClose: toggle, onEndChat: endChat, isConnected: isConnected, onCartClick: commerce.enabled ? () => setShowCommerce((v) => !v) : undefined, cartCount: commerce.enabled ? commerce.cart.length : 0, strings: strings }), commerce.enabled && showCommerce ? (_jsx(CommercePanel, { commerce: commerce, brandColor: brandColor, onClose: () => setShowCommerce(false), freeShippingThreshold: commerce.freeShippingThreshold, strings: strings })) : (_jsxs(_Fragment, { children: [_jsx("div", { onClick: handleMessageClick, children: _jsx(MessageList, { messages: messages, welcomeMessage: welcomeMessage, brandColor: brandColor, websiteUrl: config.websiteUrl || 'https://api.gunmahalalfood.com', currencySymbol: config.commerce?.currencySymbol ?? '¥' }) }), (isLoading || toolStatus || isAgentTyping) && (_jsxs("div", { className: "gunma-status-bar", children: [(isLoading || isAgentTyping) && _jsx(TypingIndicator, {}), toolStatus && (_jsx("span", { className: "gunma-tool-status", children: toolStatus })), isLoading && (_jsx("button", { className: "gunma-cancel-btn", onClick: cancelRequest, "aria-label": "Cancel request", title: "Cancel", children: "\u2715" }))] })), error && (_jsxs("div", { className: "gunma-error-bar", children: [_jsx("span", { children: error }), _jsx("button", { className: "gunma-retry-btn", onClick: handleRetry, children: "Retry" })] })), isEnded ? (_jsx("div", { className: "gunma-commerce-muted", style: { padding: '12px 16px', textAlign: 'center' }, children: strings.sessionEndedLocked })) : (_jsx(MessageInput, { onSend: handleSend, onUpload: uploadFile, onTyping: sendTyping, isLoading: isLoading, placeholder: config.placeholder || strings.placeholder }))] }))] })), _jsx(PikuDoodle, { doodle: { ...(config.doodle || { enabled: true }), enabled: doodleEnabled }, brandColor: brandColor, chatOpen: isOpen, onOpenChat: widgetEnabled ? openWithPrefill : () => { } }), widgetEnabled && (_jsx(ChatBubble, { isOpen: isOpen, onClick: toggle, brandColor: brandColor, unreadCount: unreadCount }))] }));
}
