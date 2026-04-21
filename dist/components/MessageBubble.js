'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function MessageBubble({ message, brandColor, websiteUrl }) {
    const isUser = message.role === 'user';
    return (_jsxs("div", { className: `gunma-msg ${isUser ? 'gunma-msg--user' : 'gunma-msg--assistant'}`, children: [!isUser && (_jsx("div", { className: "gunma-msg-avatar", style: { backgroundColor: `${brandColor}20` }, children: _jsx("svg", { viewBox: "0 0 24 24", fill: "none", stroke: brandColor, strokeWidth: "1.5", width: "16", height: "16", children: _jsx("path", { d: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" }) }) })), _jsxs("div", { className: `gunma-msg-bubble ${isUser ? 'gunma-msg-bubble--user' : 'gunma-msg-bubble--assistant'}`, style: isUser ? { backgroundColor: brandColor } : undefined, children: [_jsx("div", { className: "gunma-msg-content", suppressHydrationWarning: true, dangerouslySetInnerHTML: { __html: renderMarkdown(message.content, websiteUrl) } }), _jsx("span", { className: "gunma-msg-time", children: formatTime(message.created_at) })] })] }));
}
function renderMarkdown(text, websiteUrl) {
    if (!text)
        return '';
    // ── Step 1: Extract and replace product blocks before any other parsing ──
    const productBlocks = [];
    let productIds = [];
    text = text.replace(/:{2,3}product\[(.+?)\|(.+?)\|(.+?)\|(.+?)\|(.+?)\]:{2,3}/g, (_, id, title, price, image, slug) => {
        const cleanPrice = price.replace(/\.000$/, '').replace(/\.00$/, '');
        productIds.push(id);
        const card = `
        <div class="gunma-product-mini-card">
          <a href="${websiteUrl}/${slug}" target="_blank" rel="noopener" class="gunma-product-mini-img-link">
            <img src="${image}" alt="${title}" loading="lazy"/>
          </a>
          <div class="gunma-product-mini-body">
            <span class="gunma-product-mini-title">${title}</span>
            <div class="gunma-product-mini-footer">
              <span class="gunma-product-mini-price">৳${cleanPrice}</span>
              <button data-product-id="${id}" data-product-price="${cleanPrice}" class="gunma-add-to-cart-btn gunma-product-mini-add" title="Add to Cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          </div>
        </div>`;
        productBlocks.push(card);
        return `{{PRODUCT_CARD_${productBlocks.length - 1}}}`;
    });
    // ── Step 2: Extract the "Add ALL" bulk link ──
    const bulkPattern = /\*?\*?\[?🛒 Add ALL Ingredients? to Cart\]?\(?[^)]*\)?\*?\*?/gi;
    const hasBulk = bulkPattern.test(text);
    if (hasBulk) {
        text = text.replace(bulkPattern, '{{BULK_BUTTON}}');
    }
    // ── Step 3: Escape HTML (but NOT our placeholders) ──
    text = text
        .replace(/&(?!amp;)/g, '&amp;')
        .replace(/<(?!\/?(h[1-6]|br|strong|em|ul|li|p|div|span|hr|img|a|code|button)\b)/g, '&lt;');
    // ── Step 4: Headers ──
    text = text
        .replace(/^### (.+)$/gm, '<h4 class="gunma-h4">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 class="gunma-h3">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 class="gunma-h2">$1</h2>');
    // ── Step 5: Bold & italic ──
    text = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
    // ── Step 6: Numbered instruction steps (styled circles) ──
    text = text.replace(/^(\d+)\.\s+\*\*(.+?)\*\*:?\s*(.*)$/gm, (_, num, bold, rest) => `<div class="gunma-step"><span class="gunma-step-num">${num}</span><span><strong>${bold}:</strong> ${rest}</span></div>`);
    text = text.replace(/^(\d+)\.\s+(.+)$/gm, (_, num, content) => `<div class="gunma-step"><span class="gunma-step-num">${num}</span><span>${content}</span></div>`);
    // ── Step 7: Unordered lists ──
    text = text.replace(/^[-*•]\s+(.+)$/gm, '<li>$1</li>');
    text = text.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="gunma-list">$1</ul>');
    // ── Step 8: Inline code ──
    text = text.replace(/`(.+?)`/g, '<code class="gunma-code">$1</code>');
    // ── Step 9: Images ──
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="gunma-msg-img" loading="lazy"/>');
    // ── Step 10: Links ──
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="gunma-link">$1</a>');
    // ── Step 11: Horizontal rules ──
    text = text.replace(/^---+$/gm, '<hr class="gunma-hr"/>');
    // ── Step 12: Line breaks ──
    text = text.replace(/\n/g, '<br/>');
    text = text.replace(/(<\/div>|<\/ul>|<\/li>|<\/h[1-4]>|<hr\s?\/?>)<br\/>/g, '$1');
    text = text.replace(/(<br\/>){2,}/g, '<br/>');
    // ── Step 13: Restore product cards ──
    productBlocks.forEach((card, i) => {
        text = text.replace(`{{PRODUCT_CARD_${i}}}`, card);
    });
    // ── Step 14: Wrap consecutive product cards in a grid ──
    text = text.replace(/(<div class="gunma-product-mini-card">[\s\S]*?<\/div>\s*<br\/>?\s*)+/g, (match) => {
        const cleaned = match.replace(/<br\/>/g, '');
        return `<div class="gunma-product-grid">${cleaned}</div>`;
    });
    // ── Step 15: Restore bulk button ──
    if (hasBulk) {
        const bulkHtml = `
      <button class="gunma-bulk-cart-btn" data-product-ids="${productIds.join(',')}">
        🛒 Add ALL Ingredients to Cart
      </button>`;
        text = text.replace('{{BULK_BUTTON}}', bulkHtml);
    }
    return text;
}
function formatTime(isoString) {
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    catch {
        return '';
    }
}
