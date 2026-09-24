'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { getStrings } from '../../lib/i18n';
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
function StripePaymentForm({ commerce, brandColor, symbol, strings, }) {
    const stripe = useStripe();
    const elements = useElements();
    const [complete, setComplete] = useState(false);
    const busy = commerce.loading;
    return (_jsxs("div", { className: "gunma-commerce-section", children: [_jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: strings.total }), _jsx("strong", { children: money(symbol, commerce.grandTotal) })] }), _jsx(PaymentElement, { id: "payment-element", onChange: (e) => setComplete(e.complete) }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: busy || !stripe || !elements || !complete, onClick: () => commerce.confirmCard(stripe, elements), children: busy ? '…' : strings.payNow(money(symbol, commerce.grandTotal)) }), commerce.errorMessage && _jsx("p", { className: "gunma-commerce-error", children: commerce.errorMessage })] }));
}
export function CommercePanel({ commerce, brandColor, onClose, strings }) {
    const s = strings ?? getStrings('en');
    const symbol = commerce.currencySymbol;
    const { step, cart, subtotal, shippingCharge, totalTax, total, grandTotal, addresses, selectedAddress, selectAddress, deliveryInfo, earliestDate, deliveryDate, setDeliveryDate, deliveryTime, setDeliveryTime, coins, appliedCoins, setAppliedCoins, email, setEmail, customerName, successOrderId, errorMessage, loading, refreshCart, removeItem, startCheckout, confirmCash, prepareCard, login, register, } = commerce;
    const [loginEmail, setLoginEmail] = useState(email || '');
    const [loginPassword, setLoginPassword] = useState('');
    const [authMode, setAuthMode] = useState('login');
    const [regName, setRegName] = useState(customerName || '');
    const [regPhone, setRegPhone] = useState('');
    const [payMode, setPayMode] = useState('Cash');
    React.useEffect(() => {
        refreshCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const header = (_jsxs("div", { className: "gunma-commerce-head", children: [_jsx("span", { children: s.checkout }), _jsx("button", { className: "gunma-commerce-close", onClick: onClose, "aria-label": "Close", children: "\u2715" })] }));
    /* ── Success ─────────────────────────────────────────────── */
    if (step === 'success') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-success", children: [_jsx("div", { className: "gunma-commerce-check", children: "\u2713" }), _jsx("p", { children: s.orderPlaced }), successOrderId != null && _jsxs("p", { className: "gunma-commerce-order", children: [s.orderNo, " #", successOrderId] }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, onClick: onClose, children: s.done })] })] }));
    }
    /* ── Login / Register ────────────────────────────────────── */
    if (step === 'auth') {
        const isRegister = authMode === 'register';
        const canSubmitLogin = !loading && !!loginEmail && !!loginPassword;
        const canSubmitRegister = !loading &&
            !!regName.trim() &&
            !!regPhone.trim() &&
            !!loginEmail &&
            loginPassword.length >= 6;
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsxs("div", { className: "gunma-commerce-modes", style: { marginBottom: 12 }, children: [_jsx("button", { className: `gunma-commerce-mode ${!isRegister ? 'is-active' : ''}`, onClick: () => { setAuthMode('login'); }, children: s.loginTab }), _jsx("button", { className: `gunma-commerce-mode ${isRegister ? 'is-active' : ''}`, onClick: () => { setAuthMode('register'); }, children: s.registerTab })] }), _jsx("p", { className: "gunma-commerce-muted", children: isRegister ? s.noAccount : s.loginToContinue }), isRegister && (_jsxs(_Fragment, { children: [_jsx("input", { className: "gunma-commerce-input", type: "text", placeholder: s.fullName, value: regName, onChange: (e) => setRegName(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", type: "tel", placeholder: s.phone, value: regPhone, onChange: (e) => setRegPhone(e.target.value) })] })), _jsx("input", { className: "gunma-commerce-input", type: "email", placeholder: s.email, value: loginEmail, onChange: (e) => setLoginEmail(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", type: "password", placeholder: s.password, value: loginPassword, onChange: (e) => setLoginPassword(e.target.value) }), isRegister ? (_jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: !canSubmitRegister, onClick: () => register({ name: regName.trim(), contact_no: regPhone.trim(), email: loginEmail, password: loginPassword }), children: loading ? '…' : s.createAccount })) : (_jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: !canSubmitLogin, onClick: () => login(loginEmail, loginPassword), children: loading ? '…' : s.loginAndContinue })), errorMessage && _jsx("p", { className: "gunma-commerce-error", children: errorMessage }), _jsxs("p", { className: "gunma-commerce-muted", children: [isRegister ? s.haveAccount : s.noAccount, ' ', _jsx("a", { href: "#", onClick: (e) => { e.preventDefault(); setAuthMode(isRegister ? 'login' : 'register'); }, children: isRegister ? s.loginTab : s.registerTab })] })] })] }));
    }
    /* ── Processing ──────────────────────────────────────────── */
    if (step === 'processing') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-success", children: [_jsx("div", { className: "gunma-commerce-spinner" }), _jsx("p", { children: s.processing })] })] }));
    }
    /* ── Failed ──────────────────────────────────────────────── */
    if (step === 'failed') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("p", { className: "gunma-commerce-error", children: errorMessage ?? 'Something went wrong.' }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, onClick: () => startCheckout(), children: s.tryAgain })] })] }));
    }
    /* ── Delivery + payment ──────────────────────────────────── */
    if (step === 'delivery') {
        const cardEnabled = !!commerce.stripePublishableKey;
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("h4", { className: "gunma-commerce-h", children: s.delivery }), selectedAddress ? (_jsxs("div", { className: "gunma-commerce-address", children: [_jsx("strong", { children: selectedAddress.name }), _jsx("span", { children: selectedAddress.phone }), _jsx("span", { children: [selectedAddress.apartment, selectedAddress.street, selectedAddress.city, selectedAddress.state]
                                        .filter(Boolean)
                                        .join(', ') }), _jsxs("span", { children: ["\u3012", selectedAddress.postal_code] })] })) : (_jsx("p", { className: "gunma-commerce-muted", children: "No address selected." })), addresses.length > 1 && (_jsx("select", { className: "gunma-commerce-input", value: selectedAddress?.id ?? '', onChange: (e) => {
                                const a = addresses.find((x) => String(x.id) === e.target.value);
                                if (a)
                                    selectAddress(a);
                            }, children: addresses.map((a) => (_jsxs("option", { value: a.id, children: [a.name, " \u2014 \u3012", a.postal_code, " ", a.city] }, a.id))) })), _jsx("label", { className: "gunma-commerce-label", children: s.deliveryDate }), _jsx("input", { className: "gunma-commerce-input", type: "date", min: earliestDate ?? undefined, value: deliveryDate, onChange: (e) => setDeliveryDate(e.target.value) }), deliveryInfo?.schedules?.length ? (_jsxs(_Fragment, { children: [_jsx("label", { className: "gunma-commerce-label", children: s.deliveryTime }), _jsx("select", { className: "gunma-commerce-input", value: deliveryTime, onChange: (e) => setDeliveryTime(e.target.value), children: deliveryInfo.schedules.map((s) => (_jsx("option", { value: s.schedule, children: s.schedule }, s.id))) })] })) : null, coins > 0 && (_jsxs("label", { className: "gunma-commerce-coins", children: [_jsx("input", { type: "checkbox", checked: appliedCoins > 0, onChange: (e) => setAppliedCoins(e.target.checked ? coins : 0) }), s.useCoins(coins)] }))] }), _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("h4", { className: "gunma-commerce-h", children: s.payment }), _jsxs("div", { className: "gunma-commerce-modes", children: [_jsx("button", { className: `gunma-commerce-mode ${payMode === 'Cash' ? 'is-active' : ''}`, onClick: () => setPayMode('Cash'), children: s.cashOnDelivery }), cardEnabled && (_jsx("button", { className: `gunma-commerce-mode ${payMode === 'Card' ? 'is-active' : ''}`, onClick: () => setPayMode('Card'), children: s.card }))] }), _jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: s.subtotal }), _jsx("span", { children: money(symbol, subtotal) })] }), _jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: s.tax }), _jsx("span", { children: money(symbol, totalTax) })] }), _jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: s.shipping }), _jsx("span", { children: shippingCharge === 0 ? s.free : money(symbol, shippingCharge) })] }), appliedCoins > 0 && (_jsxs("div", { className: "gunma-commerce-total-row", children: [_jsx("span", { children: s.coins }), _jsxs("span", { children: ["-", money(symbol, appliedCoins)] })] })), _jsxs("div", { className: "gunma-commerce-total-row gunma-commerce-grand", children: [_jsx("span", { children: s.total }), _jsx("strong", { children: money(symbol, grandTotal) })] }), payMode === 'Cash' ? (_jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading || !deliveryDate || !deliveryTime, onClick: () => confirmCash(), children: loading ? 'Placing…' : s.placeOrderCash })) : (_jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading || !deliveryDate || !deliveryTime, onClick: () => prepareCard(), children: s.continueToPayment })), errorMessage && _jsx("p", { className: "gunma-commerce-error", children: errorMessage })] }), payMode === 'Card' && commerce.stripeSecret && (_jsx(Elements, { stripe: getStripePromise(commerce.stripePublishableKey), options: { clientSecret: commerce.stripeSecret }, children: _jsx(StripePaymentForm, { commerce: commerce, brandColor: brandColor, symbol: symbol, strings: s }) }))] }));
    }
    /* ── Address choice (no default address) ─────────────────── */
    if (step === 'address') {
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("p", { className: "gunma-commerce-muted", children: s.noAddress }), _jsx("a", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor, textAlign: 'center' }, href: "/new-address", target: "_blank", rel: "noreferrer", children: s.addAddress })] })] }));
    }
    /* ── Cart (default) ──────────────────────────────────────── */
    return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsx("div", { className: "gunma-commerce-section", children: cart.length === 0 ? (_jsx("p", { className: "gunma-commerce-muted", children: s.cartEmpty })) : (_jsxs(_Fragment, { children: [cart.map((item) => (_jsxs("div", { className: "gunma-commerce-item", children: [item.image && _jsx("img", { className: "gunma-commerce-item-img", src: item.image, alt: "" }), _jsxs("div", { className: "gunma-commerce-item-body", children: [_jsx("span", { className: "gunma-commerce-item-title", children: item.title ?? item.product_title ?? `#${item.product_id}` }), _jsxs("span", { className: "gunma-commerce-item-sub", children: [item.quantity, " \u00D7 ", money(symbol, Number(item.item_price || 0))] })] }), _jsx("button", { className: "gunma-commerce-remove", onClick: () => removeItem(item.id), "aria-label": "Remove", children: "\u2715" })] }, item.id))), _jsxs("div", { className: "gunma-commerce-total-row gunma-commerce-grand", children: [_jsx("span", { children: s.subtotal }), _jsx("strong", { children: money(symbol, subtotal) })] }), subtotal < commerce.freeShippingThreshold && (_jsx("p", { className: "gunma-commerce-muted", children: s.freeShipHint(money(symbol, commerce.freeShippingThreshold - subtotal)) })), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading, onClick: () => startCheckout(), children: loading ? 'Please wait…' : s.checkout }), errorMessage && _jsx("p", { className: "gunma-commerce-error", children: errorMessage })] })) })] }));
}
