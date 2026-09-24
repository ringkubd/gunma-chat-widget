'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CommerceApi } from '../lib/commerceApi';
/* ── Money helpers (mirror storefront) ──────────────────────────── */
function round(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}
function parseDayOffRanges(raw) {
    // Accepts [{ from, to }], [{ value: "YYYY-MM-DD to YYYY-MM-DD" }] or strings.
    const ranges = [];
    if (!raw)
        return ranges;
    const list = Array.isArray(raw) ? raw : (raw.data ?? []);
    const add = (a, b) => {
        const f = Date.parse(a);
        const t = Date.parse(b);
        if (!Number.isNaN(f) && !Number.isNaN(t))
            ranges.push({ from: f, to: t });
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
function isDayOff(ts, ranges) {
    return ranges.some((r) => ts >= r.from && ts <= r.to);
}
export function useCommerce(config, opts = {}) {
    const cfg = config.commerce;
    const enabled = !!cfg;
    const apiBase = cfg?.apiBase ?? config.apiUrl;
    const routePrefix = cfg?.routePrefix ?? '/customer/Frontend';
    const getToken = useCallback(() => config.getToken?.() ?? (typeof window !== 'undefined' ? localStorage.getItem('tk') : null), [config.getToken]);
    const api = useMemo(() => new CommerceApi({ apiBase, routePrefix, getToken }), [apiBase, routePrefix, getToken]);
    const [step, setStep] = useState('cart');
    const [cart, setCart] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [deliveryInfo, setDeliveryInfo] = useState(null);
    const [earliestDate, setEarliestDate] = useState(null);
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryTime, setDeliveryTime] = useState('');
    const [coins, setCoins] = useState(0);
    const [appliedCoins, setAppliedCoins] = useState(0);
    const [email, setEmail] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [orderId, setOrderId] = useState(null);
    const [successOrderId, setSuccessOrderId] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stripeSecret, setStripeSecret] = useState(null);
    const busyRef = useRef(false);
    const subtotal = useMemo(() => cart.reduce((s, i) => s + Number(i.total_amount || 0), 0), [cart]);
    const totalTax = useMemo(() => cart.reduce((s, i) => s + Number(i.total_tax_amount || 0), 0), [cart]);
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
    const refreshCart = useCallback(async () => {
        if (!enabled)
            return;
        try {
            const items = await api.getCart();
            setCart(items);
        }
        catch (e) {
            // ignore — cart may be empty
        }
    }, [enabled, api]);
    const removeItem = useCallback(async (id) => {
        setLoading(true);
        try {
            await api.removeCartItem(id);
            await refreshCart();
            opts.onCartChanged?.();
        }
        catch (e) {
            setErrorMessage(e?.message ?? 'Could not remove item.');
        }
        finally {
            setLoading(false);
        }
    }, [api, refreshCart, opts]);
    /* ── Start checkout ───────────────────────────────────────── */
    const computeEarliestDate = useCallback(async (addr) => {
        const postal = addr?.postal_code ?? '';
        const info = await api.getDeliveryInfo(postal);
        setDeliveryInfo(info);
        let cutoff = orderCutoffTime;
        try {
            const cdt = await api.getCurrentDateTime();
            if (cdt?.order_cutoff_time)
                cutoff = cdt.order_cutoff_time;
        }
        catch { /* keep default */ }
        const delay = Number(info.after_delay ?? 0);
        const now = new Date();
        const [h, m, s] = cutoff.split(':').map((x) => parseInt(x, 10));
        const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const cutoffSecs = (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
        const addDays = nowSecs <= cutoffSecs ? Math.max(0, delay - 1) : delay;
        let dayOffRanges = [];
        try {
            dayOffRanges = parseDayOffRanges(await api.getDayOff());
        }
        catch { /* ignore */ }
        const candidate = new Date(now);
        candidate.setDate(candidate.getDate() + addDays);
        let guard = 0;
        while (isDayOff(candidate.getTime(), dayOffRanges) && guard < 30) {
            candidate.setDate(candidate.getDate() + 1);
            guard++;
        }
        const iso = candidate.toISOString().slice(0, 10);
        setEarliestDate(iso);
        if (!deliveryDate)
            setDeliveryDate(iso);
        if (!deliveryTime && info.schedules?.[0])
            setDeliveryTime(info.schedules[0].schedule);
        return info;
    }, [api, orderCutoffTime, deliveryDate, deliveryTime]);
    const startCheckout = useCallback(async () => {
        if (busyRef.current)
            return;
        busyRef.current = true;
        setLoading(true);
        setErrorMessage(null);
        setSuccessOrderId(null);
        try {
            if (!getToken()) {
                setStep('auth');
                return;
            }
            await refreshCart();
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
                }
                catch { /* ignore */ }
            }
            await computeEarliestDate(addr);
            setStep('delivery');
        }
        catch (e) {
            setErrorMessage(e?.message ?? 'Could not start checkout.');
        }
        finally {
            setLoading(false);
            busyRef.current = false;
        }
    }, [getToken, refreshCart, api, selectedAddress, cfg, computeEarliestDate]);
    const selectAddressFn = useCallback(async (a) => {
        setSelectedAddress(a);
        setEmail((prev) => prev || a.email || '');
        setCustomerName((prev) => prev || a.customer_name || a.name || '');
        try {
            await computeEarliestDate(a);
        }
        catch { /* ignore */ }
    }, [computeEarliestDate]);
    /* ── Build order payload (mirrors storefront) ─────────────── */
    const buildOrderPayload = useCallback((paymentMode) => {
        const addr = selectedAddress;
        return {
            // address fields spread (storefront spreads the address object)
            id: addr.id,
            email: addr.email ?? email,
            customer_name: addr.customer_name ?? customerName,
            name: addr.name,
            address: addr.address,
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
    }, [selectedAddress, email, customerName, deliveryDate, deliveryTime, shippingCharge, totalTax]);
    /* ── Cash order ───────────────────────────────────────────── */
    const confirmCash = useCallback(async () => {
        if (busyRef.current)
            return;
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
            const id = order?.id ?? order?.data?.id;
            setSuccessOrderId(id);
            setStep('success');
            opts.onCartChanged?.();
            await refreshCart();
        }
        catch (e) {
            setErrorMessage(e?.message ?? 'Order failed. Please try again.');
            setStep('failed');
        }
        finally {
            setLoading(false);
            busyRef.current = false;
        }
    }, [buildOrderPayload, total, appliedCoins, api, opts, refreshCart]);
    /* ── Card order (create order, then get clientSecret) ─────── */
    const prepareCard = useCallback(async () => {
        if (busyRef.current)
            return;
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
            const id = order?.id ?? order?.data?.id;
            setOrderId(id);
            const secret = await api.getStripeSecret(grandTotal, email || selectedAddress?.email || '', id);
            setStripeSecret(secret);
        }
        catch (e) {
            setErrorMessage(e?.message ?? 'Could not initialise payment.');
            setStep('failed');
        }
        finally {
            setLoading(false);
            busyRef.current = false;
        }
    }, [buildOrderPayload, orderId, api, grandTotal, email, selectedAddress]);
    const confirmCard = useCallback(async (stripe, elements) => {
        if (!stripe || !elements || !stripeSecret)
            return;
        setLoading(true);
        setErrorMessage(null);
        setStep('processing');
        try {
            const { error: submitError } = await elements.submit();
            if (submitError)
                throw new Error(submitError.message);
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
                    try {
                        await api.confirmStripeOrder(orderId, { online_payment: 'no' });
                    }
                    catch { /* ignore */ }
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
                    }
                    catch { /* ignore — order still created */ }
                }
                setSuccessOrderId(orderId);
                setStep('success');
                opts.onCartChanged?.();
                await refreshCart();
            }
            else {
                throw new Error('Payment was not completed.');
            }
        }
        catch (e) {
            setErrorMessage(e?.message ?? 'Payment failed.');
            setStep('failed');
        }
        finally {
            setLoading(false);
        }
    }, [stripeSecret, cfg, config.websiteUrl, customerName, selectedAddress, email, orderId, api, opts, refreshCart]);
    /* ── Login ────────────────────────────────────────────────── */
    const login = useCallback(async (loginEmail, password) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            await api.login(loginEmail, password);
            setEmail(loginEmail);
            await startCheckout();
        }
        catch (e) {
            setErrorMessage(e?.message ?? 'Login failed.');
        }
        finally {
            setLoading(false);
        }
    }, [api, startCheckout]);
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
        removeItem,
        startCheckout,
        confirmCash,
        prepareCard,
        confirmCard,
        login,
        api,
        stripePublishableKey: cfg?.stripePublishableKey,
        currencySymbol,
        freeShippingThreshold: freeThreshold,
        freeShippingExcludedState: excludedState,
        orderCutoffTime,
    };
}
