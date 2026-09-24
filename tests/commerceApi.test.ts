import { describe, it, expect } from 'vitest';
import { CommerceApi } from '../src/lib/commerceApi';

describe('CommerceApi.bodyIndicatesError', () => {
  it('flags success:false bodies (HTTP 200 failures)', () => {
    expect(CommerceApi.bodyIndicatesError({ success: false })).toBe(true);
    expect(CommerceApi.bodyIndicatesError({ success: false, message: 'Stock error' })).toBe(true);
  });

  it('flags in-body status >= 400', () => {
    expect(CommerceApi.bodyIndicatesError({ status: 422, errors: ['out of stock'] })).toBe(true);
    expect(CommerceApi.bodyIndicatesError({ status: 401, message: 'Something went wrong' })).toBe(true);
    expect(CommerceApi.bodyIndicatesError({ status: 400 })).toBe(true);
  });

  it('does not flag successful bodies', () => {
    expect(CommerceApi.bodyIndicatesError({ success: true, status: 200, data: { id: 1 } })).toBe(false);
    expect(CommerceApi.bodyIndicatesError({ status: 200 })).toBe(false);
    expect(CommerceApi.bodyIndicatesError(null)).toBe(false);
    expect(CommerceApi.bodyIndicatesError('ok')).toBe(false);
  });
});
