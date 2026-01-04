import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.WISE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      'https://api.wise.com/v1/currencies',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch currencies');
    }

    const currencies = await response.json();

    return NextResponse.json({
      currencies,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}
