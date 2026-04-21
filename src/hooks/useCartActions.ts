'use client';

import { useCallback } from 'react';

interface UseCartActionsConfig {
  apiUrl: string;
}

/**
 * Extracted cart action logic — keeps ChatWidget.tsx clean.
 * Handles single-product "Add to Cart" and bulk "Add ALL Ingredients" clicks.
 */
export function useCartActions(config: UseCartActionsConfig) {
  const addToCart = useCallback(async (btn: HTMLElement) => {
    const productId = btn.getAttribute('data-product-id');
    const productPrice = btn.getAttribute('data-product-price');
    if (!productId) return;

    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span style="font-size: 8px;">...</span>';
    btn.style.opacity = '0.7';

    try {
      const res = await fetch(
        `${config.apiUrl.replace('/api/chat', '')}/customer/Frontend/Carts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            product_option_id: '',
            quantity: 1,
            item_price: productPrice || 0,
            discount_amount: 0,
            tax_percent: 0,
            cookie: localStorage.getItem('gunma_cookie') || Date.now().toString(),
          }),
        },
      );

      if (res.ok) {
        btn.innerHTML = '✓';
        btn.style.backgroundColor = '#059669';
        btn.style.color = '#fff';
        setTimeout(() => window.location.reload(), 800);
      } else {
        btn.innerHTML = '!';
      }
    } catch {
      btn.innerHTML = '?';
    }

    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.style.opacity = '1';
      btn.style.backgroundColor = '';
    }, 2000);
  }, [config.apiUrl]);

  const bulkAddToCart = useCallback(async (target: HTMLElement) => {
    const productIdsStr = target.getAttribute('data-product-ids');
    if (!productIdsStr) return;

    const productIds = productIdsStr.split(',');
    const originalText = target.textContent;
    target.textContent = 'Adding All...';
    target.style.opacity = '0.7';

    try {
      const res = await fetch(`${config.apiUrl}/cart/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          product_ids: productIds,
          cookie: localStorage.getItem('gunma_cookie') || Date.now().toString(),
        }),
      });

      if (res.ok) {
        target.textContent = 'All Added ✓';
        target.style.backgroundColor = '#059669';
        target.style.color = '#fff';
        setTimeout(() => window.location.reload(), 1000);
      } else {
        target.textContent = 'Failed';
      }
    } catch {
      target.textContent = 'Error';
    }

    setTimeout(() => {
      if (target) {
        target.textContent = originalText;
        target.style.opacity = '1';
        target.style.backgroundColor = '';
      }
    }, 2000);
  }, [config.apiUrl]);

  const handleMessageClick = useCallback(
    async (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;

      // Single product add-to-cart
      const btn = target.closest('.gunma-add-to-cart-btn') as HTMLElement;
      if (btn) {
        e.preventDefault();
        addToCart(btn);
        return;
      }

      // Bulk add-to-cart
      if (target.classList.contains('gunma-bulk-cart-btn')) {
        e.preventDefault();
        bulkAddToCart(target);
      }
    },
    [addToCart, bulkAddToCart],
  );

  return { handleMessageClick };
}