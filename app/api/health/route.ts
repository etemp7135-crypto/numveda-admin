import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { testConnection as testRzp } from '@/lib/razorpay';
import { testMetaConnection } from '@/lib/meta';
import { connectDB, Order, Event } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let mongoOk = false;
    let orderCount = 0;
    let eventCount = 0;
    let lastEvent = null;

    try {
      await connectDB();
      mongoOk = true;
      orderCount = await Order.countDocuments();
      eventCount = await Event.countDocuments();
      const latest = await Event.findOne().sort({ timestamp: -1 }).select('timestamp').lean();
      if (latest) lastEvent = (latest as any).timestamp;
    } catch (e) {
      console.error('Mongo health check failed', e);
    }

    const [rzpOk, metaOk] = await Promise.all([
      testRzp(),
      testMetaConnection(),
    ]);

    return NextResponse.json({
      status: (mongoOk && rzpOk) ? 'healthy' : 'degraded',
      integrations: {
        mongodb: {
          status: mongoOk ? 'connected' : 'error',
          stats: { orderCount, eventCount, lastEvent }
        },
        razorpay: {
          status: rzpOk ? 'connected' : 'error',
          mode: 'live' // since we use live keys
        },
        meta: {
          status: metaOk ? 'connected' : 'error_or_not_configured'
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
