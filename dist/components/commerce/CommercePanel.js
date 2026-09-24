'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
/** Cache Stripe.js instances per publishable key. */
const stripeCache = {};
function getStripePromise(key) {
    if (!stripeCache[key])
        stripeCache[key] = loadStripe(key);
    return stripeCache[key];
}
function money(symbol, n) {
    return `${symbol}${Number(n || 0).toLocaleString('ja-JP')}`;
}
/** Stripe Payment Element form (mirrors storefront StripeFormChange). */
function StripePaymentForm({ commerce, brandColor, symbol, }) {
    const stripe = useStripe();
    const elements = useElements();
    const [complete, setComplete] = useState(false);
    const busy = commerce.loading;
    return (_jsxs("div", { className: "gunma-commerce-section", children: [_jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: "Amount to pay" }), _jsx("strong", { children: money(symbol, commerce.grandTotal) })] }), _jsx(PaymentElement, { id: "payment-element", onChange: (e) => setComplete(e.complete) }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: busy || !stripe || !elements || !complete, onClick: () => commerce.confirmCard(stripe, elements), children: busy ? 'Processing…' : `Pay ${money(symbol, commerce.grandTotal)}` }), commerce.errorMessage && _jsx("p", { className: "gunma-commerce-error", children: commerce.errorMessage })] }));
}
export function CommercePanel({ commerce, brandColor, onClose }) {
    const symbol = commerce.currencySymbol;
    const { step, cart, subtotal, shippingCharge, totalTax, total, grandTotal, addresses, selectedAddress, selectAddress, deliveryInfo, earliestDate, deliveryDate, setDeliveryDate, deliveryTime, setDeliveryTime, coins, appliedCoins, setAppliedCoins, email, setEmail, customerName, successOrderId, errorMessage, loading, refreshCart, removeItem, startCheckout, confirmCash, prepareCard, login, } = commerce;
    const [loginEmail, setLoginEmail] = useState(email || '');
    const [loginPassword, setLoginPassword] = useState('');
    const [payMode, setPayMode] = useState('Cash');
    React.useEffect(() => {
        refreshCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const header = (_jsxs("div", { className: "gunma-commerce-head", children: [_jsx("span", { children: "Checkout" }), _jsx("button", { className: "gunma-commerce-close", onClick: onClose, "aria-label": "Close", children: "\u2715" })] }));
    /* ── Success ─────────────────────────────────────────────── */
    if (step === 'success') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-success", children: [_jsx("div", { className: "gunma-commerce-check", children: "\u2713" }), _jsx("p", { children: "Order placed successfully!" }), successOrderId != null && _jsxs("p", { className: "gunma-commerce-order", children: ["Order No. #", successOrderId] }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, onClick: onClose, children: "Done" })] })] }));
    }
    /* ── Login ───────────────────────────────────────────────── */
    if (step === 'auth') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("p", { className: "gunma-commerce-muted", children: "Please log in to continue checkout." }), _jsx("input", { className: "gunma-commerce-input", type: "email", placeholder: "Email", value: loginEmail, onChange: (e) => setLoginEmail(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", type: "password", placeholder: "Password", value: loginPassword, onChange: (e) => setLoginPassword(e.target.value) }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading || !loginEmail || !loginPassword, onClick: () => login(loginEmail, loginPassword), children: loading ? 'Logging in…' : 'Log in & continue' }), errorMessage && _jsx("p", { className: "gunma-commerce-error", children: errorMessage }), _jsxs("p", { className: "gunma-commerce-muted", children: ["Prefer the website?", ' ', _jsx("a", { href: "/login?redirect=/checkout", target: "_blank", rel: "noreferrer", children: "Log in here" }), ", then reopen chat."] })] })] }));
    }
    /* ── Processing ──────────────────────────────────────────── */
    if (step === 'processing') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-success", children: [_jsx("div", { className: "gunma-commerce-spinner" }), _jsx("p", { children: "Processing your order\u2026" })] })] }));
    }
    /* ── Failed ──────────────────────────────────────────────── */
    if (step === 'failed') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("p", { className: "gunma-commerce-error", children: errorMessage ?? 'Something went wrong.' }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, onClick: () => startCheckout(), children: "Try again" })] })] }));
    }
    /* ── Delivery + payment ──────────────────────────────────── */
    if (step === 'delivery') {
        const cardEnabled = !!commerce.stripePublishableKey;
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("h4", { className: "gunma-commerce-h", children: "Delivery" }), selectedAddress ? (_jsxs("div", { className: "gunma-commerce-address", children: [_jsx("strong", { children: selectedAddress.name }), _jsx("span", { children: selectedAddress.phone }), _jsx("span", { children: [selectedAddress.apartment, selectedAddress.street, selectedAddress.city, selectedAddress.state]
                                        .filter(Boolean)
                                        .join(', ') }), _jsxs("span", { children: ["\u3012", selectedAddress.postal_code] })] })) : (_jsx("p", { className: "gunma-commerce-muted", children: "No address selected." })), addresses.length > 1 && (_jsx("select", { className: "gunma-commerce-input", value: selectedAddress?.id ?? '', onChange: (e) => {
                                const a = addresses.find((x) => String(x.id) === e.target.value);
                                if (a)
                                    selectAddress(a);
                            }, children: addresses.map((a) => (_jsxs("option", { value: a.id, children: [a.name, " \u2014 \u3012", a.postal_code, " ", a.city] }, a.id))) })), _jsx("label", { className: "gunma-commerce-label", children: "Delivery date" }), _jsx("input", { className: "gunma-commerce-input", type: "date", min: earliestDate ?? undefined, value: deliveryDate, onChange: (e) => setDeliveryDate(e.target.value) }), deliveryInfo?.schedules?.length ? (_jsxs(_Fragment, { children: [_jsx("label", { className: "gunma-commerce-label", children: "Delivery time" }), _jsx("select", { className: "gunma-commerce-input", value: deliveryTime, onChange: (e) => setDeliveryTime(e.target.value), children: deliveryInfo.schedules.map((s) => (_jsx("option", { value: s.schedule, children: s.schedule }, s.id))) })] })) : null, coins > 0 && (_jsxs("label", { className: "gunma-commerce-coins", children: [_jsx("input", { type: "checkbox", checked: appliedCoins > 0, onChange: (e) => setAppliedCoins(e.target.checked ? coins : 0) }), "Use ", coins, " loyalty coins"] }))] }), _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("h4", { className: "gunma-commerce-h", children: "Payment" }), _jsxs("div", { className: "gunma-commerce-modes", children: [_jsx("button", { className: `gunma-commerce-mode ${payMode === 'Cash' ? 'is-active' : ''}`, onClick: () => setPayMode('Cash'), children: "Cash on Delivery" }), cardEnabled && (_jsx("button", { className: `gunma-commerce-mode ${payMode === 'Card' ? 'is-active' : ''}`, onClick: () => setPayMode('Card'), children: "Credit / Debit Card" }))] }), _jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: "Subtotal" }), _jsx("span", { children: money(symbol, subtotal) })] }), _jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: "Tax" }), _jsx("span", { children: money(symbol, totalTax) })] }), _jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: "Shipping" }), _jsx("span", { children: shippingCharge === 0 ? 'Free' : money(symbol, shippingCharge) })] }), appliedCoins > 0 && (_jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: "Coins" }), _jsxs("span", { children: ["-", money(symbol, appliedCoins)] })] })), _jsxs("div", { className: "gunma-commerce-total-row gunma-commerce-grand", children: [_jsx("span", { children: "Total" }), _jsx("strong", { children: money(symbol, grandTotal) })] }), payMode === 'Cash' ? (_jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading || !deliveryDate || !deliveryTime, onClick: () => confirmCash(), children: loading ? 'Placing order…' : 'Place order (Cash)' })) : (_jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading || !deliveryDate || !deliveryTime, onClick: () => prepareCard(), children: "Continue to payment" })), errorMessage && _jsx("p", { className: "gunma-commerce-error", children: errorMessage })] }), payMode === 'Card' && commerce.stripeSecret && (_jsx(Elements, { stripe: getStripePromise(commerce.stripePublishableKey), options: { clientSecret: commerce.stripeSecret }, children: _jsx(StripePaymentForm, { commerce: commerce, brandColor: brandColor, symbol: symbol }) }))] }));
    }
    /* ── Address choice (no default address) ─────────────────── */
    if (step === 'address') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("p", { className: "gunma-commerce-muted", children: "No delivery address found." }), _jsx("a", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor, textAlign: 'center' }, href: "/new-address", target: "_blank", rel: "noreferrer", children: "Add a new address" })] })] }));
    }
    /* ── Cart (default) ──────────────────────────────────────── */
    return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsx("div", { className: "gunma-commerce-section", children: cart.length === 0 ? (_jsx("p", { className: "gunma-commerce-muted", children: "Your cart is empty." })) : (_jsxs(_Fragment, { children: [cart.map((item) => (_jsxs("div", { className: "gunma-commerce-item", children: [item.image && _jsx("img", { className: "gunma-commerce-item-img", src: item.image, alt: "" }), _jsxs("div", { className: "gunma-commerce-item-body", children: [_jsx("span", { className: "gunma-commerce-item-title", children: item.title ?? item.product_title ?? `#${item.product_id}` }), _jsxs("span", { className: "gunma-commerce-item-sub", children: [item.quantity, " \u00D7 ", money(symbol, Number(item.item_price || 0))] })] }), _jsx("button", { className: "gunma-commerce-remove", onClick: () => removeItem(item.id), "aria-label": "Remove", children: "\u2715" })] }, item.id))), _jsxs("div", { className: "gunma-commerce-total-row gunma-commerce-grand", children: [_jsx("span", { children: "Subtotal" }), _jsx("strong", { children: money(symbol, subtotal) })] }), subtotal < commerce.freeShippingThreshold && (_jsxs("p", { className: "gunma-commerce-muted", children: ["Add ", money(symbol, commerce.freeShippingThreshold - subtotal), " more for free shipping."] })), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading, onClick: () => startCheckout(), children: loading ? 'Please wait…' : 'Checkout' }), errorMessage && _jsx("p", { className: "gunma-commerce-error", children: errorMessage })] })) })] }));
}
