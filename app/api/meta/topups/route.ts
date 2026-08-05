import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB, MetaTopup } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    await connectDB();

    const { date, amount, reference } = data;
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const gst_amount = amount - (amount / 1.18);
    const media_budget_added = amount - gst_amount;

    const topup = new MetaTopup({
      date: date ? new Date(date) : new Date(),
      amount,
      gst_amount,
      media_budget_added,
      reference
    });
    
    await topup.save();
    return NextResponse.json({ success: true, topup });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await connectDB();
    await MetaTopup.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
