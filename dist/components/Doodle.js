import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Piku Doodle v4 — animated chef mascot.
 *
 * A hand-drawn inline SVG chef (no external deps/assets): toque + chef
 * coat, stirring a pan, blinking, breathing, waving while talking, and a
 * little hop when it moves. It does NOT follow the cursor — it lives in a
 * corner and proactively talks about products (interest / cart / offers).
 *
 * Behaviour (kept lightweight — GPU transforms only, no JS animation loop
 * unless following the pointer, which is OFF by default):
 *  - greets once per page load
 *  - speaks about a product card that stays in view, or the product page
 *  - hover a product/category for ~600ms → instant (cached) line
 *  - click → open Piku chat with the product context
 */
import { useCallback, useEffect, useRef, useState } from 'react';
const PRODUCT_LINES = [
    '"%s" dekhchen! Recipe ba ingredient lagle bolen 💬',
    '"%s" khub popular bhai — cart e add kori naki?',
    'Ranna korle "%s" ekdom perfect combo!',
    '"%s" fresh ache — ekhoni nite paren!',
];
const GENERAL_LINES = [
    'Aaj ki ranna korben? Recipe dao bolen 🍳',
    '¥10,000+ te delivery FREE!',
    'Fresh mangsho-mach ashe dhukche 😊',
    'Ek sathe "add all" — sab theke easy 💬',
    'Haleem ar paya darun lage ishto 😋',
    'Points ache apnar? 🎁',
    'Cha ek cup? Na garam biryani? 🍚',
];
function pickOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
export function PikuDoodle({ doodle, brandColor, chatOpen, onOpenChat }) {
    const [message, setMessage] = useState(null);
    const [blink, setBlink] = useState(false);
    const [stir, setStir] = useState(false);
    const [hop, setHop] = useState(false);
    const prefillRef = useRef(undefined);
    const messageRef = useRef(null);
    messageRef.current = message;
    const size = Math.max(36, Math.min(72, doodle.size ?? 48));
    const pos = doodle.position ?? 'bottom-right';
    const enabled = !!doodle.enabled;
    const say = useCallback((line, prefill) => {
        prefillRef.current = prefill;
        setMessage(line);
        window.setTimeout(() => setMessage(null), 8000);
    }, []);
    /* ── Blink + breathe + occasional stir/hop ───────────────────── */
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        const iv = window.setInterval(() => {
            if (document.hidden)
                return;
            if (Math.random() < 0.4) {
                setBlink(true);
                window.setTimeout(() => setBlink(false), 130);
            }
            if ((doodle.stir ?? true) && Math.random() < 0.18) {
                setStir(true);
                window.setTimeout(() => setStir(false), 1600);
            }
            if (Math.random() < 0.12) {
                setHop(true);
                window.setTimeout(() => setHop(false), 500);
            }
        }, 2600);
        return () => window.clearInterval(iv);
    }, [enabled, doodle.stir]);
    /* ── Interactive speech state (wave while bubble is visible) ─── */
    const talking = !!message;
    /* ── Greeting + in-view product talk ─────────────────────────── */
    const readProduct = useCallback(() => {
        if (typeof window === 'undefined')
            return null;
        const el = document.querySelector('[data-product-id]');
        if (el) {
            const title = (el.getAttribute('data-product-title') || '').trim().slice(0, 80);
            if (title)
                return { key: `p:${el.getAttribute('data-product-id')}`, title };
        }
        const og = document.querySelector('meta[property="og:title"]');
        const h1 = document.querySelector('h1');
        const detail = (og?.content || h1?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
        if (detail && /add to cart|কার্ট|basket/i.test(document.body.innerText.slice(0, 4000))) {
            return { key: `p:${location.pathname}`, title: detail };
        }
        return null;
    }, []);
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        const talkChance = doodle.talkChance ?? 0.3;
        let greeted = false;
        const greet = window.setTimeout(() => {
            if (greeted || messageRef.current)
                return;
            greeted = true;
            say(pickOf(GENERAL_LINES));
        }, 7000);
        // Speak about products that stay in view (~2s)
        const seen = new Set();
        const observer = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (!e.isIntersecting || e.intersectionRatio < 0.5)
                    continue;
                const el = e.target;
                if (el.dataset.doodleTalked === '1')
                    continue;
                const pid = el.getAttribute('data-product-id') || '';
                let title = (el.getAttribute('data-product-title') || '').trim();
                if (!title) {
                    const a = el.querySelector('a');
                    const t = (a?.textContent || '').replace(/\s+/g, ' ').trim();
                    if (t && t.length <= 70)
                        title = t;
                }
                if (!title)
                    continue;
                const key = `p:${pid || title}`;
                if (seen.has(key))
                    continue;
                window.setTimeout(() => {
                    if (document.hidden || messageRef.current)
                        return;
                    el.dataset.doodleTalked = '1';
                    seen.add(key);
                    const pool = doodle.texts?.product?.length ? doodle.texts.product : PRODUCT_LINES;
                    say(pickOf(pool).replace('%s', title), `Ei product ta niye aro jante chai: ${title}`);
                }, 2000);
            }
        }, { threshold: [0.5] });
        const attach = () => {
            document.querySelectorAll('[data-product-id],[data-product-title]').forEach((el) => observer.observe(el));
        };
        attach();
        const attachIv = window.setInterval(attach, 4000);
        return () => {
            window.clearTimeout(greet);
            window.clearInterval(attachIv);
            observer.disconnect();
        };
    }, [enabled, say, doodle.talkChance, doodle.texts?.product]);
    /* ── Hover dwell (600ms) → instant cached line ───────────────── */
    useEffect(() => {
        if (!enabled || typeof window === 'undefined')
            return;
        let dwell;
        let lastKey = '';
        const resolve = (el) => {
            const prodEl = el.closest('[data-product-id],[data-product-title]');
            if (prodEl) {
                const pid = prodEl.getAttribute('data-product-id') ?? '';
                let title = (prodEl.getAttribute('data-product-title') || '').trim();
                if (!title) {
                    const a = prodEl.querySelector('a');
                    const t = (a?.textContent || '').replace(/\s+/g, ' ').trim();
                    if (t && t.length <= 70)
                        title = t;
                }
                if (title)
                    return { kind: 'p', key: `p:${pid || title}`, title };
            }
            const cat = el.closest('[data-category]')
                ?? el.closest('a[href*="categor"]');
            if (cat) {
                const title = (cat.getAttribute('data-category') || cat.textContent || '')
                    .replace(/\s+/g, ' ').trim().slice(0, 60);
                if (title && title.length <= 60)
                    return { kind: 'c', key: `c:${title}`, title };
            }
            return null;
        };
        const onOver = (e) => {
            if (!(e.target instanceof HTMLElement))
                return;
            const hit = resolve(e.target);
            if (!hit) {
                if (dwell) {
                    window.clearTimeout(dwell);
                    dwell = undefined;
                }
                return;
            }
            if (hit.key === lastKey)
                return;
            lastKey = hit.key;
            window.clearTimeout(dwell);
            dwell = window.setTimeout(() => {
                if (document.hidden || messageRef.current)
                    return;
                const pool = doodle.texts?.product?.length ? doodle.texts.product : PRODUCT_LINES;
                say(hit.kind === 'p'
                    ? pickOf(pool).replace('%s', hit.title)
                    : `"${hit.title}" category te onek darun jinish ache — dekhen! 💬`, hit.kind === 'p' ? `Ei product ta niye aro jante chai: ${hit.title}` : undefined);
            }, 600);
        };
        const onOut = () => { window.clearTimeout(dwell); dwell = undefined; };
        document.addEventListener('pointerover', onOver, { passive: true });
        window.addEventListener('pointerleave', onOut);
        return () => {
            document.removeEventListener('pointerover', onOver);
            window.removeEventListener('pointerleave', onOut);
            window.clearTimeout(dwell);
        };
    }, [enabled, say, dpsTextDeps(doodle)]);
    if (!enabled || chatOpen)
        return null;
    const corner = pos === 'bottom-right' ? { right: 18, bottom: 96 } : { left: 18, bottom: 96 };
    return (_jsxs("div", { className: "gunma-chef-root", style: { ...corner, ['--chef-size']: `${size}px` }, children: [message && (_jsx("div", { className: "gunma-chef-bubble", onClick: (e) => { e.stopPropagation(); const c = prefillRef.current; setMessage(null); onOpenChat(c); }, children: message })), _jsx("button", { className: `gunma-chef ${talking ? 'talking' : ''} ${stir ? 'stirring' : ''} ${hop ? 'hopping' : ''}`, style: { '--chef-brand': brandColor }, "aria-label": "Piku \u2014 click to chat", title: "Piku \u2014 click to chat", onClick: () => { setMessage(null); onOpenChat(prefillRef.current); }, children: _jsxs("svg", { viewBox: "0 0 120 140", className: "gunma-chef-svg", "aria-hidden": "true", children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "chefCoat", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#ffffff" }), _jsx("stop", { offset: "1", stopColor: "#eef2f3" })] }), _jsxs("linearGradient", { id: "chefHat", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#ffffff" }), _jsx("stop", { offset: "1", stopColor: "#eef2f3" })] }), _jsxs("linearGradient", { id: "chefScarf", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: brandColor }), _jsx("stop", { offset: "1", stopColor: "#0d9488" })] })] }), _jsx("ellipse", { className: "chef-shadow", cx: "60", cy: "134", rx: "26", ry: "5", fill: "#000", opacity: ".12" }), _jsxs("g", { className: "chef-body", children: [_jsx("rect", { className: "chef-leg", x: "47", y: "112", width: "9", height: "18", rx: "4", fill: "#3b3b3b" }), _jsx("rect", { className: "chef-leg", x: "64", y: "112", width: "9", height: "18", rx: "4", fill: "#3b3b3b" }), _jsx("ellipse", { cx: "51", cy: "132", rx: "8", ry: "4", fill: "#26211d" }), _jsx("ellipse", { cx: "69", cy: "132", rx: "8", ry: "4", fill: "#26211d" }), _jsx("path", { d: "M38 66 q22 -10 44 0 l4 46 q-26 8 -52 0 z", fill: "url(#chefCoat)", stroke: "#d9dfe2" }), _jsx("path", { d: "M50 62 q10 8 20 0 l-3 10 q-7 5 -14 0 z", fill: "url(#chefScarf)" }), _jsxs("g", { className: "chef-arm-left", children: [_jsx("rect", { x: "33", y: "70", width: "9", height: "26", rx: "4", fill: "url(#chefCoat)", stroke: "#d9dfe2" }), _jsx("circle", { cx: "37", cy: "98", r: "5", fill: "#f2c6a0" })] }), _jsxs("g", { className: "chef-arm-right", children: [_jsx("rect", { x: "78", y: "70", width: "9", height: "26", rx: "4", fill: "url(#chefCoat)", stroke: "#d9dfe2" }), _jsx("circle", { cx: "83", cy: "98", r: "5", fill: "#f2c6a0" }), _jsxs("g", { className: "chef-pan", children: [_jsx("rect", { x: "80", y: "96", width: "22", height: "3", rx: "1.5", fill: "#8a8f94" }), _jsx("ellipse", { cx: "104", cy: "97", rx: "12", ry: "5", fill: "#4b5054" }), _jsx("ellipse", { cx: "104", cy: "96", rx: "9", ry: "3", fill: "#6b7175" })] })] }), _jsxs("g", { className: "chef-head", children: [_jsx("circle", { cx: "60", cy: "46", r: "20", fill: "#f7cda6" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "53", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("circle", { className: blink ? 'chef-eye blink' : 'chef-eye', cx: "67", cy: "45", r: "2.6", fill: "#26211d" }), _jsx("circle", { cx: "53.8", cy: "44", r: ".9", fill: "#fff" }), _jsx("circle", { cx: "67.8", cy: "44", r: ".9", fill: "#fff" }), _jsx("circle", { cx: "48", cy: "51", r: "3", fill: "#ffb7b0", opacity: ".75" }), _jsx("circle", { cx: "72", cy: "51", r: "3", fill: "#ffb7b0", opacity: ".75" }), talking ? (_jsx("ellipse", { className: "chef-mouth", cx: "60", cy: "54", rx: "4.5", ry: "3.4", fill: "#7a2f2f" })) : (_jsx("path", { d: "M55 53 q5 4 10 0", stroke: "#26211d", strokeWidth: "1.8", fill: "none", strokeLinecap: "round" })), _jsxs("g", { className: "chef-hat", children: [_jsx("ellipse", { cx: "60", cy: "29", rx: "24", ry: "7", fill: "url(#chefHat)", stroke: "#e2e8ea" }), _jsx("rect", { x: "45", y: "12", width: "30", height: "18", rx: "9", fill: "url(#chefHat)", stroke: "#e2e8ea" }), _jsx("path", { className: "chef-hat-puff", d: "M40 20 q-6 -8 4 -10 q2 -8 10 -5 q6 -6 12 0 q8 -3 10 5 q10 2 4 10", fill: "url(#chefHat)", stroke: "#e2e8ea" })] })] })] })] }) })] }));
}
/** Stable dep list for the doodle texts. */
function dpsTextDeps(d) {
    return JSON.stringify(d.texts || {});
}
