import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Piku Doodle — animated floating companion for the storefront.
 *
 * v1: A cute walking rice-bowl buddy. Wander around the page, blink,
 * stop sometimes and SAY things (product-aware suggestions, recipe hooks,
 * shop perks), click → open Piku chat. Opt-in via config.doodle.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
const PRODUCT_LINES = [
    '"%s" dekhchen! Eita nite paren — recipe lagle bolen.',
    'Ei "%s" khub popular bhai — cart e add korbo naki?',
    '"%s" diye ekdom solid ranna hoy! Ingredient lagbe bolen.',
    'Dekhun "%s" — ajke fresh stock e ache!',
];
const GENERAL_LINES = [
    'Amar kache fresh beef, chicken, mach, masala sob ache 😊',
    'Aaj ki ranna korben? Biryani, tehari, karahi — recipe dao bolen!',
    '¥10,000+ order korle delivery FREE (Okinawa chhore)!',
    'Chaile ingredients ek shathe "add all" — eksecant kaj 💬',
    'Points jome ache? Use korar way jane debo!',
    'Hunger lagchen? Haleem ar paya te hon vore jay.',
    'Ektu moja kore bolun — ki khawa jai bhabchen? 🍚',
];
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function productText(title, custom) {
    const pool = (custom && custom.length > 0 ? custom : PRODUCT_LINES);
    return pick(pool).replace('%s', title);
}
export function PikuDoodle({ doodle, brandColor, onOpenChat }) {
    const [pos, setPos] = useState({ x: 82, y: 70 }); // viewport %
    const [facing, setFacing] = useState('left');
    const [walking, setWalking] = useState(false);
    const [message, setMessage] = useState(null);
    const [blink, setBlink] = useState(false);
    const lastProduct = useRef('');
    const posRef = useRef(pos);
    posRef.current = pos;
    const readProduct = useCallback(() => {
        if (typeof window === 'undefined')
            return null;
        const el = document.querySelector('[data-product-id]');
        if (!el)
            return null;
        const title = (el.getAttribute('data-product-title') || el.textContent || '').trim().slice(0, 70);
        if (!title)
            return null;
        return { key: `${el.getAttribute('data-product-id')}|${title}`, title };
    }, []);
    const say = useCallback((text) => {
        setMessage(text);
        window.setTimeout(() => setMessage(null), 7000);
    }, []);
    useEffect(() => {
        if (!doodle.enabled || typeof window === 'undefined')
            return;
        const tickMs = doodle.tickMs ?? 3500;
        const talkChance = doodle.talkChance ?? 0.45;
        let moveTimer = 0;
        const step = () => {
            // Blink
            if (Math.random() < 0.35) {
                setBlink(true);
                window.setTimeout(() => setBlink(false), 150);
            }
            // Product lingered? speak product-aware line once per product
            const p = readProduct();
            if (p && p.key !== lastProduct.current) {
                lastProduct.current = p.key;
                if (Math.random() < 0.75) {
                    say(productText(p.title, doodle.texts?.product));
                }
                return;
            }
            if (Math.random() < talkChance && !message) {
                say(pick(GENERAL_LINES));
            }
            // Walk to a random nearby-safe spot (keep inside viewport margins)
            const x = Math.min(88, Math.max(6, posRef.current.x + (Math.random() * 44 - 22)));
            const y = Math.min(86, Math.max(52, posRef.current.y + (Math.random() * 24 - 12)));
            setFacing(posRef.current.x > x ? 'right' : 'left');
            setWalking(true);
            setPos({ x, y });
            window.setTimeout(() => setWalking(false), 1800);
        };
        const interval = window.setInterval(step, doodle.tickMs ?? 3500);
        return () => window.clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doodle.enabled, doodle.tickMs, doodle.talkChance, message, readProduct, say]);
    if (!doodle.enabled)
        return null;
    return (_jsxs("div", { className: `gunma-doodle-root ${facing === 'left' ? 'gunma-doodle-flip' : ''}`, style: { '--doodle-x': pos.x, '--doodle-y': pos.y }, children: [message && (_jsx("div", { className: "gunma-doodle-bubble", onClick: (e) => { e.stopPropagation(); setMessage(null); }, children: message })), _jsx("button", { className: `gunma-doodle-float ${walking ? 'walking' : ''} ${message ? 'talking' : ''}`, style: { boxShadow: `0 6px 18px ${brandColor}55` }, title: "Piku \u2014 click to chat", "aria-label": "Open Piku chat", onClick: () => { setMessage(null); onOpenChat(); }, children: _jsxs("svg", { viewBox: "0 0 64 64", className: "gunma-doodle-svg", "aria-hidden": "true", children: [_jsxs("g", { className: "gunma-doodle-legs", children: [_jsx("rect", { className: "leg left", x: "24", y: "48", width: "6", height: "12", rx: "3", fill: "#5b4a3a" }), _jsx("rect", { className: "leg right", x: "34", y: "48", width: "6", height: "12", rx: "3", fill: "#5b4a3a" })] }), _jsx("path", { d: "M8 34 a24 18 0 0 0 48 0 z", fill: brandColor }), _jsx("ellipse", { cx: "24", cy: "30", rx: "8", ry: "5", fill: "#fff" }), _jsx("ellipse", { cx: "36", cy: "28", rx: "10", ry: "6", fill: "#fff" }), _jsx("ellipse", { cx: "30", cy: "24", rx: "8", ry: "5", fill: "#fff" }), _jsxs("g", { className: "gunma-doodle-eyes", children: [_jsx("circle", { className: blink ? 'blink' : '', cx: "26", cy: "38", r: "2.6", fill: "#222" }), _jsx("circle", { className: blink ? 'blink' : '', cx: "38", cy: "38", r: "2.6", fill: "#fff", stroke: "#2b2b2b", strokeWidth: "1" })] }), _jsx("path", { d: "M28 44 q4 4 8 0", stroke: "#2b2b2b", strokeWidth: "1.6", fill: "none", strokeLinecap: "round" }), !walking && (_jsxs("g", { className: "steam", children: [_jsx("circle", { cx: "24", cy: "16", r: "2.2", fill: "#ffffff88" }), _jsx("circle", { cx: "31", cy: "12", r: "1.8", fill: "#ffffff66" }), _jsx("circle", { cx: "38", cy: "16", r: "2", fill: "#ffffff55" })] }))] }) })] }));
}
