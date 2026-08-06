import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB, Order } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
  const page = parseInt(req.nextUrl.searchParams.get('page') || '0');
  const query = req.nextUrl.searchParams.get('q') || undefined;
  const status = req.nextUrl.searchParams.get('status') || undefined;
  const type = req.nextUrl.searchParams.get('type') || undefined;

  try {
    await connectDB();
    
    const filter: any = {};
    
    if (query) {
      filter.$or = [
        { order_id: { $regex: query, $options: 'i' } },
        { payment_id: { $regex: query, $options: 'i' } },
        { 'customer_details.name': { $regex: query, $options: 'i' } },
        { 'customer_details.phone': { $regex: query, $options: 'i' } },
      ];
    }
    
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    if (type && type !== 'All') {
      filter['customer_details.type'] = type;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ created_at: -1 }).skip(page * limit).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    
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
