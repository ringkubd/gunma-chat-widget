'use client';

import { useCallback } from 'react';

interface UseCartActionsConfig {
  /**
   * Base API URL of the Laravel backend (e.g. 'https://api.example.com').
   * Used to build the bulk cart endpoint: `${apiUrl}/api/chat/cart/bulk`.
   */
  apiUrl: string;

  /**
   * Route prefix matching GUNMA_ROUTE_PREFIX (default: 'api/chat').
   * Used to build: `${apiUrl}/${routePrefix}/cart/bulk`.
   */
  routePrefix?: string;

  /**
   * Direct URL for the host app's single-product cart endpoint.
   * If not set, single-product "Add to Cart" buttons will be disabled.
   * Example: 'https://mystore.com/customer/Frontend/Carts'
   */
  cartUrl?: string;

  /**
   * localStorage key for the guest cookie/cart identifier.
   * Default: 'gunma_cookie'
   */
  cookieKey?: string;

  /**
   * Optional Bearer token for authenticated cart requests.
   */
  apiToken?: string;

  /**
   * Optional function to resolve Bearer token dynamically.
   */
  getToken?: () => string | null;
}

/**
 * Extracted cart action logic — keeps ChatWidget.tsx clean.
 * Handles single-product "Add to Cart" and bulk "Add ALL Ingredients" clicks.
 *
 * Works for both guests (cookie-based) and authenticated customers (token-based).
 */
export function useCartActions(config: UseCartActionsConfig) {
  const routePrefix = config.routePrefix ?? 'api/chat';
  const cookieKey   = config.cookieKey   ?? 'gunma_cookie';

  /** Resolve token: explicit > getToken() > undefined */
  const resolveToken = (): string | null => {
    if (config.apiToken) return config.apiToken;
    if (config.getToken) return config.getToken();
    return null;
  };

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const token = resolveToken();
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return headers;
  };

  const addToCart = useCallback(async (btn: HTMLElement) => {
    const productId    = btn.getAttribute('data-product-id');
    const productPrice = btn.getAttribute('data-product-price');
    if (!productId) return;

    // Single-product cart requires a host-app cart URL
    if (!config.cartUrl) {
      console.warn('[useCartActions] cartUrl not configured — single-product add-to-cart disabled.');
      return;
    }

    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span style="font-size: 8px;">...</span>';
    btn.style.opacity = '0.7';

    try {
      const token  = resolveToken();
      const cookie = localStorage.getItem(cookieKey) || Date.now().toString();

      const res = await fetch(config.cartUrl, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          product_id:        productId,
          product_option_id: '',
          quantity:          1,
          item_price:        productPrice || 0,
          discount_amount:   0,
          tax_percent:       0,
          // Send cookie for guest carts; server ignores it when token is present
          cookie: token ? undefined : cookie,
        }),
      });

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
  }, [config.cartUrl, config.apiToken, config.getToken, cookieKey]);

  const bulkAddToCart = useCallback(async (target: HTMLElement) => {
    const productIdsStr = target.getAttribute('data-product-ids');
    if (!productIdsStr) return;

    const productIds  = productIdsStr.split(',');
    const originalText = target.textContent;
    target.textContent = 'Adding All...';
    target.style.opacity = '0.7';

    try {
      const token  = resolveToken();
      const cookie = localStorage.getItem(cookieKey) || Date.now().toString();

      const res = await fetch(`${config.apiUrl}/${routePrefix}/cart/bulk`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          product_ids: productIds,
          // Send cookie for guest carts; server ignores it when token is present
          cookie: token ? undefined : cookie,
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
  }, [config.apiUrl, routePrefix, config.apiToken, config.getToken, cookieKey]);

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