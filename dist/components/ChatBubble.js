'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { PikuRobotArt } from './PikuRobotArt';
export function ChatBubble({ isOpen, onClick, brandColor, unreadCount, speech, chips, onChipClick, variant }) {
    // blink internal — drives the robot eyes/pupil
    const [blink, setBlink] = useState(false);
    useEffect(() => {
        const iv = window.setInterval(() => {
            if (document.hidden || isOpen || speech)
                return;
            if (Math.random() < 0.4) {
                setBlink(true);
                window.setTimeout(() => setBlink(false), 130);
            }
        }, 2600);
        return () => window.clearInterval(iv);
    }, [isOpen, speech]);
    const talking = !!speech;
    return (_jsxs("button", { className: `gunma-bubble ${isOpen ? 'gunma-bubble--open pk-robot-wrap' : 'pk-robot-wrap'}`, onClick: onClick, "aria-label": isOpen ? 'Close chat' : 'Open chat', style: { backgroundColor: brandColor }, children: [!isOpen && speech && (_jsxs("div", { className: "gunma-speech", onClick: (e) => { e.stopPropagation(); onChipClick(undefined); }, children: [_jsx("p", { className: "gunma-speech-text", children: speech }), chips && chips.length > 0 && (_jsx("div", { className: "gunma-speech-chips", children: chips.map((c) => (_jsx("button", { className: "gunma-chef-chip", onClick: (e) => { e.stopPropagation(); onChipClick(c.prefill); }, children: c.label }, c.label))) }))] })), !isOpen ? (variant === 'chef' ? (_jsxs("svg", { viewBox: "0 0 120 140", className: "gunma-chef-svg", "aria-hidden": "true", children: [_jsx("rect", { x: "47", y: "112", width: "9", height: "18", rx: "4", fill: "#334155" }), _jsx("rect", { x: "64", y: "112", width: "9", height: "18", rx: "4", fill: "#334155" }), _jsx("path", { d: "M38 66 q22 -10 44 0 l4 46 q-26 8 -52 0 z", fill: "#fff", stroke: "#cbd9e2" }), _jsx("circle", { cx: "60", cy: "46", r: "20", fill: "#f7cda6" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "53", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "67", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("rect", { x: "45", y: "12", width: "30", height: "18", rx: "9", fill: "#fff", stroke: "#e6c268" })] })) : (_jsx(PikuRobotArt, { blink: blink, talking: talking }))) : (_jsxs("svg", { className: "gunma-bubble-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] })), unreadCount > 0 && !isOpen && (_jsx("span", { className: "gunma-badge", children: unreadCount }))] }));
}
