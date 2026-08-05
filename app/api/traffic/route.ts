import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTrafficSources, getDateRange } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);

  try {
    const data = await getTrafficSources(range);
    
    return NextResponse.json({
      period,
      traffic: data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
