import { describe, expect, it } from 'vitest';
import { isCurrencyCode, parseCurrencyList, toCurrency } from './currencies';

describe('isCurrencyCode', () => {
  it('accepts three uppercase letters only', () => {
    expect(isCurrencyCode('USD')).toBe(true);
    expect(isCurrencyCode('usd')).toBe(false);
    expect(isCurrencyCode('US')).toBe(false);
    expect(isCurrencyCode('USD&x=1')).toBe(false);
    expect(isCurrencyCode(null)).toBe(false);
  });
});

describe('toCurrency', () => {
  it('uses local Chinese names, symbols and flags when known', () => {
    expect(toCurrency({ code: 'HKD', name: 'Hong Kong dollar' })).toEqual({
      code: 'HKD',
      name: '港币',
      symbol: 'HK$',
      flag: 'HK',
    });
  });

  it('falls back to the `currency` field and remote values', () => {
    expect(toCurrency({ currency: 'XYZ', name: 'Test', symbol: 'T' })).toEqual({
      code: 'XYZ',
      name: 'Test',
      symbol: 'T',
      flag: 'XY',
    });
  });

  it('returns null for unusable entries instead of throwing', () => {
    expect(toCurrency({ name: 'No code' })).toBeNull();
    expect(toCurrency({ code: 'bad' })).toBeNull();
    expect(toCurrency(null)).toBeNull();
    expect(toCurrency('USD')).toBeNull();
  });
});

describe('parseCurrencyList', () => {
  it('drops invalid entries and duplicates', () => {
    const list = parseCurrencyList([{ code: 'USD' }, { code: 'USD' }, { name: 'x' }, { code: 'EUR' }]);
    expect(list.map(c => c.code)).toEqual(['USD', 'EUR']);
  });

  it('returns an empty list for non-arrays', () => {
    expect(parseCurrencyList({ code: 'USD' })).toEqual([]);
  });
});
