import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrderById } from '@/lib/analytics';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Updated to handle Next.js 15 params promise
) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const data = await getOrderById(id);
    
    if (!data) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
