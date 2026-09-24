'use client';

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { UseCommerceResult } from '../../hooks/useCommerce';

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
}

function money(symbol: string, n: number): string {
  return `${symbol}${Number(n || 0).toLocaleString('ja-JP')}`;
}

/** Stripe Payment Element form (mirrors storefront StripeFormChange). */
function StripePaymentForm({
  commerce,
  brandColor,
  symbol,
}: {
  commerce: UseCommerceResult;
  brandColor: string;
  symbol: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [complete, setComplete] = useState(false);
  const busy = commerce.loading;

  return (
    <div className="gunma-commerce-section">
      <div className="gunma-commerce-total-row">
        <span>Amount to pay</span>
        <strong>{money(symbol, commerce.grandTotal)}</strong>
      </div>
      <PaymentElement id="payment-element" onChange={(e) => setComplete(e.complete)} />
      <button
        className="gunma-commerce-primary"
        style={{ backgroundColor: brandColor }}
        disabled={busy || !stripe || !elements || !complete}
        onClick={() => commerce.confirmCard(stripe, elements)}
      >
        {busy ? 'Processing…' : `Pay ${money(symbol, commerce.grandTotal)}`}
      </button>
      {commerce.errorMessage && <p className="gunma-commerce-error">{commerce.errorMessage}</p>}
    </div>
  );
}

export function CommercePanel({ commerce, brandColor, onClose }: CommercePanelProps) {
  const symbol = commerce.currencySymbol;
  const {
    step, cart, subtotal, shippingCharge, totalTax, total, grandTotal,
    addresses, selectedAddress, selectAddress,
    deliveryInfo, earliestDate, deliveryDate, setDeliveryDate, deliveryTime, setDeliveryTime,
    coins, appliedCoins, setAppliedCoins,
    email, setEmail, customerName,
    successOrderId, errorMessage, loading,
    refreshCart, removeItem, startCheckout, confirmCash, prepareCard, login,
  } = commerce as UseCommerceResult & { email: string; setEmail: (v: string) => void };

  const [loginEmail, setLoginEmail] = useState(email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [payMode, setPayMode] = useState<'Cash' | 'Card'>('Cash');

  React.useEffect(() => {
    refreshCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const header = (
    <div className="gunma-commerce-head">
      <span>Checkout</span>
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
          <p>Order placed successfully!</p>
          {successOrderId != null && <p className="gunma-commerce-order">Order No. #{successOrderId}</p>}
          <button className="gunma-commerce-primary" style={{ backgroundColor: brandColor }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ── Login ───────────────────────────────────────────────── */
  if (step === 'auth') {
    return (
      <div className="gunma-commerce">
        {header}
        <div className="gunma-commerce-section">
          <p className="gunma-commerce-muted">Please log in to continue checkout.</p>
          <input
            className="gunma-commerce-input"
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <input
            className="gunma-commerce-input"
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
          <button
            className="gunma-commerce-primary"
            style={{ backgroundColor: brandColor }}
            disabled={loading || !loginEmail || !loginPassword}
            onClick={() => login(loginEmail, loginPassword)}
          >
            {loading ? 'Logging in…' : 'Log in & continue'}
          </button>
          {errorMessage && <p className="gunma-commerce-error">{errorMessage}</p>}
          <p className="gunma-commerce-muted">
            Prefer the website?{' '}
            <a href="/login?redirect=/checkout" target="_blank" rel="noreferrer">Log in here</a>, then reopen chat.
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
          <p>Processing your order…</p>
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
            Try again
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
          <h4 className="gunma-commerce-h">Delivery</h4>
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

          <label className="gunma-commerce-label">Delivery date</label>
          <input
            className="gunma-commerce-input"
            type="date"
            min={earliestDate ?? undefined}
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
          />
          {deliveryInfo?.schedules?.length ? (
            <>
              <label className="gunma-commerce-label">Delivery time</label>
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
              Use {coins} loyalty coins
            </label>
          )}
        </div>

        <div className="gunma-commerce-section">
          <h4 className="gunma-commerce-h">Payment</h4>
          <div className="gunma-commerce-modes">
            <button
              className={`gunma-commerce-mode ${payMode === 'Cash' ? 'is-active' : ''}`}
              onClick={() => setPayMode('Cash')}
            >
              Cash on Delivery
            </button>
            {cardEnabled && (
              <button
                className={`gunma-commerce-mode ${payMode === 'Card' ? 'is-active' : ''}`}
                onClick={() => setPayMode('Card')}
              >
                Credit / Debit Card
              </button>
            )}
          </div>

          <div className="gunma-commerce-total-row">
            <span>Subtotal</span><span>{money(symbol, subtotal)}</span>
          </div>
          <div className="gunma-commerce-total-row">
            <span>Tax</span><span>{money(symbol, totalTax)}</span>
          </div>
          <div className="gunma-commerce-total-row">
            <span>Shipping</span><span>{shippingCharge === 0 ? 'Free' : money(symbol, shippingCharge)}</span>
          </div>
          {appliedCoins > 0 && (
            <div className="gunma-commerce-total-row">
              <span>Coins</span><span>-{money(symbol, appliedCoins)}</span>
            </div>
          )}
          <div className="gunma-commerce-total-row gunma-commerce-grand">
            <span>Total</span><strong>{money(symbol, grandTotal)}</strong>
          </div>

          {payMode === 'Cash' ? (
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={loading || !deliveryDate || !deliveryTime}
              onClick={() => confirmCash()}
            >
              {loading ? 'Placing order…' : 'Place order (Cash)'}
            </button>
          ) : (
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={loading || !deliveryDate || !deliveryTime}
              onClick={() => prepareCard()}
            >
              Continue to payment
            </button>
          )}
          {errorMessage && <p className="gunma-commerce-error">{errorMessage}</p>}
        </div>

        {payMode === 'Card' && commerce.stripeSecret && (
          <Elements
            stripe={getStripePromise(commerce.stripePublishableKey!)}
            options={{ clientSecret: commerce.stripeSecret }}
          >
            <StripePaymentForm commerce={commerce} brandColor={brandColor} symbol={symbol} />
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
          <p className="gunma-commerce-muted">No delivery address found.</p>
          <a className="gunma-commerce-primary" style={{ backgroundColor: brandColor, textAlign: 'center' }}
             href="/new-address" target="_blank" rel="noreferrer">
            Add a new address
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
          <p className="gunma-commerce-muted">Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item) => (
              <div key={item.id} className="gunma-commerce-item">
                {item.image && <img className="gunma-commerce-item-img" src={item.image} alt="" />}
                <div className="gunma-commerce-item-body">
                  <span className="gunma-commerce-item-title">
                    {item.title ?? item.product_title ?? `#${item.product_id}`}
                  </span>
                  <span className="gunma-commerce-item-sub">
                    {item.quantity} × {money(symbol, Number(item.item_price || 0))}
                  </span>
                </div>
                <button className="gunma-commerce-remove" onClick={() => removeItem(item.id)} aria-label="Remove">✕</button>
              </div>
            ))}
            <div className="gunma-commerce-total-row gunma-commerce-grand">
              <span>Subtotal</span><strong>{money(symbol, subtotal)}</strong>
            </div>
            {subtotal < commerce.freeShippingThreshold && (
              <p className="gunma-commerce-muted">
                Add {money(symbol, commerce.freeShippingThreshold - subtotal)} more for free shipping.
              </p>
            )}
            <button
              className="gunma-commerce-primary"
              style={{ backgroundColor: brandColor }}
              disabled={loading}
              onClick={() => startCheckout()}
            >
              {loading ? 'Please wait…' : 'Checkout'}
            </button>
            {errorMessage && <p className="gunma-commerce-error">{errorMessage}</p>}
          </>
        )}
      </div>
    </div>
  );
}
