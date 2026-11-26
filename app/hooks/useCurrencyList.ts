'use client';

import { useEffect, useState } from 'react';
import { FALLBACK_CURRENCIES, parseCurrencyList, type Currency } from '@/lib/currencies';

export interface CurrencyListState {
  currencies: readonly Currency[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: CurrencyListState = {
  currencies: FALLBACK_CURRENCIES,
  loading: true,
  error: null,
};

/** 获取 Wise 支持的货币列表，失败时退回默认列表 */
export function useCurrencyList(): CurrencyListState {
  const [state, setState] = useState<CurrencyListState>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();

    const load = async (): Promise<void> => {
      try {
        const response = await fetch('/api/currencies', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Currencies request failed with status ${response.status}`);
        }

        const data: unknown = await response.json();
        const raw = typeof data === 'object' && data !== null
          ? (data as Record<string, unknown>).currencies
          : undefined;
        const currencies = parseCurrencyList(raw);
        if (currencies.length === 0) {
          throw new Error('Currencies response contained no usable currencies');
        }

        setState({ currencies, loading: false, error: null });
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        console.error('Error fetching currencies:', error);
        setState({
          currencies: FALLBACK_CURRENCIES,
          loading: false,
          error: '货币列表加载失败，已使用默认列表',
        });
      }
    };

    void load();
    return () => controller.abort();
  }, []);

  return state;
}
