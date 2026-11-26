'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { parseRatesResponse, type RateTable } from '@/lib/conversion';

const POLL_INTERVAL_MS = 30_000;

export interface ExchangeRatesState {
  table: RateTable | null;
  /** 接口没有返回汇率的货币 */
  missing: readonly string[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface UseExchangeRatesResult extends ExchangeRatesState {
  refresh: () => void;
}

const INITIAL_STATE: ExchangeRatesState = {
  table: null,
  missing: [],
  loading: false,
  error: null,
  lastUpdate: null,
};

/**
 * 以 codes[0] 为基准获取汇率，每 30 秒轮询一次；页面在后台时暂停轮询，
 * 回到前台立即刷新。过期的请求会被取消或忽略，不会覆盖新的结果。
 */
export function useExchangeRates(codes: readonly string[], enabled: boolean): UseExchangeRatesResult {
  const [state, setState] = useState<ExchangeRatesState>(INITIAL_STATE);
  const latestRequestRef = useRef(0);
  const codesKey = codes.join(',');

  const fetchRates = useCallback(async (signal?: AbortSignal): Promise<void> => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    const [base, ...targets] = codesKey.split(',');
    if (!base) {
      setState(INITIAL_STATE);
      return;
    }
    if (targets.length === 0) {
      setState({ table: { base, rates: {} }, missing: [], loading: false, error: null, lastUpdate: new Date() });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const params = new URLSearchParams({ base, targets: targets.join(',') });
      const response = await fetch(`/api/rates?${params.toString()}`, { signal });
      if (!response.ok) {
        throw new Error(`Rates request failed with status ${response.status}`);
      }

      const parsed = parseRatesResponse(await response.json());
      if (!parsed) {
        throw new Error('Rates response has an unexpected shape');
      }

      if (requestId !== latestRequestRef.current) return;
      setState({ ...parsed, loading: false, error: null, lastUpdate: new Date() });
    } catch (error: unknown) {
      if (requestId !== latestRequestRef.current) return;
      if (signal?.aborted) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }
      console.error('Error fetching rates:', error);
      setState(prev => ({ ...prev, loading: false, error: '获取汇率失败，请稍后重试' }));
    }
  }, [codesKey]);

  useEffect(() => {
    if (!enabled) return;

    let controller = new AbortController();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const run = () => {
      controller.abort();
      controller = new AbortController();
      void fetchRates(controller.signal);
    };
    const start = () => {
      if (intervalId !== null) return;
      run();
      intervalId = setInterval(run, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };
    const handleVisibilityChange = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      controller.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, fetchRates]);

  const refresh = useCallback(() => {
    void fetchRates();
  }, [fetchRates]);

  return { ...state, refresh };
}
