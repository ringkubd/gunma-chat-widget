/**
 * Minimal, dependency-free HTML sanitizer for chat message rendering.
 *
 * The markdown renderer builds an HTML string (including product cards) that is
 * injected via dangerouslySetInnerHTML. All dynamic values (titles, slugs,
 * image URLs) are escaped at interpolation time, and this final pass removes
 * disallowed tags/attributes and dangerous URL schemes as defence-in-depth.
 *
 * In the browser it uses DOMParser for a real tree walk. On the server (no DOM)
 * it falls back to a conservative regex strip.
 */
const ALLOWED_TAGS = new Set([
    'div', 'span', 'p', 'br', 'hr', 'a', 'img', 'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5',
    'button', 'svg', 'line', 'path', 'circle', 'polyline', 'rect',
]);
const ALLOWED_ATTR = new Set([
    'class', 'id', 'style', 'href', 'src', 'alt', 'title', 'target', 'rel',
    'data-id', 'data-product-id', 'data-product-price', 'data-product-ids',
    'loading', 'width', 'height', 'viewbox', 'fill', 'stroke', 'stroke-width',
    'stroke-linecap', 'stroke-linejoin', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r',
    'points', 'd',
]);
const SAFE_URL = /^(https?:|mailto:|tel:|\/|#|data:image\/)/i;
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
/** Escape for use inside an HTML attribute value (already quoted with "). */
export function escapeAttr(value) {
    return escapeHtml(value);
}
function isSafeUrl(url) {
    const trimmed = url.trim();
    if (!trimmed)
        return false;
    // Reject javascript:, vbscript:, data:text/html etc.
    return SAFE_URL.test(trimmed);
}
function sanitizeWithDom(html) {
    const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, 'text/html');
    const root = doc.getElementById('__root');
    if (!root)
        return '';
    const walk = (node) => {
        const children = Array.from(node.children);
        for (const el of children) {
            const tag = el.tagName.toLowerCase();
            if (!ALLOWED_TAGS.has(tag)) {
                // Drop the element but keep its text content.
                el.replaceWith(...Array.from(el.childNodes));
                continue;
            }
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name.toLowerCase();
                const val = attr.value;
                const isUrlAttr = name === 'href' || name === 'src';
                if (!ALLOWED_ATTR.has(name) || name.startsWith('on') || (isUrlAttr && !isSafeUrl(val))) {
                    el.removeAttribute(attr.name);
                }
            }
            // Force links to open safely.
            if (tag === 'a') {
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            }
            walk(el);
        }
    };
    walk(root);
    return root.innerHTML;
}
function sanitizeWithRegex(html) {
    return html
        // Remove script/style/iframe/object/embed blocks entirely.
        .replace(/<(script|style|iframe|object|embed|link|meta)[\s\S]*?<\/\1>/gi, '')
        .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, '')
        // Remove inline event handlers (onclick=, onerror=, ...).
        .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        // Neutralise javascript:/vbscript: URLs.
        .replace(/(href|src)\s*=\s*("|')?\s*(javascript|vbscript):[^"'>]*(\2)?/gi, '$1="#"');
}
export function sanitizeHtml(html) {
    if (!html)
        return '';
    try {
        if (typeof DOMParser !== 'undefined') {
            return sanitizeWithDom(html);
        }
    }
    catch {
        // Fall through to regex.
    }
    return sanitizeWithRegex(html);
}
