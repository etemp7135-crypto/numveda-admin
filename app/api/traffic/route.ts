import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTrafficSources, getDateRange } from '@/lib/analytics';
import { connectDB, Event } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);

  try {
    await connectDB();
    const { from, to } = range;

    const [trafficData, deviceData] = await Promise.all([
      getTrafficSources(range),
      Event.aggregate([
        { $match: { timestamp: { $gte: from, $lte: to }, event_name: 'page_view' } },
        { $group: {
          _id: '$device_type',
          sessions: { $addToSet: '$session_id' },
        }},
        { $project: {
          device: { $ifNull: ['$_id', 'unknown'] },
          sessionCount: { $size: '$sessions' },
        }},
        { $sort: { sessionCount: -1 } },
      ]),
    ]);

    return NextResponse.json({
      period,
      traffic: trafficData,
      devices: deviceData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
