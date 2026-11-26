import { describe, expect, it } from 'vitest';
import {
  convert,
  formatAmount,
  formatRate,
  getRate,
  parseAmount,
  parseRatesResponse,
  type RateTable,
} from './conversion';

const table: RateTable = { base: 'CNY', rates: { HKD: 1.1, USD: 0.14 } };

describe('convert', () => {
  it('returns the same amount for the same currency, even without rates', () => {
    expect(convert(100, 'USD', 'USD', null)).toBe(100);
  });

  it('converts from the base currency', () => {
    expect(convert(100, 'CNY', 'HKD', table)).toBeCloseTo(110);
  });

  it('converts to the base currency', () => {
    expect(convert(14, 'USD', 'CNY', table)).toBeCloseTo(100);
  });

  it('cross-converts between two non-base currencies', () => {
    expect(convert(110, 'HKD', 'USD', table)).toBeCloseTo(14);
  });

  it('uses the table base, not the current list order', () => {
    // 用户把 USD 拖到第一位后，旧的 CNY 基准汇率表仍然能算出正确结果
    expect(convert(1, 'USD', 'HKD', table)).toBeCloseTo(1.1 / 0.14);
  });

  it('returns null when a rate is missing or invalid', () => {
    expect(convert(100, 'CNY', 'EUR', table)).toBeNull();
    expect(convert(100, 'CNY', 'HKD', null)).toBeNull();
    expect(convert(100, 'CNY', 'HKD', { base: 'CNY', rates: { HKD: 0 } })).toBeNull();
  });
});

describe('getRate', () => {
  it('returns 1 for the same currency and cross rates otherwise', () => {
    expect(getRate(table, 'HKD', 'HKD')).toBe(1);
    expect(getRate(table, 'CNY', 'USD')).toBeCloseTo(0.14);
    expect(getRate(table, 'USD', 'CNY')).toBeCloseTo(1 / 0.14);
  });
});

describe('parseAmount', () => {
  it.each([
    ['100', 100],
    ['0', 0],
    ['12.5', 12.5],
  ])('parses %s', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '-5', 'Infinity'])('rejects %j', input => {
    expect(parseAmount(input)).toBeNull();
  });
});

describe('formatting', () => {
  it('formats amounts and rates with fixed precision', () => {
    expect(formatAmount(1.005)).toBe('1.00');
    expect(formatAmount(12)).toBe('12.00');
    expect(formatRate(0.1234567)).toBe('0.1235');
  });
});

describe('parseRatesResponse', () => {
  it('keeps only valid codes and positive rates', () => {
    expect(
      parseRatesResponse({
        base: 'CNY',
        rates: { HKD: 1.1, USD: -1, eur: 0.13, GBP: 'x' },
        missing: ['JPY', 42],
      }),
    ).toEqual({ table: { base: 'CNY', rates: { HKD: 1.1 } }, missing: ['JPY'] });
  });

  it('defaults missing to an empty list', () => {
    expect(parseRatesResponse({ base: 'CNY', rates: {} })?.missing).toEqual([]);
  });

  it.each([null, 'x', {}, { base: 'cny', rates: {} }, { base: 'CNY', rates: null }])(
    'rejects malformed payload %j',
    payload => {
      expect(parseRatesResponse(payload)).toBeNull();
    },
  );
});
