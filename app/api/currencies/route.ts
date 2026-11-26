import { NextResponse } from 'next/server';
import { parseCurrencyList } from '@/lib/currencies';

// 不在构建时预渲染（构建环境可能没有 API Key），缓存交给下面 fetch 的 revalidate
export const dynamic = 'force-dynamic';

const WISE_CURRENCIES_URL = 'https://api.wise.com/v1/currencies';
// 货币列表几乎不变，缓存一天
const CURRENCIES_REVALIDATE_SECONDS = 60 * 60 * 24;

export async function GET() {
  const apiKey = process.env.WISE_API_KEY;

  if (!apiKey) {
    console.error('WISE_API_KEY is not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(WISE_CURRENCIES_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: CURRENCIES_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Wise currencies request failed with status ${response.status}`);
    }

    const currencies = parseCurrencyList(await response.json());
    if (currencies.length === 0) {
      throw new Error('Wise returned no usable currencies');
    }

    return NextResponse.json({
      currencies,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 502 });
  }
}
