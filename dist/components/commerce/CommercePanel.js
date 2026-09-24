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
    const { step, cart, subtotal, shippingCharge, totalTax, total, grandTotal, addresses, selectedAddress, selectAddress, deliveryInfo, earliestDate, deliveryDate, setDeliveryDate, deliveryTime, setDeliveryTime, coins, appliedCoins, setAppliedCoins, email, setEmail, customerName, successOrderId, errorMessage, loading, refreshCart, removeItem, startCheckout, confirmCash, prepareCard, login, register, stockIssues, hasStockIssues, fixStockIssue, removeStockIssue, fixAllStockIssues, saveAddress, } = commerce;
    const [loginEmail, setLoginEmail] = useState(email || '');
    const [loginPassword, setLoginPassword] = useState('');
    const [authMode, setAuthMode] = useState('login');
    const [regName, setRegName] = useState(customerName || '');
    const [regPhone, setRegPhone] = useState('');
    // Address edit form
    const [editingAddress, setEditingAddress] = useState(false);
    const [addrName, setAddrName] = useState('');
    const [addrPhone, setAddrPhone] = useState('');
    const [addrPostal, setAddrPostal] = useState('');
    const [addrChome, setAddrChome] = useState('');
    const [addrApartment, setAddrApartment] = useState('');
    const [addrStreet, setAddrStreet] = useState('');
    const [addrCity, setAddrCity] = useState('');
    const [addrState, setAddrState] = useState('');
    const [addrPostCodeId, setAddrPostCodeId] = useState(null);
    const beginEditAddress = () => {
        setAddrName(selectedAddress?.name ?? '');
        setAddrPhone(selectedAddress?.phone ?? '');
        setAddrPostal(selectedAddress?.postal_code ?? '');
        setAddrChome(selectedAddress?.chome ?? '');
        setAddrApartment(selectedAddress?.apartment ?? '');
        setAddrStreet(selectedAddress?.street ?? '');
        setAddrCity(selectedAddress?.city ?? '');
        setAddrState(selectedAddress?.state ?? '');
        setAddrPostCodeId(selectedAddress?.post_code_id ?? null);
        setEditingAddress(true);
    };
    const [payMode, setPayMode] = useState('Cash');
    React.useEffect(() => {
        refreshCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const header = (_jsxs("div", { className: "gunma-commerce-head", children: [_jsx("span", { children: s.checkout }), _jsx("button", { className: "gunma-commerce-close", onClick: onClose, "aria-label": "Close", children: "\u2715" })] }));
    /* ── Success ─────────────────────────────────────────────── */
    if (step === 'success') {
        const fmtDate = (d) => {
            if (!d)
                return null;
            try {
                return new Date(d + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'long', day: 'numeric', month: 'long',
                });
            }
            catch {
                return d;
            }
        };
        const etaDate = fmtDate(commerce.successDelivery?.date);
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-success", children: [_jsx("div", { className: "gunma-commerce-check", children: "\u2713" }), _jsx("p", { className: "gunma-commerce-success-title", children: s.orderPlaced }), successOrderId != null && _jsxs("p", { className: "gunma-commerce-order", children: [s.orderNo, " #", successOrderId] }), etaDate && (_jsxs("p", { className: "gunma-commerce-eta", children: ["\uD83D\uDE9A ", s.deliveryOn(etaDate), commerce.successDelivery?.time ? ` • ${commerce.successDelivery.time}` : ''] })), !etaDate && _jsx("p", { className: "gunma-commerce-muted", children: s.deliverySoon }), _jsx("p", { className: "gunma-commerce-thanks", children: s.orderThanks }), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, onClick: onClose, children: s.done })] })] }));
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
        return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsxs("div", { className: "gunma-commerce-section", children: [_jsx("h4", { className: "gunma-commerce-h", children: s.delivery }), editingAddress ? (_jsxs("div", { className: "gunma-commerce-address-form", children: [_jsx("input", { className: "gunma-commerce-input", placeholder: s.addrName, value: addrName, onChange: (e) => setAddrName(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", type: "tel", placeholder: s.addrPhone, value: addrPhone, onChange: (e) => setAddrPhone(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", placeholder: s.addrPostal, value: addrPostal, onChange: (e) => setAddrPostal(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", placeholder: s.addrChome, value: addrChome, onChange: (e) => setAddrChome(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", placeholder: s.addrApartment, value: addrApartment, onChange: (e) => setAddrApartment(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", placeholder: s.addrStreet, value: addrStreet, onChange: (e) => setAddrStreet(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", placeholder: s.addrCity, value: addrCity, onChange: (e) => setAddrCity(e.target.value) }), _jsx("input", { className: "gunma-commerce-input", placeholder: s.addrState, value: addrState, onChange: (e) => setAddrState(e.target.value) }), _jsxs("div", { className: "gunma-commerce-address-form-actions", children: [_jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading || !addrName.trim() || !addrPhone.trim() || !addrPostal.trim(), onClick: async () => {
                                                try {
                                                    // Resolve post_code_id from the postal code (host requires it).
                                                    let postCodeId = addrPostCodeId;
                                                    if (addrPostal.trim().length >= 7) {
                                                        try {
                                                            const codes = await commerce.api.getPostCodes(addrPostal.trim());
                                                            if (codes && codes.length) {
                                                                postCodeId = codes[0].id;
                                                                if (codes[0].state)
                                                                    setAddrState(codes[0].state);
                                                                if (codes[0].city)
                                                                    setAddrCity(codes[0].city);
                                                                if (codes[0].street)
                                                                    setAddrStreet(codes[0].street);
                                                            }
                                                        }
                                                        catch {
                                                            /* keep existing id */
                                                        }
                                                    }
                                                    await saveAddress({
                                                        name: addrName.trim(),
                                                        phone: addrPhone.trim(),
                                                        postal_code: addrPostal.trim(),
                                                        chome: addrChome.trim(),
                                                        apartment: addrApartment.trim(),
                                                        street: addrStreet.trim(),
                                                        city: addrCity.trim(),
                                                        state: addrState.trim(),
                                                        post_code_id: postCodeId,
                                                        type: null,
                                                        default: 'Yes',
                                                    }, selectedAddress?.id);
                                                    setEditingAddress(false);
                                                }
                                                catch {
                                                    /* error surfaced by hook */
                                                }
                                            }, children: s.addrSave }), _jsx("button", { className: "gunma-commerce-secondary", disabled: loading, onClick: () => setEditingAddress(false), children: s.addrCancel })] })] })) : selectedAddress ? (_jsxs("div", { className: "gunma-commerce-address", children: [_jsx("strong", { children: selectedAddress.name }), _jsx("span", { children: selectedAddress.phone }), _jsx("span", { children: [selectedAddress.apartment, selectedAddress.street, selectedAddress.city, selectedAddress.state]
                                        .filter(Boolean)
                                        .join(', ') }), _jsxs("span", { children: ["\u3012", selectedAddress.postal_code] }), _jsx("button", { className: "gunma-commerce-address-edit", onClick: beginEditAddress, children: s.addrEdit })] })) : (_jsx("p", { className: "gunma-commerce-muted", children: "No address selected." })), !editingAddress && addresses.length > 1 && (_jsx("select", { className: "gunma-commerce-input", value: selectedAddress?.id ?? '', onChange: (e) => {
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
    return (_jsxs("div", { className: "gunma-commerce", children: [header, _jsx("div", { className: "gunma-commerce-section", children: cart.length === 0 ? (_jsx("p", { className: "gunma-commerce-muted", children: s.cartEmpty })) : (_jsxs(_Fragment, { children: [hasStockIssues && (_jsxs("div", { className: "gunma-commerce-stock-warning", children: [_jsxs("strong", { children: ["\u26A0\uFE0F ", s.stockIssueTitle] }), _jsx("ul", { children: stockIssues.map((iss) => (_jsx("li", { children: _jsxs("span", { className: "gunma-commerce-stock-line", children: [_jsxs("span", { children: [iss.title, " \u2014 ", s.stockReason(iss.reason), iss.reason === 'insufficient' && iss.available !== null
                                                            ? ` (${s.stockOnly(iss.available)}; ${s.stockRequested(iss.requested)})`
                                                            : ''] }), _jsxs("span", { className: "gunma-commerce-stock-actions", children: [iss.fixable && iss.available !== null && (_jsx("button", { className: "gunma-commerce-stock-fix", disabled: loading, onClick: () => fixStockIssue(iss.id), children: s.stockReduceTo(Math.max(1, iss.available)) })), _jsx("button", { className: "gunma-commerce-stock-remove", disabled: loading, onClick: () => removeStockIssue(iss.id), children: s.stockRemove })] })] }) }, iss.id))) }), stockIssues.length > 1 && (_jsx("button", { className: "gunma-commerce-stock-fix-all", disabled: loading, onClick: () => fixAllStockIssues(), children: s.stockFixAll })), stockIssues.length === 1 && _jsx("span", { children: s.stockIssueHint })] })), cart.map((item) => {
                            const issue = stockIssues.find((x) => String(x.id) === String(item.id));
                            return (_jsxs("div", { className: `gunma-commerce-item ${issue ? 'gunma-commerce-item--invalid' : ''}`, children: [item.image && _jsx("img", { className: "gunma-commerce-item-img", src: item.image, alt: "" }), _jsxs("div", { className: "gunma-commerce-item-body", children: [_jsx("span", { className: "gunma-commerce-item-title", children: item.title ?? item.product_title ?? `#${item.product_id}` }), _jsxs("span", { className: "gunma-commerce-item-sub", children: [item.quantity, " \u00D7 ", money(symbol, Number(item.item_price || 0))] }), issue && _jsx("span", { className: "gunma-commerce-item-bad", children: s.stockReason(issue.reason) })] }), _jsx("button", { className: "gunma-commerce-remove", onClick: () => removeItem(item.id), "aria-label": "Remove", children: "\u2715" })] }, item.id));
                        }), _jsxs("div", { className: "gunma-commerce-total-row gunma-commerce-grand", children: [_jsx("span", { children: s.subtotal }), _jsx("strong", { children: money(symbol, subtotal) })] }), subtotal < commerce.freeShippingThreshold && (_jsx("p", { className: "gunma-commerce-muted", children: s.freeShipHint(money(symbol, commerce.freeShippingThreshold - subtotal)) })), _jsx("button", { className: "gunma-commerce-primary", style: { backgroundColor: brandColor }, disabled: loading || hasStockIssues, onClick: () => startCheckout(), children: loading ? 'Please wait…' : s.checkout }), errorMessage && _jsx("p", { className: "gunma-commerce-error", children: errorMessage })] })) })] }));
}
