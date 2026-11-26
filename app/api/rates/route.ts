import { NextResponse } from 'next/server';
import { isPositiveRate } from '@/lib/conversion';
import { MAX_SELECTION, isCurrencyCode } from '@/lib/currencies';

const WISE_RATES_URL = 'https://api.wise.com/v1/rates';
// 同一组货币对的汇率在服务端缓存 30 秒，与前端轮询间隔一致
const RATE_REVALIDATE_SECONDS = 30;
const MAX_TARGETS = MAX_SELECTION - 1;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

// Wise 可能返回数组或单个对象
function extractRate(data: unknown): number | null {
  const entry: unknown = Array.isArray(data) ? data[0] : data;
  if (typeof entry !== 'object' || entry === null) return null;

  const rate = (entry as Record<string, unknown>).rate;
  return isPositiveRate(rate) ? rate : null;
}

async function fetchRate(base: string, target: string, apiKey: string): Promise<number | null> {
  const url = new URL(WISE_RATES_URL);
  url.searchParams.set('source', base);
  url.searchParams.set('target', target);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: RATE_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    console.error(`Wise rate request ${base}->${target} failed with status ${response.status}`);
    return null;
  }

  return extractRate(await response.json());
}

function parseTargets(raw: string, base: string): string[] {
  const targets = raw
    .split(',')
    .map(target => target.trim().toUpperCase())
    .filter(target => target !== '' && target !== base);
  return Array.from(new Set(targets));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get('base') ?? 'CNY').trim().toUpperCase();
  const targets = parseTargets(searchParams.get('targets') ?? 'HKD,USD', base);

  if (!isCurrencyCode(base)) {
    return badRequest('Invalid base currency');
  }
  if (targets.length === 0) {
    return badRequest('At least one target currency is required');
  }
  if (targets.length > MAX_TARGETS) {
    return badRequest(`At most ${MAX_TARGETS} target currencies are allowed`);
  }
  if (!targets.every(isCurrencyCode)) {
    return badRequest('Invalid target currency');
  }

  const apiKey = process.env.WISE_API_KEY;
  if (!apiKey) {
    console.error('WISE_API_KEY is not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const results = await Promise.allSettled(targets.map(target => fetchRate(base, target, apiKey)));

  const rates = Object.fromEntries(
    targets.flatMap((target, index): [string, number][] => {
      const result = results[index];
      if (result.status === 'rejected') {
        console.error(`Error fetching rate ${base}->${target}:`, result.reason);
        return [];
      }
      return result.value === null ? [] : [[target, result.value]];
    }),
  );
  const missing = targets.filter(target => !(target in rates));

  if (missing.length === targets.length) {
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 502 });
  }

  return NextResponse.json({
    base,
    rates,
    missing,
    timestamp: new Date().toISOString(),
  });
}
