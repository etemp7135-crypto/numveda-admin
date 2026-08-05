import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Basic mock data for alerts (in a real system, you'd calculate this based on thresholds)
  const alerts = [
    { id: 1, type: 'warning', message: 'Conversion rate dropped by 15% today compared to last 7 days average.', time: new Date().toISOString() },
    { id: 2, type: 'info', message: 'Meta ad spend increased by 20% on campaign "NumVeda_Broad".', time: new Date(Date.now() - 86400000).toISOString() },
    { id: 3, type: 'danger', message: '3 failed payments detected from UPI method in the last hour.', time: new Date(Date.now() - 3600000).toISOString() },
  ];

  return NextResponse.json(alerts);
}
