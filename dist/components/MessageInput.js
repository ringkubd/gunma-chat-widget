'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback } from 'react';
export function MessageInput({ onSend, isLoading, placeholder }) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);
    const handleSubmit = useCallback(() => {
        if (!value.trim() || isLoading)
            return;
        onSend(value.trim());
        setValue('');
        // Reset textarea height after sending
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
        }
        inputRef.current?.focus();
    }, [value, isLoading, onSend]);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };
    const handleInput = useCallback((e) => {
        setValue(e.target.value);
        // Auto-resize: reset height then set to scrollHeight
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, []);
    return (_jsxs("div", { className: "gunma-input-area", children: [_jsx("textarea", { ref: inputRef, className: "gunma-input gunma-input--autoresize", value: value, onChange: handleInput, onKeyDown: handleKeyDown, placeholder: placeholder, rows: 1, disabled: isLoading, "aria-label": "Chat message input" }), _jsx("button", { className: "gunma-send-btn", onClick: handleSubmit, disabled: !value.trim() || isLoading, "aria-label": "Send message", children: _jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), _jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })] }) })] }));
}
