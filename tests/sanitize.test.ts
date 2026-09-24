import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeAttr, sanitizeHtml } from '../src/lib/sanitize';

describe('escapeHtml', () => {
  it('escapes angle brackets and quotes', () => {
    expect(escapeHtml('<script>"x"&\'y\'</script>')).toBe(
      '&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;'
    );
  });

  it('handles null/undefined safely', () => {
    expect(escapeHtml(undefined as any)).toBe('');
    expect(escapeHtml(null as any)).toBe('');
  });
});

describe('sanitizeHtml (regex fallback, node)', () => {
  it('strips script tags', () => {
    const out = sanitizeHtml('<div>hi</div><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).toContain('hi');
  });

  it('removes inline event handlers', () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
  });

  it('neutralises javascript: urls', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });
});

describe('escapeAttr', () => {
  it('escapes for quoted attributes', () => {
    expect(escapeAttr('a" onmouseover="x')).toContain('&quot;');
    expect(escapeAttr('a" onmouseover="x')).not.toContain('"');
  });
});
