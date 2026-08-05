import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { fetchPayments, fetchOrders, fetchRefunds, testConnection } from '@/lib/razorpay';
import { connectDB, Order } from '@/lib/db';
import { getDateRange } from '@/lib/analytics';

function toUnix(d: Date) { return Math.floor(d.getTime() / 1000); }

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);

  try {
    const [paymentsData, ordersData, refundsData, connected] = await Promise.allSettled([
      fetchPayments(toUnix(range.from), toUnix(range.to), 100),
      fetchOrders(toUnix(range.from), toUnix(range.to), 100),
      fetchRefunds(toUnix(range.from), toUnix(range.to)),
      testConnection(),
    ]);

    const payments = paymentsData.status === 'fulfilled' ? paymentsData.value?.items || [] : [];
    const orders = ordersData.status === 'fulfilled' ? ordersData.value?.items || [] : [];
    const refunds = refundsData.status === 'fulfilled' ? refundsData.value?.items || [] : [];
    const isConnected = connected.status === 'fulfilled' ? connected.value : false;

    // Compute metrics
    const successPayments = payments.filter((p: any) => p.status === 'captured');
    const failedPayments = payments.filter((p: any) => p.status === 'failed');
    const grossRevenue = successPayments.reduce((s: number, p: any) => s + (p.amount || 0) / 100, 0);
    const totalFees = successPayments.reduce((s: number, p: any) => s + (p.fee || 0) / 100, 0);
    const totalTax = successPayments.reduce((s: number, p: any) => s + (p.tax || 0) / 100, 0);
    const totalRefunds = refunds.reduce((s: number, r: any) => s + (r.amount || 0) / 100, 0);

    // Payment method breakdown
    const methodMap: Record<string, number> = {};
    successPayments.forEach((p: any) => {
      const m = p.method || 'other';
      methodMap[m] = (methodMap[m] || 0) + (p.amount || 0) / 100;
    });

    // DB reconciliation — compare Razorpay orders with DB orders
    await connectDB();
    const dbOrderIds = new Set(
      (await Order.find({}, { order_id: 1 }).lean()).map((o: any) => o.order_id)
    );
    const missingInDB = orders.filter((o: any) => !dbOrderIds.has(o.id));

    return NextResponse.json({
      connected: isConnected,
      summary: {
        totalPayments: payments.length,
        successfulPayments: successPayments.length,
        failedPayments: failedPayments.length,
        pendingPayments: payments.filter((p: any) => p.status === 'created').length,
        grossRevenue,
        totalFees,
        totalFeeGST: totalTax,
        totalRefunds,
        netSettlement: grossRevenue - totalFees - totalTax - totalRefunds,
      },
      methodBreakdown: Object.entries(methodMap).map(([method, amount]) => ({ method, amount })),
      recentPayments: payments.slice(0, 20).map((p: any) => ({
        id: p.id,
        orderId: p.order_id,
        amount: (p.amount || 0) / 100,
        currency: p.currency,
        status: p.status,
        method: p.method,
        fee: (p.fee || 0) / 100,
        tax: (p.tax || 0) / 100,
        createdAt: new Date(p.created_at * 1000).toISOString(),
        contact: p.contact,
        email: p.email,
      })),
      reconciliation: {
        razorpayOrderCount: orders.length,
        dbOrderCount: dbOrderIds.size,
        missingInDB: missingInDB.length,
        missingOrderIds: missingInDB.slice(0, 5).map((o: any) => o.id),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, connected: false }, { status: 500 });
  }
}
