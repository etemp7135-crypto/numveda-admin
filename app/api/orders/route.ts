import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getRecentOrders } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const page = parseInt(req.nextUrl.searchParams.get('page') || '0');
  const query = req.nextUrl.searchParams.get('q') || undefined;

  try {
    const { orders, total } = await getRecentOrders(limit, page, query);
    
    return NextResponse.json({
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
