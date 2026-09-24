'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  ChatCommerceConfig,
  ChatWidgetConfig,
  CommerceAddress,
  CommerceCartItem,
  CommerceDeliveryInfo,
  CommerceStep,
} from '../types';
import { CommerceApi } from '../lib/commerceApi';

/* ── Money helpers (mirror storefront) ──────────────────────────── */

function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parseDayOffRanges(raw: any): { from: number; to: number }[] {
  // Accepts [{ from, to }], [{ value: "YYYY-MM-DD to YYYY-MM-DD" }] or strings.
  const ranges: { from: number; to: number }[] = [];
  if (!raw) return ranges;
  const list = Array.isArray(raw) ? raw : (raw.data ?? []);

  const add = (a: string, b: string) => {
    const f = Date.parse(a);
    const t = Date.parse(b);
    if (!Number.isNaN(f) && !Number.isNaN(t)) ranges.push({ from: f, to: t });
  };

  for (const item of list) {
    if (item?.from && item?.to) {
      add(item.from, item.to);
      continue;
    }
    const text = typeof item === 'string' ? item : item?.value;
    if (typeof text === 'string' && text.includes(' to ')) {
      const [a, b] = text.split(' to ');
      add(a.trim(), b.trim());
    }
  }
  return ranges;
}

function isDayOff(ts: number, ranges: { from: number; to: number }[]): boolean {
  return ranges.some((r) => ts >= r.from && ts <= r.to);
}

export interface UseCommerceResult {
  enabled: boolean;
  step: CommerceStep;
  setStep: (s: CommerceStep) => void;

  cart: CommerceCartItem[];
  subtotal: number;
  totalTax: number;
  shippingCharge: number;
  total: number;

  addresses: CommerceAddress[];
  selectedAddress: CommerceAddress | null;
  selectAddress: (a: CommerceAddress) => void;

  deliveryInfo: CommerceDeliveryInfo | null;
  earliestDate: string | null;
  deliveryDate: string;
  setDeliveryDate: (d: string) => void;
  deliveryTime: string;
  setDeliveryTime: (t: string) => void;

  coins: number;
  appliedCoins: number;
  setAppliedCoins: (n: number) => void;
  grandTotal: number;

  email: string;
  customerName: string;

  orderId: number | string | null;
  successOrderId: number | string | null;
  errorMessage: string | null;
  stripeSecret: string | null;

  loading: boolean;
  refreshCart: () => Promise<CommerceCartItem[]>;
  stockIssues: StockIssue[];
  hasStockIssues: boolean;
  fixStockIssue: (issueId: number | string) => Promise<void>;
  removeStockIssue: (issueId: number | string) => Promise<void>;
  fixAllStockIssues: () => Promise<void>;
  removeItem: (id: number | string) => Promise<void>;
  startCheckout: () => Promise<void>;
  confirmCash: () => Promise<void>;
  prepareCard: () => Promise<void>;
  confirmCard: (stripe: any, elements: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    contact_no: string;
    email: string;
    password: string;
  }) => Promise<void>;

  api: CommerceApi;
  stripePublishableKey?: string;
  currencySymbol: string;
  freeShippingThreshold: number;
  freeShippingExcludedState: string;
  orderCutoffTime: string;
}

export interface StockIssue {
  id: number | string;
  title: string;
  reason: 'out_of_stock' | 'insufficient' | 'unavailable' | 'offline';
  /** Requested quantity in the cart. */
  requested: number;
  /** Available stock (null when unknown). */
  available: number | null;
  /** Whether this issue can be auto-fixed by adjusting quantity (insufficient). */
  fixable: boolean;
}

/**
 * Pure stock pre-validation. Given cart items (with embedded product data),
 * return the items that cannot be ordered so the customer is warned BEFORE
 * checkout/payment. Kept outside the hook so it can be tested directly.
 */
export function computeStockIssues(cart: CommerceCartItem[]): StockIssue[] {
  const issues: StockIssue[] = [];
  for (const item of cart) {
    const p = item.product;
    if (!p) continue;
    const title = item.title ?? item.product_title ?? p.title ?? `#${item.product_id}`;
    const requested = Number(item.quantity) || 0;

    const status = String(p.status ?? '');
    if (status && status.toLowerCase() !== 'active') {
      issues.push({ id: item.id, title, reason: 'unavailable', requested, available: 0, fixable: false });
      continue;
    }

    if (p.is_online_available !== undefined) {
      const online = p.is_online_available === true || String(p.is_online_available) === 'Yes';
      if (!online) {
        issues.push({ id: item.id, title, reason: 'offline', requested, available: 0, fixable: false });
        continue;
      }
    }

    let available: number | null = null;
    if (typeof p.total_available_quantity === 'number') {
      available = p.total_available_quantity;
    } else if (Array.isArray(p.stocks)) {
      available = p.stocks.reduce((s, st) => s + Number(st.available_quantity ?? 0), 0);
    }

    if (available !== null && requested > available) {
      issues.push({
        id: item.id,
        title,
        reason: available <= 0 ? 'out_of_stock' : 'insufficient',
        requested,
        available,
        fixable: available > 0,
      });
    }
  }
  return issues;
}

export function useCommerce(
  config: ChatWidgetConfig,
  opts: { onCartChanged?: () => void } = {},
): UseCommerceResult {
  const cfg: ChatCommerceConfig | undefined = config.commerce;
  const enabled = !!cfg;

  const apiBase = cfg?.apiBase ?? config.apiUrl;
  const routePrefix = cfg?.routePrefix ?? '/customer/Frontend';

  const getToken = useCallback(
    () => config.getToken?.() ?? (typeof window !== 'undefined' ? localStorage.getItem('tk') : null),
    [config.getToken],
  );

  const api = useMemo(
    () => new CommerceApi({ apiBase, routePrefix, getToken }),
    [apiBase, routePrefix, getToken],
  );

  const [step, setStep] = useState<CommerceStep>('cart');
  const [cart, setCart] = useState<CommerceCartItem[]>([]);
  const [addresses, setAddresses] = useState<CommerceAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CommerceAddress | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<CommerceDeliveryInfo | null>(null);
  const [earliestDate, setEarliestDate] = useState<string | null>(null);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [coins, setCoins] = useState(0);
  const [appliedCoins, setAppliedCoins] = useState(0);
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderId, setOrderId] = useState<number | string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<number | string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stripeSecret, setStripeSecret] = useState<string | null>(null);

  const busyRef = useRef(false);

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + Number(i.total_amount || 0), 0),
    [cart],
  );
  const totalTax = useMemo(
    () => cart.reduce((s, i) => s + Number(i.total_tax_amount || 0), 0),
    [cart],
  );

  const freeThreshold = cfg?.freeShippingThreshold ?? 10000;
  const flatShipping = cfg?.shippingCharge ?? 1200;
  const excludedState = cfg?.freeShippingExcludedState ?? '沖縄県';
  const orderCutoffTime = cfg?.orderCutoffTime ?? '14:00:00';
  const currencySymbol = cfg?.currencySymbol ?? '¥';

  const shippingCharge = useMemo(() => {
    const isOkinawa = selectedAddress?.state === excludedState;
    return subtotal >= freeThreshold && !isOkinawa ? 0 : flatShipping;
  }, [subtotal, selectedAddress, freeThreshold, flatShipping, excludedState]);

  const total = useMemo(() => round(subtotal + shippingCharge + totalTax), [subtotal, shippingCharge, totalTax]);
  const grandTotal = useMemo(() => round(Math.max(0, total - appliedCoins)), [total, appliedCoins]);

  /* ── Cart ─────────────────────────────────────────────────── */

  const refreshCart = useCallback(async (): Promise<CommerceCartItem[]> => {
    if (!enabled) return [];
    try {
      const items = await api.getCart();
      setCart(items);
      return items;
    } catch (e) {
      // ignore — cart may be empty
      return [];
    }
  }, [enabled, api]);

  const removeItem = useCallback(async (id: number | string) => {
    setLoading(true);
    try {
      await api.removeCartItem(id);
      await refreshCart();
      opts.onCartChanged?.();
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Could not remove item.');
    } finally {
      setLoading(false);
    }
  }, [api, refreshCart, opts]);

  /* ── Stock pre-validation (block checkout BEFORE placing the order) ───── */

  const stockIssues = useMemo(() => computeStockIssues(cart), [cart]);

  const hasStockIssues = stockIssues.length > 0;

  /* ── Start checkout ───────────────────────────────────────── */

  const computeEarliestDate = useCallback(
    async (addr: CommerceAddress) => {
      const postal = addr?.postal_code ?? '';
      const info = await api.getDeliveryInfo(postal);
      setDeliveryInfo(info);

      let cutoff = orderCutoffTime;
      try {
        const cdt = await api.getCurrentDateTime();
        if (cdt?.order_cutoff_time) cutoff = cdt.order_cutoff_time;
      } catch { /* keep default */ }

      const delay = Number(info.after_delay ?? 0);
      const now = new Date();
      const [h, m, s] = cutoff.split(':').map((x) => parseInt(x, 10));
      const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const cutoffSecs = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
      const addDays = nowSecs <= cutoffSecs ? Math.max(0, delay - 1) : delay;

      let dayOffRanges: { from: number; to: number }[] = [];
      try {
        dayOffRanges = parseDayOffRanges(await api.getDayOff());
      } catch { /* ignore */ }

      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + addDays);
      let guard = 0;
      while (isDayOff(candidate.getTime(), dayOffRanges) && guard < 30) {
        candidate.setDate(candidate.getDate() + 1);
        guard++;
      }

      const iso = candidate.toISOString().slice(0, 10);
      setEarliestDate(iso);
      if (!deliveryDate) setDeliveryDate(iso);
      if (!deliveryTime && info.schedules?.[0]) setDeliveryTime(info.schedules[0].schedule);

      return info;
    },
    [api, orderCutoffTime, deliveryDate, deliveryTime],
  );

  const startCheckout = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    setErrorMessage(null);
    setSuccessOrderId(null);
    try {
      if (!getToken()) {
        setStep('auth');
        return;
      }

      // Refresh cart and validate stock BEFORE proceeding to delivery/payment.
      const freshCart = await refreshCart();
      const freshIssues = computeStockIssues(freshCart);
      if (freshIssues.length > 0) {
        setStep('cart');
        return;
      }

      const addrs = await api.getDefaultAddresses();
      setAddresses(addrs);
      const addr = selectedAddress ?? addrs[0] ?? null;
      if (!addr) {
        setStep('address');
        return;
      }
      setSelectedAddress(addr);
      setEmail((prev) => prev || addr.email || '');
      setCustomerName((prev) => prev || addr.customer_name || addr.name || '');

      if (cfg?.enableCoins !== false) {
        try {
          const c = await api.getCoins();
          setCoins(c);
        } catch { /* ignore */ }
      }

      await computeEarliestDate(addr);
      setStep('delivery');
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Could not start checkout.');
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, [getToken, refreshCart, api, selectedAddress, cfg, computeEarliestDate]);

  const selectAddressFn = useCallback(
    async (a: CommerceAddress) => {
      setSelectedAddress(a);
      setEmail((prev) => prev || a.email || '');
      setCustomerName((prev) => prev || a.customer_name || a.name || '');
      try {
        await computeEarliestDate(a);
      } catch { /* ignore */ }
    },
    [computeEarliestDate],
  );

  /* ── Build order payload (mirrors storefront) ─────────────── */

  const buildOrderPayload = useCallback(
    (paymentMode: 'Cash' | 'Card') => {
      const addr = selectedAddress!;
      return {
        // address fields spread (storefront spreads the address object)
        id: addr.id,
        email: addr.email ?? email,
        customer_name: addr.customer_name ?? customerName,
        name: addr.name,
        address: (addr as any).address,
        phone: addr.phone,
        title: addr.title,
        street: addr.street,
        postal_code: addr.postal_code,
        city: addr.city,
        apartment: addr.apartment,
        state: addr.state,
        chome: addr.chome,
        type: addr.type,
        post_code_id: addr.post_code_id,
        customer_id: addr.customer_id,
        // order fields
        address_id: addr.id,
        delivary_date: deliveryDate,
        delivary_time: deliveryTime,
        shipping_charge: shippingCharge,
        total_tax_amount: totalTax,
        payment_mode: paymentMode,
      };
    },
    [selectedAddress, email, customerName, deliveryDate, deliveryTime, shippingCharge, totalTax],
  );

  /* ── Cash order ───────────────────────────────────────────── */

  const confirmCash = useCallback(async () => {
    if (busyRef.current) return;
    if (hasStockIssues) {
      setErrorMessage('Please remove the unavailable item(s) from your cart before ordering.');
      setStep('cart');
      void refreshCart();
      return;
    }
    busyRef.current = true;
    setLoading(true);
    setErrorMessage(null);
    setStep('processing');
    try {
      const payload = {
        ...buildOrderPayload('Cash'),
        total_amount: round(total - appliedCoins),
        paid_amount: 0,
      };
      const order = await api.createOrder(payload);
      const id = order?.id ?? (order as any)?.data?.id;
      setSuccessOrderId(id);
      setStep('success');
      opts.onCartChanged?.();
      await refreshCart();
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Order failed. Please try again.');
      setStep('failed');
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, [buildOrderPayload, total, appliedCoins, api, opts, refreshCart, hasStockIssues]);

  /* ── Card order (create order, then get clientSecret) ─────── */

  const prepareCard = useCallback(async () => {
    if (busyRef.current) return;
    if (hasStockIssues) {
      setErrorMessage('Please remove the unavailable item(s) from your cart before paying.');
      setStep('cart');
      void refreshCart();
      return;
    }
    busyRef.current = true;
    setLoading(true);
    setErrorMessage(null);
    try {
      // Reuse pending card order if present (3-hour window, like storefront).
      const payload = {
        ...buildOrderPayload('Card'),
        order_id: orderId ?? null,
      };
      const order = await api.createOrder(payload);
      const id = order?.id ?? (order as any)?.data?.id;
      setOrderId(id);
      const secret = await api.getStripeSecret(grandTotal, email || selectedAddress?.email || '', id);
      setStripeSecret(secret);
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Could not initialise payment.');
      setStep('failed');
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, [buildOrderPayload, orderId, api, grandTotal, email, selectedAddress, hasStockIssues, refreshCart]);

  const confirmCard = useCallback(
    async (stripe: any, elements: any) => {
      if (!stripe || !elements || !stripeSecret) return;
      setLoading(true);
      setErrorMessage(null);
      setStep('processing');
      try {
        const { error: submitError } = await elements.submit();
        if (submitError) throw new Error(submitError.message);

        const res = await stripe.confirmPayment({
          elements,
          clientSecret: stripeSecret,
          confirmParams: {
            return_url: `${cfg?.frontendBase ?? config.websiteUrl ?? window.location.origin}/checkout`,
            payment_method_data: {
              billing_details: {
                name: customerName || selectedAddress?.name,
                email: email || selectedAddress?.email,
              },
            },
          },
          redirect: 'if_required',
        });

        if (res?.error) {
          // Mark order unpaid (best effort), mirroring storefront failure path.
          if (orderId) {
            try { await api.confirmStripeOrder(orderId, { online_payment: 'no' }); } catch { /* ignore */ }
          }
          throw new Error(res.error.message || 'Payment failed. Please try again.');
        }

        if (res?.paymentIntent?.status === 'succeeded') {
          if (orderId) {
            try {
              await api.confirmStripeOrder(orderId, {
                stripe_id: res.paymentIntent.id,
                online_payment: 'yes',
                payment_amount: res.paymentIntent.amount,
              });
            } catch { /* ignore — order still created */ }
          }
          setSuccessOrderId(orderId);
          setStep('success');
          opts.onCartChanged?.();
          await refreshCart();
        } else {
          throw new Error('Payment was not completed.');
        }
      } catch (e: any) {
        setErrorMessage(e?.message ?? 'Payment failed.');
        setStep('failed');
      } finally {
        setLoading(false);
      }
    },
    [stripeSecret, cfg, config.websiteUrl, customerName, selectedAddress, email, orderId, api, opts, refreshCart],
  );

  /* ── Login ────────────────────────────────────────────────── */

  const login = useCallback(
    async (loginEmail: string, password: string) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await api.login(loginEmail, password);
        setEmail(loginEmail);
        // Notify the chat (and host) that a customer just logged in so the
        // guest chat session is linked to the account.
        const cid = res?.user?.id ?? (res?.user as any)?.customer_id ?? null;
        if (typeof window !== 'undefined') {
          if (cid) localStorage.setItem('gunma_chat_customer_id', String(cid));
          window.dispatchEvent(new CustomEvent('gunma:login', { detail: { customer_id: cid, user: res?.user } }));
        }
        await startCheckout();
      } catch (e: any) {
        setErrorMessage(e?.message ?? 'Login failed.');
      } finally {
        setLoading(false);
      }
    },
    [api, startCheckout],
  );

  /**
   * Smart fix: reduce an over-quantity item to the max available amount.
   */
  const fixStockIssue = useCallback(async (issueId: number | string) => {
    const issue = stockIssues.find((x) => String(x.id) === String(issueId));
    if (!issue || !issue.fixable || issue.available === null) return;
    const item = cart.find((x) => String(x.id) === String(issueId));
    setLoading(true);
    setErrorMessage(null);
    try {
      const qty = Math.max(1, issue.available);
      await api.updateCartItem(issueId, {
        product_id: item?.product_id,
        product_option_id: '',
        quantity: qty,
        item_price: Number(item?.item_price ?? 0),
        discount_amount: 0,
      });
      await refreshCart();
      opts.onCartChanged?.();
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Could not update the quantity.');
    } finally {
      setLoading(false);
    }
  }, [api, cart, stockIssues, refreshCart, opts]);

  /**
   * Smart fix: remove an item that cannot be ordered at all.
   */
  const removeStockIssue = useCallback(async (issueId: number | string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await api.removeCartItem(issueId);
      await refreshCart();
      opts.onCartChanged?.();
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Could not remove the item.');
    } finally {
      setLoading(false);
    }
  }, [api, refreshCart, opts]);

  /**
   * Smart fix: apply all resolvable issues at once (reduce quantities to max,
   * remove unavailable items).
   */
  const fixAllStockIssues = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      for (const issue of stockIssues) {
        if (issue.fixable && issue.available !== null) {
          const item = cart.find((x) => String(x.id) === String(issue.id));
          await api.updateCartItem(issue.id, {
            product_id: item?.product_id,
            product_option_id: '',
            quantity: Math.max(1, issue.available),
            item_price: Number(item?.item_price ?? 0),
            discount_amount: 0,
          });
        } else {
          await api.removeCartItem(issue.id);
        }
      }
      await refreshCart();
      opts.onCartChanged?.();
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Could not fix the cart automatically.');
    } finally {
      setLoading(false);
    }
  }, [api, cart, stockIssues, refreshCart, opts]);

  const register = useCallback(
    async (payload: { name: string; contact_no: string; email: string; password: string }) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await api.register(payload);
        setEmail(payload.email);
        setCustomerName(payload.name);
        const cid = res?.user?.id ?? (res?.user as any)?.customer_id ?? null;
        if (typeof window !== 'undefined') {
          if (cid) localStorage.setItem('gunma_chat_customer_id', String(cid));
          window.dispatchEvent(new CustomEvent('gunma:login', { detail: { customer_id: cid, user: res?.user } }));
        }
        await startCheckout();
      } catch (e: any) {
        setErrorMessage(e?.message ?? 'Registration failed.');
      } finally {
        setLoading(false);
      }
    },
    [api, startCheckout],
  );

  return {
    enabled,
    step,
    setStep,
    cart,
    subtotal,
    totalTax,
    shippingCharge,
    total,
    addresses,
    selectedAddress,
    selectAddress: selectAddressFn,
    deliveryInfo,
    earliestDate,
    deliveryDate,
    setDeliveryDate,
    deliveryTime,
    setDeliveryTime,
    coins,
    appliedCoins,
    setAppliedCoins,
    grandTotal,
    email,
    customerName,
    orderId,
    successOrderId,
    errorMessage,
    stripeSecret,
    loading,
    refreshCart,
    stockIssues,
    hasStockIssues,
    fixStockIssue,
    removeStockIssue,
    fixAllStockIssues,
    removeItem,
    startCheckout,
    confirmCash,
    prepareCard,
    confirmCard,
    login,
    register,
    api,
    stripePublishableKey: cfg?.stripePublishableKey,
    currencySymbol,
    freeShippingThreshold: freeThreshold,
    freeShippingExcludedState: excludedState,
    orderCutoffTime,
  };
}
