import { describe, it, expect } from 'vitest';
import { computeStockIssues } from '../src/hooks/useCommerce';
import type { CommerceCartItem } from '../src/types';

function item(overrides: Partial<CommerceCartItem> & { product?: any }): CommerceCartItem {
  return {
    id: 1,
    product_id: 10,
    title: 'Test Product',
    quantity: 2,
    item_price: 100,
    total_amount: 200,
    product: { status: 'Active', is_online_available: 'Yes', total_available_quantity: 10 },
    ...overrides,
  } as CommerceCartItem;
}

describe('computeStockIssues', () => {
  it('returns no issues when stock is sufficient', () => {
    expect(computeStockIssues([item({})])).toHaveLength(0);
  });

  it('flags out-of-stock (available 0) as not fixable', () => {
    const issues = computeStockIssues([item({ product: { status: 'Active', is_online_available: 'Yes', total_available_quantity: 0 } })]);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toBe('out_of_stock');
    expect(issues[0].fixable).toBe(false);
  });

  it('flags insufficient stock as fixable with available count', () => {
    const issues = computeStockIssues([item({ quantity: 5, product: { status: 'Active', is_online_available: 'Yes', total_available_quantity: 3 } })]);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toBe('insufficient');
    expect(issues[0].fixable).toBe(true);
    expect(issues[0].available).toBe(3);
    expect(issues[0].requested).toBe(5);
  });

  it('flags inactive products as unavailable', () => {
    const issues = computeStockIssues([item({ product: { status: 'Inactive', is_online_available: 'Yes', total_available_quantity: 10 } })]);
    expect(issues[0].reason).toBe('unavailable');
  });

  it('flags products not online-available', () => {
    const issues = computeStockIssues([item({ product: { status: 'Active', is_online_available: 'No', total_available_quantity: 10 } })]);
    expect(issues[0].reason).toBe('offline');
  });

  it('falls back to summing stocks when total_available_quantity is absent', () => {
    const issues = computeStockIssues([item({ quantity: 3, product: { status: 'Active', is_online_available: 'Yes', stocks: [{ available_quantity: 1 }, { available_quantity: 1 }] } })]);
    expect(issues).toHaveLength(1);
    expect(issues[0].available).toBe(2);
  });

  it('ignores items without embedded product data', () => {
    expect(computeStockIssues([item({ product: null })])).toHaveLength(0);
  });
});
