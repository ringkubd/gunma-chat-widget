'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { PikuRobotArt } from './PikuRobotArt';
export function MessageList({ messages, welcomeMessage, brandColor, websiteUrl, currencySymbol = '¥', retireCartCtas = false, avatarUrl }) {
    const bottomRef = useRef(null);
    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    return (_jsxs("div", { className: "gunma-messages", children: [messages.length === 0 && (_jsxs("div", { className: "gunma-welcome", children: [_jsx("div", { className: "gunma-welcome-icon gunma-welcome-icon--piku gunma-avatar-round", style: { backgroundColor: `${brandColor}14` }, children: avatarUrl ? (_jsx("img", { className: "gunma-avatar-img", src: avatarUrl, alt: "Piku" })) : (_jsx(PikuRobotArt, { blink: false, talking: false })) }), _jsx("p", { className: "gunma-welcome-text", children: welcomeMessage })] })), messages.map((msg) => (_jsx(MessageBubble, { message: msg, brandColor: brandColor, websiteUrl: websiteUrl, currencySymbol: currencySymbol, retireCartCtas: retireCartCtas, avatarUrl: avatarUrl }, msg.id))), _jsx("div", { ref: bottomRef })] }));
}
