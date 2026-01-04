import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = searchParams.get('base') || 'CNY';
  const targets = searchParams.get('targets') || 'HKD,USD';

  const apiKey = process.env.WISE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const targetArray = targets.split(',');
    const rates: { [key: string]: number } = {};

    // 获取每个目标货币的汇率
    for (const target of targetArray) {
      const response = await fetch(
        `https://api.wise.com/v1/rates?source=${base}&target=${target}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch rate for ${base} to ${target}`);
      }

      const data = await response.json();
      
      // Wise API 返回的数据格式可能是数组
      if (Array.length && data[0]?.rate) {
        rates[target] = data[0].rate;
      } else if (data.rate) {
        rates[target] = data.rate;
      }
    }

    return NextResponse.json({
      base,
      rates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
