import { describe, expect, it } from 'vitest';
import { parseStoredAmount, parseStoredCodes, parseStoredSelected } from './storage';

describe('parseStoredCodes', () => {
  it('keeps valid, unique codes up to the selection limit', () => {
    expect(parseStoredCodes('["CNY","usd","CNY","HKD","EUR","GBP","JPY","KRW"]')).toEqual([
      'CNY',
      'HKD',
      'EUR',
      'GBP',
      'JPY',
    ]);
  });

  it.each([null, '', 'not json', '{"a":1}', '[]', '["x"]'])('returns null for %j', raw => {
    expect(parseStoredCodes(raw)).toBeNull();
  });
});

describe('parseStoredAmount', () => {
  it('accepts valid amounts and an empty input', () => {
    expect(parseStoredAmount('100')).toBe('100');
    expect(parseStoredAmount('')).toBe('');
  });

  it('rejects invalid amounts', () => {
    expect(parseStoredAmount('-1')).toBeNull();
    expect(parseStoredAmount('abc')).toBeNull();
    expect(parseStoredAmount(null)).toBeNull();
  });
});

describe('parseStoredSelected', () => {
  it('accepts only currency codes', () => {
    expect(parseStoredSelected('USD')).toBe('USD');
    expect(parseStoredSelected('<script>')).toBeNull();
    expect(parseStoredSelected(null)).toBeNull();
  });
});
