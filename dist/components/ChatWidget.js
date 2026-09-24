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
export function ChatWidget(config) {
    const { isOpen, isLoading, messages, error, toolStatus, isAiEnabled, isAgentTyping, toggle, sendMessage, sendTyping, uploadFile, endChat, cancelRequest, } = useChat(config);
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
    const position = config.position || 'bottom-right';
    const brandColor = config.brandColor || '#10b981';
    const brandName = config.brandName || 'Piku';
    const welcomeMessage = config.welcomeMessage || 'Hello, this is Piku from Gunma Halal Food Customer Support. How may I assist you today?';
    const positionStyle = {
        position: 'fixed',
        zIndex: config.zIndex || 9999,
        ...(position === 'bottom-right'
            ? { bottom: '24px', right: '24px' }
            : { bottom: '24px', left: '24px' }),
    };
    const handleSend = useCallback((text) => {
        setLastMessage(text);
        sendMessage(text);
    }, [sendMessage]);
    const handleRetry = useCallback(() => {
        if (lastMessage) {
            sendMessage(lastMessage);
        }
    }, [lastMessage, sendMessage]);
    return (_jsxs("div", { style: positionStyle, className: "gunma-chat-root", children: [isOpen && (_jsxs("div", { className: "gunma-chat-panel", style: { '--gunma-brand': brandColor }, children: [_jsx(ChatHeader, { brandName: brandName, brandColor: brandColor, onClose: toggle, onEndChat: endChat, isConnected: true, onCartClick: commerce.enabled ? () => setShowCommerce((v) => !v) : undefined, cartCount: commerce.enabled ? commerce.cart.length : 0 }), commerce.enabled && showCommerce ? (_jsx(CommercePanel, { commerce: commerce, brandColor: brandColor, onClose: () => setShowCommerce(false), freeShippingThreshold: commerce.freeShippingThreshold })) : (_jsxs(_Fragment, { children: [_jsx("div", { onClick: handleMessageClick, children: _jsx(MessageList, { messages: messages, welcomeMessage: welcomeMessage, brandColor: brandColor, websiteUrl: config.websiteUrl || 'https://api.gunmahalalfood.com' }) }), (isLoading || toolStatus || isAgentTyping) && (_jsxs("div", { className: "gunma-status-bar", children: [(isLoading || isAgentTyping) && _jsx(TypingIndicator, {}), toolStatus && (_jsx("span", { className: "gunma-tool-status", children: toolStatus })), isLoading && (_jsx("button", { className: "gunma-cancel-btn", onClick: cancelRequest, "aria-label": "Cancel request", title: "Cancel", children: "\u2715" }))] })), error && (_jsxs("div", { className: "gunma-error-bar", children: [_jsx("span", { children: error }), _jsx("button", { className: "gunma-retry-btn", onClick: handleRetry, children: "Retry" })] })), _jsx(MessageInput, { onSend: handleSend, onUpload: uploadFile, onTyping: sendTyping, isLoading: isLoading, placeholder: config.placeholder || 'Type a message...' })] }))] })), _jsx(ChatBubble, { isOpen: isOpen, onClick: toggle, brandColor: brandColor, unreadCount: 0 })] }));
}
