import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ set_num: string }> }) {
  // Extract query params for piece count and year to make the mock price realistic
  // Await the params
  await params;
  const { searchParams } = new URL(request.url);
  const parts = parseInt(searchParams.get('parts') || '0', 10);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);

  // Mock Pricing Logic
  // MSRP: Roughly $0.10 per part
  const baseMsrp = Math.max(9.99, Math.round((parts * 0.10) / 5) * 5 - 0.01);
  
  // Current Value: Appreciates over time (older sets are worth more), some randomness
  const age = new Date().getFullYear() - year;
  const appreciationFactor = 1 + (Math.max(0, age) * 0.08); // 8% appreciation per year
  const randomModifier = 0.8 + (Math.random() * 0.6); // Random multiplier between 0.8x and 1.4x
  
  const currentValue = parseFloat((baseMsrp * appreciationFactor * randomModifier).toFixed(2));

  // Small delay to simulate API calculation
  await new Promise(res => setTimeout(res, 800));

  return NextResponse.json({
    msrp: baseMsrp,
    currentValue: currentValue > baseMsrp ? currentValue : baseMsrp, // Sets rarely drop below MSRP conceptually for this fun display
    currency: 'USD'
  });
}
