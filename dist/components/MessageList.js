'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
export function MessageList({ messages, welcomeMessage, brandColor, websiteUrl }) {
    const bottomRef = useRef(null);
    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    return (_jsxs("div", { className: "gunma-messages", children: [messages.length === 0 && (_jsxs("div", { className: "gunma-welcome", children: [_jsx("div", { className: "gunma-welcome-icon", style: { backgroundColor: `${brandColor}20` }, children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: brandColor, strokeWidth: "1.5", width: "32", height: "32", children: _jsx("path", { d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" }) }) }), _jsx("p", { className: "gunma-welcome-text", children: welcomeMessage })] })), messages.map((msg) => (_jsx(MessageBubble, { message: msg, brandColor: brandColor, websiteUrl: websiteUrl }, msg.id))), _jsx("div", { ref: bottomRef })] }));
}
