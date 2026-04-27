'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useCallback } from 'react';
export function MessageInput({ onSend, onUpload, onTyping, isLoading, placeholder }) {
    const [value, setValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const typingTimerRef = useRef(null);
    const isTypingRef = useRef(false);
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
        const el = e.target;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
        // Typing logic
        if (!isTypingRef.current && onTyping) {
            isTypingRef.current = true;
            onTyping(true);
        }
        if (typingTimerRef.current)
            clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            if (isTypingRef.current && onTyping) {
                isTypingRef.current = false;
                onTyping(false);
            }
        }, 3000);
    }, [onTyping]);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onUpload) {
            onUpload(file);
        }
    };
    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'bn-BD'; // Default to Bengali, but works for others too
        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            setValue((prev) => (prev ? `${prev} ${text}` : text));
        };
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);
        recognition.start();
        setIsRecording(true);
        recognitionRef.current = recognition;
    };
    return (_jsxs("div", { className: "gunma-input-area", children: [_jsx("input", { type: "file", ref: fileInputRef, onChange: handleFileChange, style: { display: 'none' }, accept: "image/*" }), _jsx("button", { className: "gunma-icon-btn", onClick: () => fileInputRef.current?.click(), disabled: isLoading, "aria-label": "Attach photo", title: "Attach photo", children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" }) }) }), _jsx("textarea", { ref: inputRef, className: "gunma-input gunma-input--autoresize", value: value, onChange: handleInput, onKeyDown: handleKeyDown, placeholder: placeholder, rows: 1, disabled: isLoading, "aria-label": "Chat message input" }), _jsx("button", { className: `gunma-icon-btn ${isRecording ? 'gunma-mic--active' : ''}`, onClick: toggleRecording, disabled: isLoading, "aria-label": "Voice message", title: "Voice message", children: _jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" }), _jsx("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }), _jsx("line", { x1: "12", y1: "19", x2: "12", y2: "23" }), _jsx("line", { x1: "8", y1: "23", x2: "16", y2: "23" })] }) }), _jsx("button", { className: "gunma-send-btn", onClick: handleSubmit, disabled: !value.trim() || isLoading, "aria-label": "Send message", children: _jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "22", y1: "2", x2: "11", y2: "13" }), _jsx("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })] }) })] }));
}
