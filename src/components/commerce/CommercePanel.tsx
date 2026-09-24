'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { UseCommerceResult } from '../../hooks/useCommerce';
import { getStrings, type WidgetStrings } from '../../lib/i18n';

/** Cache Stripe.js instances per publishable key. */
const stripeCache: Record<string, ReturnType<typeof loadStripe>> = {};
function getStripePromise(key: string) {
  if (!stripeCache[key]) stripeCache[key] = loadStripe(key);
  return stripeCache[key];
}

interface CommercePanelProps {
  commerce: UseCommerceResult;
  brandColor: string;
  onClose: () => void;
  /** Whether the chat header's cart button opened this panel. */
  freeShippingThreshold: number;
  /** UI strings (i18n). */
  strings?: WidgetStrings;
}

function money(symbol: string, n: number): string {
  return `${symbol}${Number(n || 0).toLocaleString('ja-JP')}`;
}

/** Stripe Payment Element form (mirrors storefront StripeFormChange). */
function StripePaymentForm({
  commerce,
  brandColor,
  symbol,
  strings,
}: {
  commerce: UseCommerceResult;
  brandColor: string;
  symbol: string;
  strings: WidgetStrings;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [complete, setComplete] = useState(false);
  const busy = commerce.loading;

  return (
    <div className="gunma-commerce-section">
      <div className="gunma-commerce-total-row">
        <span>{strings.total}</span>
        <strong>{money(symbol, commerce.grandTotal)}</strong>
      </div>
      <PaymentElement id="payment-element" onChange={(e) => setComplete(e.complete)} />
      <button
        className="gunma-commerce-primary"
        style={{ backgroundColor: brandColor }}
        disabled={busy || !stripe || !elements || !complete}
        onClick={() => commerce.confirmCard(stripe, elements)}
      >
        {busy ? '…' : strings.payNow(money(symbol, commerce.grandTotal))}
      </button>
      {commerce.errorMessage && <p className="gunma-commerce-error">{commerce.errorMessage}</p>}
    </div>
  );
}

export function CommercePanel({ commerce, brandColor, onClose, strings }: CommercePanelProps) {
  const s = strings ?? getStrings('en');
  const symbol = commerce.currencySymbol;
  const {
    step, cart, subtotal, shippingCharge, totalTax, total, grandTotal,
    addresses, selectedAddress, selectAddress,
    deliveryInfo, earliestDate, deliveryDate, setDeliveryDate, deliveryTime, setDeliveryTime,
    coins, appliedCoins, setAppliedCoins,
    email, setEmail, customerName,
    successOrderId, errorMessage, loading,
    refreshCart, removeItem, startCheckout, confirmCash, prepareCard, login, register,
    stockIssues, hasStockIssues, fixStockIssue, removeStockIssue, fixAllStockIssues,
  } = commerce as UseCommerceResult & { email: string; setEmail: (v: string) => void };

  const [loginEmail, setLoginEmail] = useState(email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState(customerName || '');
  const [regPhone, setRegPhone] = useState('');
  const [payMode, setPayMode] = useState<'Cash' | 'Card'>('Cash');

  React.useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const header = (
    <div className="gunma-commerce-head">
      <span>{s.checkout}</span>
      <button className="gunma-commerce-close" onClick={onClose} aria-label="Close">✕</button>
    </div>
  );

  /* ── Success ─────────────────────────────────────────────── */
  if (step === 'success') {
    return (
      <div className="gunma-commerce">
        {header}
        <div className="gunma-commerce-success">
          <div className="gunma-commerce-check">✓</div>
          <p>{s.orderPlaced}</p>
          {successOrderId != null && <p className="gunma-commerce-order">{s.orderNo} #{successOrderId}</p>}
          <button className="gunma-commerce-primary" style={{ backgroundColor: brandColor }} onClick={onClose}>
            {s.done}
          </button>
        </div>
      </div>
    );
  }

  /* ── Login / Register ────────────────────────────────────── */
  if (step === 'auth') {
    const isRegister = authMode === 'register';
    const canSubmitLogin = !loading && !!loginEmail && !!loginPassword;
    const canSubmitRegister =
      !loading &&
      !!regName.trim() &&
      !!regPhone.trim() &&
      !!loginEmail &&
      loginPassword.length >= 6;

    return (
      <div className="gunma-commerce">
        {header}
        <div className="gunma-commerce-section">
          <div className="gunma-commerce-modes" style={{ marginBottom: 12 }}>
            <button
              className={`gunma-commerce-mode ${!isRegister ? 'is-active' : ''}`}
              onClick={() => { setAuthMode('login'); }}
            >
              {s.loginTab}
            </button>
            <button
              className={`gunma-commerce-mode ${isRegister ? 'is-active' : ''}`}
              onClick={() => { setAuthMode('register'); }}
            >
              {s.registerTab}
            </button>
          </div>

          <p className="gunma-commerce-muted">
            {isRegister ? s.noAccount : s.loginToContinue}
          </p>

          {isRegister && (
            <>
              <input
                className="gunma-commerce-input"
                type="text"
                placeholder={s.fullName}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
              <input
                className="gunma-commerce-input"
                type="tel"
                placeholder={s.phone}
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
              />
            </>
          )}

          <input
            className="gunma-commerce-input"
            type="email"
            placeholder={s.email}
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <input
            className="gunma-commerce-input"
            type="password"
            placeholder={s.password}
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          {isRegister ? (
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={!canSubmitRegister}
              onClick={() =>
                register({ name: regName.trim(), contact_no: regPhone.trim(), email: loginEmail, password: loginPassword })
              }
            >
              {loading ? '…' : s.createAccount}
            </button>
          ) : (
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={!canSubmitLogin}
              onClick={() => login(loginEmail, loginPassword)}
            >
              {loading ? '…' : s.loginAndContinue}
            </button>
          )}

          {errorMessage && <p className="gunma-commerce-error">{errorMessage}</p>}

          <p className="gunma-commerce-muted">
            {isRegister ? s.haveAccount : s.noAccount}{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setAuthMode(isRegister ? 'login' : 'register'); }}
            >
              {isRegister ? s.loginTab : s.registerTab}
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* ── Processing ──────────────────────────────────────────── */
  if (step === 'processing') {
    return (
      <div className="gunma-commerce">
        {header}
        <div className="gunma-commerce-success">
          <div className="gunma-commerce-spinner" />
          <p>{s.processing}</p>
        </div>
      </div>
    );
  }

  /* ── Failed ──────────────────────────────────────────────── */
  if (step === 'failed') {
    return (
      <div className="gunma-commerce">
        {header}
        <div className="gunma-commerce-section">
          <p className="gunma-commerce-error">{errorMessage ?? 'Something went wrong.'}</p>
          <button className="gunma-commerce-primary" style={{ backgroundColor: brandColor }} onClick={() => startCheckout()}>
            {s.tryAgain}
          </button>
        </div>
      </div>
    );
  }

  /* ── Delivery + payment ──────────────────────────────────── */
  if (step === 'delivery') {
    const cardEnabled = !!commerce.stripePublishableKey;
    return (
      <div className="gunma-commerce">
        {header}
        <div className="gunma-commerce-section">
          <h4 className="gunma-commerce-h">{s.delivery}</h4>
          {selectedAddress ? (
            <div className="gunma-commerce-address">
              <strong>{selectedAddress.name}</strong>
              <span>{selectedAddress.phone}</span>
              <span>
                {[selectedAddress.apartment, selectedAddress.street, selectedAddress.city, selectedAddress.state]
                  .filter(Boolean)
                  .join(', ')}
              </span>
              <span>〒{selectedAddress.postal_code}</span>
            </div>
          ) : (
            <p className="gunma-commerce-muted">No address selected.</p>
          )}
          {addresses.length > 1 && (
            <select
              className="gunma-commerce-input"
              value={selectedAddress?.id ?? ''}
              onChange={(e) => {
                const a = addresses.find((x) => String(x.id) === e.target.value);
                if (a) selectAddress(a);
              }}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — 〒{a.postal_code} {a.city}
                </option>
              ))}
            </select>
          )}

          <label className="gunma-commerce-label">{s.deliveryDate}</label>
          <input
            className="gunma-commerce-input"
            type="date"
            min={earliestDate ?? undefined}
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
          {deliveryInfo?.schedules?.length ? (
            <>
              <label className="gunma-commerce-label">{s.deliveryTime}</label>
              <select
                className="gunma-commerce-input"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              >
                {deliveryInfo.schedules.map((s) => (
                  <option key={s.id} value={s.schedule}>{s.schedule}</option>
                ))}
              </select>
            </>
          ) : null}

          {coins > 0 && (
            <label className="gunma-commerce-coins">
              <input
                type="checkbox"
                checked={appliedCoins > 0}
                onChange={(e) => setAppliedCoins(e.target.checked ? coins : 0)}
              />
              {s.useCoins(coins)}
            </label>
          )}
        </div>

        <div className="gunma-commerce-section">
          <h4 className="gunma-commerce-h">{s.payment}</h4>
          <div className="gunma-commerce-modes">
            <button
              className={`gunma-commerce-mode ${payMode === 'Cash' ? 'is-active' : ''}`}
              onClick={() => setPayMode('Cash')}
            >
              {s.cashOnDelivery}
            </button>
            {cardEnabled && (
              <button
                className={`gunma-commerce-mode ${payMode === 'Card' ? 'is-active' : ''}`}
                onClick={() => setPayMode('Card')}
              >
                {s.card}
              </button>
            )}
          </div>

          <div className="gunma-commerce-total-row">
            <span>{s.subtotal}</span><span>{money(symbol, subtotal)}</span>
          </div>
          <div className="gunma-commerce-total-row">
            <span>{s.tax}</span><span>{money(symbol, totalTax)}</span>
          </div>
          <div className="gunma-commerce-total-row">
            <span>{s.shipping}</span><span>{shippingCharge === 0 ? s.free : money(symbol, shippingCharge)}</span>
          </div>
          {appliedCoins > 0 && (
            <div className="gunma-commerce-total-row">
              <span>{s.coins}</span><span>-{money(symbol, appliedCoins)}</span>
            </div>
          )}
          <div className="gunma-commerce-total-row gunma-commerce-grand">
            <span>{s.total}</span><strong>{money(symbol, grandTotal)}</strong>
          </div>

          {payMode === 'Cash' ? (
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={loading || !deliveryDate || !deliveryTime}
              onClick={() => confirmCash()}
            >
              {loading ? 'Placing…' : s.placeOrderCash}
            </button>
          ) : (
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={loading || !deliveryDate || !deliveryTime}
              onClick={() => prepareCard()}
            >
              {s.continueToPayment}
            </button>
          )}
          {errorMessage && <p className="gunma-commerce-error">{errorMessage}</p>}
        </div>

        {payMode === 'Card' && commerce.stripeSecret && (
          <Elements
            stripe={getStripePromise(commerce.stripePublishableKey!)}
            options={{ clientSecret: commerce.stripeSecret }}
          >
            <StripePaymentForm commerce={commerce} brandColor={brandColor} symbol={symbol} strings={s} />
          </Elements>
        )}
      </div>
    );
  }

  /* ── Address choice (no default address) ─────────────────── */
  if (step === 'address') {
    return (
      <div className="gunma-commerce">
        {header}
        <div className="gunma-commerce-section">
          <p className="gunma-commerce-muted">{s.noAddress}</p>
          <a className="gunma-commerce-primary" style={{ backgroundColor: brandColor, textAlign: 'center' }}
             href="/new-address" target="_blank" rel="noreferrer">
            {s.addAddress}
          </a>
        </div>
      </div>
    );
  }

  /* ── Cart (default) ──────────────────────────────────────── */
  return (
    <div className="gunma-commerce">
      {header}
      <div className="gunma-commerce-section">
        {cart.length === 0 ? (
          <p className="gunma-commerce-muted">{s.cartEmpty}</p>
        ) : (
          <>
            {hasStockIssues && (
              <div className="gunma-commerce-stock-warning">
                <strong>⚠️ {s.stockIssueTitle}</strong>
                <ul>
                  {stockIssues.map((iss) => (
                    <li key={iss.id}>
                      <span className="gunma-commerce-stock-line">
                        <span>{iss.title} — {s.stockReason(iss.reason)}
                          {iss.reason === 'insufficient' && iss.available !== null
                            ? ` (${s.stockOnly(iss.available)}; ${s.stockRequested(iss.requested)})`
                            : ''}
                        </span>
                        <span className="gunma-commerce-stock-actions">
                          {iss.fixable && iss.available !== null && (
                            <button
                              className="gunma-commerce-stock-fix"
                              disabled={loading}
                              onClick={() => fixStockIssue(iss.id)}
                            >
                              {s.stockReduceTo(Math.max(1, iss.available))}
                            </button>
                          )}
                          <button
                            className="gunma-commerce-stock-remove"
                            disabled={loading}
                            onClick={() => removeStockIssue(iss.id)}
                          >
                            {s.stockRemove}
                          </button>
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                {stockIssues.length > 1 && (
                  <button
                    className="gunma-commerce-stock-fix-all"
                    disabled={loading}
                    onClick={() => fixAllStockIssues()}
                  >
                    {s.stockFixAll}
                  </button>
                )}
                {stockIssues.length === 1 && <span>{s.stockIssueHint}</span>}
              </div>
            )}
            {cart.map((item) => {
              const issue = stockIssues.find((x) => String(x.id) === String(item.id));
              return (
                <div key={item.id} className={`gunma-commerce-item ${issue ? 'gunma-commerce-item--invalid' : ''}`}>
                  {item.image && <img className="gunma-commerce-item-img" src={item.image} alt="" />}
                  <div className="gunma-commerce-item-body">
                    <span className="gunma-commerce-item-title">
                      {item.title ?? item.product_title ?? `#${item.product_id}`}
                    </span>
                    <span className="gunma-commerce-item-sub">
                      {item.quantity} × {money(symbol, Number(item.item_price || 0))}
                    </span>
                    {issue && <span className="gunma-commerce-item-bad">{s.stockReason(issue.reason)}</span>}
                  </div>
                  <button className="gunma-commerce-remove" onClick={() => removeItem(item.id)} aria-label="Remove">✕</button>
                </div>
              );
            })}
            <div className="gunma-commerce-total-row gunma-commerce-grand">
              <span>{s.subtotal}</span><strong>{money(symbol, subtotal)}</strong>
            </div>
            {subtotal < commerce.freeShippingThreshold && (
              <p className="gunma-commerce-muted">
                {s.freeShipHint(money(symbol, commerce.freeShippingThreshold - subtotal))}
              </p>
            )}
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={loading || hasStockIssues}
              onClick={() => startCheckout()}
            >
              {loading ? 'Please wait…' : s.checkout}
            </button>
            {errorMessage && <p className="gunma-commerce-error">{errorMessage}</p>}
          </>
        )}
      </div>
    </div>
  );
}
