'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import { useCartActions } from '../hooks/useCartActions';
import { ChatBubble } from './ChatBubble';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
export function ChatWidget(config) {
    const { isOpen, isLoading, messages, error, toolStatus, isAiEnabled, toggle, sendMessage, uploadFile, endChat, cancelRequest, } = useChat(config);
    const { handleMessageClick } = useCartActions({ apiUrl: config.apiUrl });
    const [lastMessage, setLastMessage] = useState('');
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
    return (_jsxs("div", { style: positionStyle, className: "gunma-chat-root", children: [isOpen && (_jsxs("div", { className: "gunma-chat-panel", style: { '--gunma-brand': brandColor }, children: [_jsx(ChatHeader, { brandName: brandName, brandColor: brandColor, onClose: toggle, onEndChat: endChat, isConnected: true }), _jsx("div", { onClick: handleMessageClick, children: _jsx(MessageList, { messages: messages, welcomeMessage: welcomeMessage, brandColor: brandColor, websiteUrl: config.websiteUrl || 'https://api.gunmahalalfood.com' }) }), (isLoading || toolStatus) && (_jsxs("div", { className: "gunma-status-bar", children: [_jsx(TypingIndicator, {}), toolStatus && (_jsx("span", { className: "gunma-tool-status", children: toolStatus })), isLoading && (_jsx("button", { className: "gunma-cancel-btn", onClick: cancelRequest, "aria-label": "Cancel request", title: "Cancel", children: "\u2715" }))] })), error && (_jsxs("div", { className: "gunma-error-bar", children: [_jsx("span", { children: error }), _jsx("button", { className: "gunma-retry-btn", onClick: handleRetry, children: "Retry" })] })), _jsx(MessageInput, { onSend: handleSend, onUpload: uploadFile, isLoading: isLoading, placeholder: config.placeholder || 'Type a message...' })] })), _jsx(ChatBubble, { isOpen: isOpen, onClick: toggle, brandColor: brandColor, unreadCount: 0 })] }));
}
