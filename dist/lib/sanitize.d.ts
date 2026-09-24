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
export declare function escapeHtml(value: unknown): string;
/** Escape for use inside an HTML attribute value (already quoted with "). */
export declare function escapeAttr(value: unknown): string;
export declare function sanitizeHtml(html: string): string;
