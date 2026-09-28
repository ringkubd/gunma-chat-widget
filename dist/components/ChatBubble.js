'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { PikuRobotArt } from './PikuRobotArt';
export function ChatBubble({ isOpen, onClick, brandColor, unreadCount, speech, chips, onChipClick, variant }) {
    const [blink, setBlink] = useState(false);
    const [speakingJump, setSpeakingJump] = useState(false);
    const [message, setMessage] = useState(null);
    const holdRef = useRef(null);
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
    const bellyRef = useRef('idle');
    const [chubby, setChubby] = useState(false);
    const [eating, setEating] = useState(false);
    const [walking, setWalking] = useState(false);
    /* ── Funny mini-story: খাওয়া → nudus (চুবড়) → hatahati kore weight কমানো ── */
    useEffect(() => {
        if (isOpen)
            return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce)
            return;
        let phases = [];
        let alive = true;
        const cleanups = [];
        const iv = window.setInterval(() => {
            if (document.hidden || speech || bellyRef.current !== 'idle')
                return;
            if (Math.random() > 0.1)
                return; // ~10% of ticks (rare, delightful)
            // Phase 1: eating (mouth pulses fast)
            bellyRef.current = 'eating';
            setEating(true);
            const t1 = window.setTimeout(() => {
                bellyRef.current = 'chubby';
                setChubby(true);
                const t2 = window.setTimeout(() => {
                    bellyRef.current = 'walking';
                    setWalking(true);
                    setSpeakingJump(true);
                    // ace: doodle walks to the opposite side while slimming down
                    const hold = holdRef.current;
                    if (hold) {
                        const dx = -Math.round((0.45 + Math.random() * 0.3) * window.innerWidth);
                        const dy = -Math.round((0.25 + Math.random() * 0.3) * window.innerHeight);
                        hold.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
                    }
                    // funny speech: weight-loss caper (নিজের উপর হাসি)
                    setMessage('Biryani kheye nudh হলাম! Hatahati kore weight কমাচ্ছি 😄🏃');
                    window.setTimeout(() => setMessage(null), 4000);
                    const t3 = window.setTimeout(() => {
                        bellyRef.current = 'idle';
                        setChubby(false);
                        setWalking(false);
                        setSpeakingJump(false);
                        holdRef.current?.style.setProperty('transform', 'translate3d(0,0,0)'); // বাড়িতে ফিরে আসো
                    }, 3400);
                    cleanups.push(() => window.clearTimeout(t3));
                    cleanups.push(() => window.clearTimeout(t3));
                }, 2600);
                cleanups.push(() => window.clearTimeout(t2));
            }, 3200);
            cleanups.push(() => window.clearTimeout(t1));
        }, 30000);
        return () => { alive = false; window.clearInterval(iv); cleanups.forEach((c) => c()); };
    }, [isOpen, speech]);
    const belly = bellyRef.current;
    /* ── Choro/jump: chef screen-এর মধ্যে সর্বশেষ accepted spot-এ সরে ── */
    useEffect(() => {
        if (isOpen)
            return; // chat খোলা → doodle লুকোয়, তবু মাপ ফিক্স রাখো
        const move = () => {
            if (document.hidden || window.innerWidth < 768)
                return;
            if (!holdRef.current)
                return;
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduce)
                return;
            // hold is anchored right=24/bottom=24 → translate is a DELTA; negative = বামে/উপরে (সবসময় on-screen)
            const dx = -Math.round((0.15 + Math.random() * 0.6) * window.innerWidth); // বামে 15–75vw
            const dy = -Math.round((0.05 + Math.random() * 0.55) * window.innerHeight); // উপরে 5–60vh
            holdRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
            setSpeakingJump(true);
            window.setTimeout(() => setSpeakingJump(false), 620);
        };
        // initial: bottom-right anchored (normal), then 1st move after 24s
        holdRef.current?.style.setProperty('transform', 'translate3d(0,0,0)');
        const t = window.setTimeout(move, 20000);
        const iv = window.setInterval(move, 26000);
        window.addEventListener('resize', move);
        window.addEventListener('focus', move);
        return () => { window.clearTimeout(t); window.clearInterval(iv); window.removeEventListener('resize', move); window.removeEventListener('focus', move); };
    }, [isOpen]);
    return (_jsxs("div", { ref: holdRef, className: `gunma-bubble-hold pk-robot-wrap ${bellyRef.current === 'eating' ? 'chef-eating' : ''} ${chubby ? 'chef-chubby' : ''} ${walking ? 'chef-walking' : ''}`, style: {
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
            pointerEvents: 'auto',
            transition: 'transform 1.9s cubic-bezier(.42,.05,.29,1.02)',
            willChange: 'transform',
        }, children: [!isOpen && speech && (_jsxs("div", { className: "gunma-speech", onClick: (e) => { e.stopPropagation(); onChipClick(undefined); }, children: [_jsx("p", { className: "gunma-speech-text", children: speech }), chips && chips.length > 0 && (_jsx("div", { className: "gunma-speech-chips", children: chips.map((c) => (_jsx("button", { className: "gunma-chef-chip", onClick: (e) => { e.stopPropagation(); onChipClick(c.prefill); }, children: c.label }, c.label))) }))] })), _jsxs("button", { className: `gunma-bubble ${isOpen ? 'gunma-bubble--open pk-robot-wrap' : 'pk-robot-wrap'}`, onClick: onClick, "aria-label": isOpen ? 'Close chat' : 'Open chat', style: { backgroundColor: isOpen ? brandColor : 'transparent' }, children: [!isOpen ? (variant === 'chef' ? (_jsxs("svg", { viewBox: "0 0 120 140", className: "gunma-chef-svg", "aria-hidden": "true", children: [_jsx("rect", { x: "47", y: "112", width: "9", height: "18", rx: "4", fill: "#334155" }), _jsx("rect", { x: "64", y: "112", width: "9", height: "18", rx: "4", fill: "#334155" }), _jsx("path", { d: "M38 66 q22 -10 44 0 l4 46 q-26 8 -52 0 z", fill: "#fff", stroke: "#cbd9e2" }), _jsx("circle", { cx: "60", cy: "46", r: "20", fill: "#f7cda6" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "53", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "67", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("rect", { x: "45", y: "12", width: "30", height: "18", rx: "9", fill: "#fff", stroke: "#e6c268" })] })) : (_jsx(PikuRobotArt, { blink: blink, talking: talking }))) : (_jsxs("svg", { className: "gunma-bubble-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), _jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })] })), unreadCount > 0 && !isOpen && (_jsx("span", { className: "gunma-badge", children: unreadCount }))] })] }));
}
