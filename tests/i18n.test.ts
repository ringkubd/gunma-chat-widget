import { describe, it, expect } from 'vitest';
import { getStrings } from '../src/lib/i18n';

describe('i18n', () => {
  it('returns English by default', () => {
    expect(getStrings().online).toBe('Online');
    expect(getStrings(undefined).checkout).toBe('Checkout');
  });

  it('returns Bengali strings', () => {
    const bn = getStrings('bn');
    expect(bn.online).toBe('অনলাইন');
    expect(bn.total).toBe('মোট');
  });

  it('returns Japanese strings', () => {
    const ja = getStrings('ja');
    expect(ja.total).toBe('合計');
  });

  it('interpolates coin/shipment helpers', () => {
    expect(getStrings('en').useCoins(50)).toContain('50');
    expect(getStrings('bn').freeShipHint('¥500')).toContain('¥500');
  });
});
