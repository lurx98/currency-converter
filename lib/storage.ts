import { parseAmount } from './conversion';
import { MAX_SELECTION, isCurrencyCode } from './currencies';

const STORAGE_KEYS = {
  codes: 'currency-converter-selected-currencies',
  amount: 'currency-converter-amount',
  selected: 'currency-converter-selected-currency',
} as const;

export type PreferenceKey = keyof typeof STORAGE_KEYS;

export interface StoredPreferences {
  codes: string[] | null;
  amount: string | null;
  selected: string | null;
}

const EMPTY_PREFERENCES: StoredPreferences = { codes: null, amount: null, selected: null };

/** 解析保存的货币列表：丢弃无效代码、去重、限制数量，结果为空时返回 null */
export function parseStoredCodes(raw: string | null): string[] | null {
  if (raw === null) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const codes = Array.from(new Set(parsed.filter(isCurrencyCode))).slice(0, MAX_SELECTION);
    return codes.length > 0 ? codes : null;
  } catch {
    return null;
  }
}

/** 允许空字符串（用户清空了输入框），其他情况必须是有效金额 */
export function parseStoredAmount(raw: string | null): string | null {
  if (raw === null) return null;
  return raw === '' || parseAmount(raw) !== null ? raw : null;
}

export function parseStoredSelected(raw: string | null): string | null {
  return isCurrencyCode(raw) ? raw : null;
}

export function readPreferences(): StoredPreferences {
  try {
    return {
      codes: parseStoredCodes(localStorage.getItem(STORAGE_KEYS.codes)),
      amount: parseStoredAmount(localStorage.getItem(STORAGE_KEYS.amount)),
      selected: parseStoredSelected(localStorage.getItem(STORAGE_KEYS.selected)),
    };
  } catch (error: unknown) {
    console.error('Error reading preferences from localStorage:', error);
    return EMPTY_PREFERENCES;
  }
}

export function writePreference(key: PreferenceKey, value: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], value);
  } catch (error: unknown) {
    console.error(`Error saving "${key}" to localStorage:`, error);
  }
}
