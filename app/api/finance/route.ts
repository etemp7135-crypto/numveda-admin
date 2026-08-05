import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrderMetrics, getDateRange } from '@/lib/analytics';
import { calculatePL } from '@/lib/finance';
import { fetchAdAccountInsights, metaConfigured } from '@/lib/meta';
import { connectDB, MetaTopup } from '@/lib/db';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.authenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const period = req.nextUrl.searchParams.get('period') || '30d';
  const range = getDateRange(period);
  const dateFrom = format(range.from, 'yyyy-MM-dd');
  const dateTo = format(range.to, 'yyyy-MM-dd');

  try {
    await connectDB();
    const metrics = await getOrderMetrics(range);
    
    let metaMediaSpend = 0;
    let pastMetaMediaSpend = 0;
    
    if (metaConfigured) {
      try {
        const { subMonths } = require('date-fns');
        const maxPastDate = format(subMonths(new Date(), 36), 'yyyy-MM-dd');
        const [insightsRes, pastInsightsRes] = await Promise.all([
          fetchAdAccountInsights(dateFrom, dateTo),
          fetchAdAccountInsights(maxPastDate, dateFrom) // Max 37 months for Meta
        ]);
        
        if (insightsRes?.data?.[0]) {
          metaMediaSpend = parseFloat(insightsRes.data[0].spend) || 0;
        }
        if (pastInsightsRes?.data?.[0]) {
          pastMetaMediaSpend = parseFloat(pastInsightsRes.data[0].spend) || 0;
        }
      } catch (e) {
        console.error("Failed to fetch Meta spend for P&L", e);
      }
    }

    const pl = calculatePL({
      grossRevenue: metrics.grossRevenue,
      refunds: metrics.refundAmount,
      razorpayFees: metrics.estimatedRazorpayFees,
      metaMediaSpend,
      otherExpenses: 0, 
      applyGSTOnRazorpay: true,
      applyGSTOnMeta: true,
    });

    const marginBeforeMarketing = metrics.grossRevenue > 0 
      ? (metrics.grossRevenue - metrics.refundAmount - pl.razorpayFees - pl.razorpayGST - pl.otherExpenses) / metrics.grossRevenue
      : 0;
    const breakEvenROAS = marginBeforeMarketing > 0 ? (1 / marginBeforeMarketing) * 1.18 : 0;

    // ─── Wallet Reconciliation ───
    const topups = await MetaTopup.find({
      date: { $gte: range.from, $lte: range.to }
    }).sort({ date: -1 });

    const topupsBefore = await MetaTopup.aggregate([
      { $match: { date: { $lt: range.from } } },
      { $group: { _id: null, totalAdded: { $sum: "$amount" } } }
    ]);
    const totalCashAddedBefore = topupsBefore[0]?.totalAdded || 0;
    
    const pastMetaCashCost = pastMetaMediaSpend * 1.18;
    const openingBalance = totalCashAddedBefore - pastMetaCashCost;
    
    const currentPeriodAdded = topups.reduce((acc, t) => acc + t.amount, 0);
    const closingBalance = openingBalance + currentPeriodAdded - pl.totalMetaCashCost;

    return NextResponse.json({
      period,
      pl,
      breakEven: {
        roas: breakEvenROAS,
        marginBeforeMarketing: marginBeforeMarketing * 100,
      },
      wallet: {
        openingBalance,
        totalAdded: currentPeriodAdded,
        totalConsumed: pl.totalMetaCashCost,
        closingBalance,
        topups
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
